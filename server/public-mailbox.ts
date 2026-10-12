import { eq, desc, sql, and } from "drizzle-orm";
import { getDb } from "./db";
import { publicLetters, stars, dailyQuotes, letters, publicModerationRequests } from "../drizzle/schema";
import { evaluatePublication } from "./safety/publication";
import { generateDailyQuote } from "./llm-hybrid";
import { withDistributedLock } from "./_core/redis-lock";

/**
 * 获取公共信箱列表
 */
export async function getPublicMailbox(sortBy: "latest" | "mostShared" = "latest", limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const query = sortBy === "latest"
    ? db.select().from(publicLetters).where(eq(publicLetters.moderationStatus, "approved")).orderBy(desc(publicLetters.createdAt)).limit(limit).offset(offset)
    : db.select().from(publicLetters).where(eq(publicLetters.moderationStatus, "approved")).orderBy(desc(publicLetters.starCount)).limit(limit).offset(offset);

  return await query;
}

/**
 * 获取公共信件详情
 */
export async function getPublicLetter(publicLetterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(publicLetters).where(and(eq(publicLetters.id, publicLetterId), eq(publicLetters.moderationStatus, "approved"))).limit(1);
  if (result.length === 0) return null;

  const publicLetter = result[0];
  return {
    ...publicLetter,
    content: publicLetter.excerpt,
  };
}

/**
 * 发布信件到公共信箱
 */
export async function publishToPublicMailbox(
  letterId: number,
  userId: number,
  excerpt: string,
  emotionTags: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const source = await db.select().from(letters).where(eq(letters.id, letterId)).limit(1);
  if (!source[0] || source[0].userId !== userId) throw new Error("Letter not found");
  const decision = evaluatePublication({
    content: excerpt,
    publicConsent: source[0].publicConsent,
    riskLevel: source[0].riskLevel,
    requiresHumanReview: source[0].requiresHumanReview,
  });
  if (!decision.allowed) {
    if (decision.requiresHumanReview) {
      await db.insert(publicModerationRequests).values({
        letterId,
        userId,
        proposedExcerpt: excerpt,
        redactedExcerpt: decision.redaction.redacted.slice(0, 500),
        redactionFields: decision.redaction.fields,
        reason: decision.reason,
        status: "pending",
      }).onConflictDoNothing({ target: publicModerationRequests.letterId });
      return { status: "pending_review" };
    }
    throw new Error(decision.reason);
  }

  const result = await db.insert(publicLetters).values({
    letterId,
    userId,
    excerpt: decision.redaction.redacted.slice(0, 500),
    moderationStatus: "approved",
    redactionFields: decision.redaction.fields,
    reviewedAt: new Date(),
    emotionTags: emotionTags || source[0].emotionTags,
    starCount: 0,
  });

  return result;
}

/**
 * 点亮星星（共鸣互动）
 */
export async function toggleStar(userId: number, publicLetterId: number) {
  return withDistributedLock(`star-toggle:${userId}:${publicLetterId}`, () =>
    toggleStarUnlocked(userId, publicLetterId),
  );
}

async function toggleStarUnlocked(userId: number, publicLetterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete first: when a row exists this is the toggle-off path. The
  // conditional write is safe across processes and does not require a lock.
  const removed = await db
    .delete(stars)
    .where(sql`${stars.userId} = ${userId} AND ${stars.publicLetterId} = ${publicLetterId}`);

  if ((removed.rowCount ?? 0) > 0) {
    await db.update(publicLetters)
      .set({ starCount: sql`GREATEST(${publicLetters.starCount} - 1, 0)` })
      .where(eq(publicLetters.id, publicLetterId));
    return { starred: false };
  }

  const inserted = await db.insert(stars).values({
    userId,
    publicLetterId,
  }).onConflictDoNothing({ target: [stars.userId, stars.publicLetterId] });

  if ((inserted.rowCount ?? 0) > 0) {
    await db.update(publicLetters)
      .set({ starCount: sql`${publicLetters.starCount} + 1` })
      .where(eq(publicLetters.id, publicLetterId));
  }

  return { starred: true };
}

/**
 * 检查用户是否已点亮某条信件
 */
export async function hasUserStarred(userId: number, publicLetterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(stars)
    .where(sql`${stars.userId} = ${userId} AND ${stars.publicLetterId} = ${publicLetterId}`)
    .limit(1);

  return result.length > 0;
}

/**
 * 获取今日一句
 */
export async function getTodayQuote() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date().toISOString().split("T")[0] as any;
  const result = await db
    .select()
    .from(dailyQuotes)
    .where(eq(dailyQuotes.date, today))
    .limit(1);

  if (result.length === 0) return null;

  const quote = result[0];
  const letterResult = await db
    .select()
    .from(publicLetters)
    .where(and(eq(publicLetters.letterId, quote.letterId), eq(publicLetters.moderationStatus, "approved")))
    .limit(1);

  return {
    ...quote,
    publicLetter: letterResult[0] || null,
  };
}

/**
 * 自动选择并设置今日一句
 */
export async function selectDailyQuote() {
  const today = new Date().toISOString().split("T")[0];
  return withDistributedLock(`daily-quote:${today}`, selectDailyQuoteUnlocked, {
    ttlMs: 60_000,
    waitMs: 5_000,
  });
}

async function selectDailyQuoteUnlocked() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date().toISOString().split("T")[0];

  // 检查今天是否已有一句
  const existing = await db
    .select()
    .from(dailyQuotes)
    .where(eq(dailyQuotes.date, today))
    .limit(1);

  if (existing.length > 0) return existing[0];

  // 从公共信箱中选择最有共鸣的一条
  const topLetter = await db
    .select()
    .from(publicLetters)
    .where(eq(publicLetters.moderationStatus, "approved"))
    .orderBy(desc(publicLetters.starCount))
    .limit(1);

  if (topLetter.length === 0) return null;

  const publicLetter = topLetter[0];
  // 只把已审核、已脱敏的公开摘录交给生成器，避免原始正文进入公开内容。
  const generatedQuote = await generateDailyQuote(publicLetter.excerpt);

  const result = await db.insert(dailyQuotes).values({
    letterId: publicLetter.letterId,
    quote: generatedQuote,
    emotionTags: publicLetter.emotionTags,
    date: today,
  }).onConflictDoNothing({ target: dailyQuotes.date });

  return result;
}

/**
 * 获取最近7天的深夜信件（每晚22:00发布三条）
 */
export async function getNightLetters() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 获取最近7天最有共鸣的信件
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const result = await db
    .select()
    .from(publicLetters)
    .where(and(sql`${publicLetters.createdAt} > ${sevenDaysAgo}`, eq(publicLetters.moderationStatus, "approved")))
    .orderBy(desc(publicLetters.starCount))
    .limit(3);

  return result;
}

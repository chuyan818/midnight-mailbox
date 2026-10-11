import { eq, desc, sql, and } from "drizzle-orm";
import { getDb } from "./db";
import { publicLetters, stars, dailyQuotes, letters, publicModerationRequests } from "../drizzle/schema";
import { evaluatePublication } from "./safety/publication";

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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 检查是否已经点过
  const existing = await db
    .select()
    .from(stars)
    .where(sql`${stars.userId} = ${userId} AND ${stars.publicLetterId} = ${publicLetterId}`)
    .limit(1);

  if (existing.length > 0) {
    // 取消点亮
    await db
      .delete(stars)
      .where(sql`${stars.userId} = ${userId} AND ${stars.publicLetterId} = ${publicLetterId}`);
    
    // 更新公共信件的星星数
    const starCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stars)
      .where(eq(stars.publicLetterId, publicLetterId));
    
    await db
      .update(publicLetters)
      .set({ starCount: starCount[0]?.count || 0 })
      .where(eq(publicLetters.id, publicLetterId));

    return { starred: false };
  } else {
    // 点亮
    await db.insert(stars).values({
      userId,
      publicLetterId,
    });

    // 更新公共信件的星星数
    const starCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stars)
      .where(eq(stars.publicLetterId, publicLetterId));
    
    await db
      .update(publicLetters)
      .set({ starCount: starCount[0]?.count || 0 })
      .where(eq(publicLetters.id, publicLetterId));

    return { starred: true };
  }
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
  // 提取第一句话作为今日一句
  const content = publicLetter.excerpt;
  const firstSentence = content.split(/[。！？\n]/)[0] || content.substring(0, 100);

  const result = await db.insert(dailyQuotes).values({
    letterId: publicLetter.letterId,
    quote: firstSentence,
    emotionTags: publicLetter.emotionTags,
    date: today,
  });

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

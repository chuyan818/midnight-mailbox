import { eq, and, desc, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, letters, emotions, memberships, subscriptionRecords, InsertMembership, letterTemplates, InsertLetterTemplate, LetterTemplate } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && (process.env.MIDNIGHT_DATABASE_URL || process.env.DATABASE_URL)) {
    try {
      _pool = new Pool({
        connectionString: process.env.MIDNIGHT_DATABASE_URL || process.env.DATABASE_URL,
        // Railway PostgreSQL requires TLS; allow explicit opt-out for local databases.
        ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Upsert user - create or update user record
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.emailVerifiedAt !== undefined) {
      values.emailVerifiedAt = user.emailVerifiedAt;
      updateSet.emailVerifiedAt = user.emailVerifiedAt;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet as Partial<InsertUser>,
    });
    
    // Create membership record if not exists
    const newUser = await getUserByOpenId(user.openId);
    if (newUser) {
      const existingMembership = await getUserMembership(newUser.id);
      if (!existingMembership) {
        await upsertMembership(newUser.id, { membershipType: 'free' });
      }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

/**
 * Get user by OpenId
 */
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/** Get an account by its normalized email address. */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new letter
 */
export async function createLetter(userId: number, letterData: {
  content: string;
  backgroundType?: string;
  publicConsent?: boolean;
  safetyFlag?: boolean;
  riskLevel?: string;
  riskCategory?: string;
  requiresHumanReview?: boolean;
  crisisDetectedAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 插入信件
  await db.insert(letters).values({
    userId,
    content: letterData.content,
    backgroundType: letterData.backgroundType,
    publicConsent: letterData.publicConsent ?? false,
    safetyFlag: letterData.safetyFlag ?? false,
    riskLevel: letterData.riskLevel ?? "low",
    riskCategory: letterData.riskCategory,
    requiresHumanReview: letterData.requiresHumanReview ?? false,
    crisisDetectedAt: letterData.crisisDetectedAt,
  });
  
  // 查询最新创建的信件以获取ID
  const createdLetters = await db.select()
    .from(letters)
    .where(eq(letters.userId, userId))
    .orderBy(desc(letters.createdAt))
    .limit(1);
  
  if (createdLetters.length === 0) {
    throw new Error("Failed to create letter");
  }
  
  return {
    id: createdLetters[0].id,
    insertId: createdLetters[0].id,
  };
}

/**
 * Update letter with emotion analysis and AI reply
 */
export async function updateLetterWithAnalysis(letterId: number, data: {
  emotionScore: number;
  emotionType: string;
  keywords: string[];
  reply: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(letters)
    .set({
      emotionScore: data.emotionScore,
      emotionType: data.emotionType,
      keywords: data.keywords,
      reply: data.reply,
      replyGeneratedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(letters.id, letterId));
}

/**
 * Get user's letters with pagination
 */
export async function getUserLetters(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select()
    .from(letters)
    .where(eq(letters.userId, userId))
    .orderBy((t) => t.createdAt)
    .limit(limit)
    .offset(offset);
  
  return result;
}

/**
 * Get letter by ID
 */
export async function getLetterById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(letters)
    .where(eq(letters.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user's membership
 */
export async function getUserMembership(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/** A paid tier is effective only after PayPal confirmation and before expiry. */
export function isPaidMembershipActive(membership: {
  membershipType?: string | null;
  paymentStatus?: string | null;
  membershipExpiry?: Date | string | null;
} | null | undefined): boolean {
  if (!membership || !["monthly", "yearly"].includes(membership.membershipType || "")) return false;
  if (membership.paymentStatus !== "active") return false;
  if (!membership.membershipExpiry) return true;
  return new Date(membership.membershipExpiry).getTime() > Date.now();
}

export function getEffectiveMembershipType(
  membership: Awaited<ReturnType<typeof getUserMembership>>,
): "free" | "monthly" | "yearly" {
  return isPaidMembershipActive(membership)
    ? (membership!.membershipType as "monthly" | "yearly")
    : "free";
}

/**
 * Create or update user membership
 */
export async function upsertMembership(userId: number, membershipData: Partial<InsertMembership>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserMembership(userId);
  
  if (existing) {
    await db.update(memberships)
      .set({
        ...membershipData,
        updatedAt: new Date(),
      })
      .where(eq(memberships.userId, userId));
  } else {
    await db.insert(memberships).values({
      userId,
      membershipType: 'free',
      ...membershipData,
    });
  }
}

/**
 * Check if user can write letter (daily limit for free users)
 */
export async function canUserWriteLetter(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;
  
  const membership = await getUserMembership(userId);
  if (!membership) return true; // Default allow
  
  // Only a confirmed, non-expired paid membership has unlimited letters.
  if (getEffectiveMembershipType(membership) === 'free') {
    const today = new Date().toISOString().split('T')[0];
    const lastLetterDate = membership.lastLetterDate;
    
    if (lastLetterDate === today && membership.dailyLetterCount >= 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Increment user's daily letter count
 */
export async function incrementDailyLetterCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const today = new Date();
  const membership = await getUserMembership(userId);
  
  if (membership) {
    const lastLetterDate = membership.lastLetterDate ? new Date(membership.lastLetterDate) : null;
    const todayStr = today.toISOString().split('T')[0];
    const lastLetterStr = lastLetterDate ? lastLetterDate.toISOString().split('T')[0] : null;
    
    const newCount = lastLetterStr === todayStr ? membership.dailyLetterCount + 1 : 1;
    
    await db.update(memberships)
      .set({
        dailyLetterCount: newCount,
        lastLetterDate: today.toISOString().split("T")[0],
        updatedAt: new Date(),
      })
      .where(eq(memberships.userId, userId));
  }
}

/**
 * Get user's emotions for the past N days
 */
export async function getUserEmotionsTrend(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const result = await db.select()
    .from(emotions)
    .innerJoin(letters, eq(emotions.letterId, letters.id))
    .where(and(eq(letters.userId, userId), gte(emotions.createdAt, startDate)))
    .orderBy((t) => t.emotions.createdAt);
  
  return result;
}

/**
 * Create subscription record
 */
export async function createSubscriptionRecord(userId: number, data: {
  membershipType: string;
  amount: number;
  currency?: string;
  provider?: string;
  paypalSubscriptionId?: string;
  status: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(subscriptionRecords).values({
    userId,
    membershipType: data.membershipType,
    amount: data.amount.toString(),
    currency: data.currency,
    provider: data.provider,
    paypalSubscriptionId: data.paypalSubscriptionId,
    status: data.status,
  });
}

export async function getUserSubscriptionRecords(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(subscriptionRecords)
    .where(eq(subscriptionRecords.userId, userId))
    .orderBy(desc(subscriptionRecords.createdAt))
    .limit(Math.min(Math.max(limit, 1), 50));
}


/**
 * Create a new letter template
 */
export async function createLetterTemplate(userId: number, templateData: {
  templateName: string;
  content: string;
  backgroundType: string;
  emotionTags?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(letterTemplates).values({
    userId,
    templateName: templateData.templateName,
    content: templateData.content,
    backgroundType: templateData.backgroundType,
    emotionTags: templateData.emotionTags,
  });
}

/**
 * Get user's letter templates
 */
export async function getUserLetterTemplates(userId: number): Promise<LetterTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select()
    .from(letterTemplates)
    .where(eq(letterTemplates.userId, userId))
    .orderBy(desc(letterTemplates.createdAt));
  
  return result;
}

/**
 * Get letter template by ID
 */
export async function getLetterTemplateById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(letterTemplates)
    .where(and(eq(letterTemplates.id, id), eq(letterTemplates.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Delete letter template
 */
export async function deleteLetterTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(letterTemplates)
    .where(and(eq(letterTemplates.id, id), eq(letterTemplates.userId, userId)));
}

/**
 * Update letter template
 */
export async function updateLetterTemplate(id: number, userId: number, templateData: Partial<InsertLetterTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(letterTemplates)
    .set({
      ...templateData,
      updatedAt: new Date(),
    })
    .where(and(eq(letterTemplates.id, id), eq(letterTemplates.userId, userId)));
}


/** Build the user-facing profile statistics from persisted letters/emotions. */
export async function getUserProfileStats(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      totalLetters: 0, averageMood: null, pendingReplies: 0, lastActive: null,
      daysSinceJoined: 0, moodType: null, trend: [], emotionDistribution: [],
      weeklyLetters: 0, previousWeeklyLetters: 0, weeklyChangePercent: 0, emotionalHours: null,
    };
  }

  const [userRows, userLetters, recentEmotionRows] = await Promise.all([
    db.select({ createdAt: users.createdAt, lastSignedIn: users.lastSignedIn })
      .from(users).where(eq(users.id, userId)).limit(1),
    db.select({ id: letters.id, createdAt: letters.createdAt, reply: letters.reply, emotionScore: letters.emotionScore, emotionType: letters.emotionType })
      .from(letters).where(eq(letters.userId, userId)),
    db.select({ letterId: emotions.letterId, createdAt: emotions.createdAt, emotionType: emotions.emotionType, emotionScore: emotions.emotionScore })
      .from(emotions).innerJoin(letters, eq(emotions.letterId, letters.id))
      .where(eq(letters.userId, userId)).orderBy(desc(emotions.createdAt)),
  ]);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const trendStart = new Date(todayStart);
  trendStart.setDate(trendStart.getDate() - 6);
  const previousWeekStart = new Date(todayStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 14);
  const currentWeekStart = new Date(todayStart);
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  const toDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const analyzedLetterIds = new Set(recentEmotionRows.map(({ letterId }) => letterId));
  const fallbackEmotions = userLetters
    .filter(({ id, emotionScore, emotionType }) => emotionScore !== null && Boolean(emotionType) && !analyzedLetterIds.has(id))
    .map(({ id, createdAt, emotionType, emotionScore }) => ({ letterId: id, createdAt, emotionType: emotionType as string, emotionScore: emotionScore as number }));
  const recentEmotions = [...recentEmotionRows, ...fallbackEmotions].filter(({ createdAt }) => createdAt >= trendStart);
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(trendStart);
    date.setDate(trendStart.getDate() + index);
    const key = toDateKey(date);
    const dayRows = recentEmotions.filter(({ createdAt }) => toDateKey(createdAt) === key);
    return {
      date: key,
      score: dayRows.length ? Math.round((dayRows.reduce((sum, row) => sum + row.emotionScore, 0) / dayRows.length) / 10 * 10) / 10 : null,
      count: dayRows.length,
    };
  });

  const distributionCounts = new Map<string, number>();
  recentEmotions.forEach(({ emotionType }) => distributionCounts.set(emotionType, (distributionCounts.get(emotionType) || 0) + 1));
  const emotionDistribution = Array.from(distributionCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({ type, count, percentage: Math.round((count / Math.max(recentEmotions.length, 1)) * 100) }));
  const scoredLetters = userLetters.filter(({ emotionScore }) => emotionScore !== null);
  const averageMood = scoredLetters.length
    ? Math.round((scoredLetters.reduce((sum, row) => sum + (row.emotionScore || 0), 0) / scoredLetters.length) / 10 * 10) / 10
    : null;
  const weeklyLetters = userLetters.filter(({ createdAt }) => createdAt >= currentWeekStart).length;
  const previousWeeklyLetters = userLetters.filter(({ createdAt }) => createdAt >= previousWeekStart && createdAt < currentWeekStart).length;
  const weeklyChangePercent = previousWeeklyLetters ? Math.round(((weeklyLetters - previousWeeklyLetters) / previousWeeklyLetters) * 100) : weeklyLetters > 0 ? 100 : 0;
  const joinedAt = userRows[0]?.createdAt;
  const daysSinceJoined = joinedAt ? Math.max(1, Math.floor((now.getTime() - joinedAt.getTime()) / 86400000) + 1) : 0;

  return {
    totalLetters: userLetters.length,
    averageMood,
    pendingReplies: userLetters.filter(({ reply }) => !reply).length,
    lastActive: userRows[0]?.lastSignedIn?.toISOString() || null,
    daysSinceJoined,
    moodType: recentEmotions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.emotionType || null,
    trend,
    emotionDistribution,
    weeklyLetters,
    previousWeeklyLetters,
    weeklyChangePercent,
    // The schema has no duration/session field, so do not fabricate this value.
    emotionalHours: null,
  };
}

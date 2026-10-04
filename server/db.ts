import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, letters, emotions, memberships, subscriptionRecords, InsertMembership, letterTemplates, InsertLetterTemplate, LetterTemplate } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
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
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 插入信件
  await db.insert(letters).values({
    userId,
    content: letterData.content,
    backgroundType: letterData.backgroundType,
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
  
  // Free users: 1 letter per day
  if (membership.membershipType === 'free') {
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
    .where(eq(letters.userId, userId))
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

import { and, eq, desc, lt } from "drizzle-orm";
import { getDb } from "./db";
import { timeCapsules, emotionStars, letters } from "../drizzle/schema";
import { withDistributedLock } from "./_core/redis-lock";

/**
 * 创建时间胶囊
 */
export async function createTimeCapsule(
  userId: number,
  content: string,
  openDate: Date,
  autoReply?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(timeCapsules).values({
    userId,
    content,
    openDate,
    autoReply,
    status: "pending",
  });

  return result;
}

/**
 * 获取用户的时间胶囊
 */
export async function getUserTimeCapsules(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(timeCapsules)
    .where(eq(timeCapsules.userId, userId))
    .orderBy(desc(timeCapsules.openDate));

  return result;
}

/**
 * 检查并打开已到期的时间胶囊
 */
export async function checkAndOpenTimeCapsules() {
  return withDistributedLock("time-capsules:open-expired", checkAndOpenTimeCapsulesUnlocked, {
    ttlMs: 30_000,
    waitMs: 5_000,
  });
}

async function checkAndOpenTimeCapsulesUnlocked() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const capsulesToOpen = await db
    .select()
    .from(timeCapsules)
    .where(
      and(
        eq(timeCapsules.status, "pending"),
        lt(timeCapsules.openDate, now),
      )
    );

  for (const capsule of capsulesToOpen) {
    await db
      .update(timeCapsules)
      .set({
        status: "opened",
        openedAt: now,
      })
      .where(and(
        eq(timeCapsules.id, capsule.id),
        eq(timeCapsules.status, "pending"),
      ));
  }

  return capsulesToOpen;
}

/**
 * 创建情绪星球中的星星
 */
export async function createEmotionStar(
  letterId: number,
  emotionType: string,
  color: string,
  x: number,
  y: number,
  z: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emotionStars).values({
    letterId: letterId as any,
    emotionType: emotionType as any,
    color: color as any,
    x: x as any,
    y: y as any,
    z: z as any,
  });

  return result;
}

/**
 * 获取所有情绪星球的星星
 */
export async function getAllEmotionStars(limit = 1000) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(emotionStars)
    .limit(limit);

  return result;
}

/**
 * 按情绪类型筛选星星
 */
export async function getEmotionStarsByType(emotionType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(emotionStars)
    .where(eq(emotionStars.emotionType, emotionType));

  return result;
}

/**
 * 获取情绪统计信息
 */
export async function getEmotionStatistics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(emotionStars);

  return result;
}

/**
 * 生成随机的3D坐标（用于新的情绪星球星星）
 */
export function generateRandomCoordinates() {
  // 生成球体坐标
  const radius = 100;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return { x, y, z };
}

/**
 * 获取情绪对应的颜色
 */
export function getEmotionColor(emotionType: string): string {
  const colorMap: Record<string, string> = {
    "快乐": "#FFD580",
    "悲伤": "#87CEEB",
    "焦虑": "#FF6B6B",
    "愤怒": "#FF4500",
    "孤独": "#9370DB",
    "迷茫": "#A9A9A9",
    "压力": "#DC143C",
    "思念": "#FFB6C1",
    "遗憾": "#8B7355",
    "希望": "#90EE90",
  };

  return colorMap[emotionType] || "#FFD580"
}

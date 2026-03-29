import { boolean, date, decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Letters table - stores user letters and AI responses
 */
export const letters = mysqlTable("letters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  backgroundType: varchar("backgroundType", { length: 50 }),
  emotionTags: json("emotionTags"),
  isPublic: boolean("isPublic").default(false).notNull(),
  emotionScore: int("emotionScore"),
  emotionType: varchar("emotionType", { length: 50 }),
  keywords: json("keywords"),
  reply: text("reply"),
  replyGeneratedAt: timestamp("replyGeneratedAt"),
  safetyFlag: boolean("safetyFlag").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Letter = typeof letters.$inferSelect;
export type InsertLetter = typeof letters.$inferInsert;

/**
 * Emotions table - stores detailed emotion analysis for each letter
 */
export const emotions = mysqlTable("emotions", {
  id: int("id").autoincrement().primaryKey(),
  letterId: int("letterId").notNull(),
  emotionType: varchar("emotionType", { length: 50 }).notNull(),
  emotionScore: int("emotionScore").notNull(),
  keywords: json("keywords"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Emotion = typeof emotions.$inferSelect;
export type InsertEmotion = typeof emotions.$inferInsert;

/**
 * Memberships table - stores user membership information
 */
export const memberships = mysqlTable("memberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  membershipType: mysqlEnum("membershipType", ["free", "monthly", "yearly"]).default("free").notNull(),
  membershipExpiry: timestamp("membershipExpiry"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  dailyLetterCount: int("dailyLetterCount").default(0).notNull(),
  lastLetterDate: date("lastLetterDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = typeof memberships.$inferInsert;

/**
 * Subscription records table - stores all subscription transactions
 */
export const subscriptionRecords = mysqlTable("subscription_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  membershipType: varchar("membershipType", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CNY").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  status: varchar("status", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionRecord = typeof subscriptionRecords.$inferSelect;
export type InsertSubscriptionRecord = typeof subscriptionRecords.$inferInsert;

/**
 * Public letters table - stores public/shareable letters
 */
export const publicLetters = mysqlTable("public_letters", {
  id: int("id").autoincrement().primaryKey(),
  letterId: int("letterId").notNull().unique(),
  userId: int("userId").notNull(),
  excerpt: varchar("excerpt", { length: 500 }).notNull(),
  emotionTags: json("emotionTags"),
  starCount: int("starCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PublicLetter = typeof publicLetters.$inferSelect;
export type InsertPublicLetter = typeof publicLetters.$inferInsert;

/**
 * Stars table - stores user interactions (shared feelings)
 */
export const stars = mysqlTable("stars", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  publicLetterId: int("publicLetterId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Star = typeof stars.$inferSelect;
export type InsertStar = typeof stars.$inferInsert;

/**
 * Daily quotes table - stores daily selected quotes
 */
export const dailyQuotes = mysqlTable("daily_quotes", {
  id: int("id").autoincrement().primaryKey(),
  letterId: int("letterId").notNull(),
  quote: varchar("quote", { length: 500 }).notNull(),
  emotionTags: json("emotionTags"),
  date: date("date").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyQuote = typeof dailyQuotes.$inferSelect;
export type InsertDailyQuote = typeof dailyQuotes.$inferInsert;

/**
 * Time capsules table - stores letters to future self
 */
export const timeCapsules = mysqlTable("time_capsules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  openDate: timestamp("openDate").notNull(),
  status: mysqlEnum("status", ["pending", "opened"]).default("pending").notNull(),
  autoReply: text("autoReply"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  openedAt: timestamp("openedAt"),
});

export type TimeCapsule = typeof timeCapsules.$inferSelect;
export type InsertTimeCapsule = typeof timeCapsules.$inferInsert;

/**
 * Emotion stars table - stores 3D star positions for emotion constellation
 */
export const emotionStars = mysqlTable("emotion_stars", {
  id: int("id").autoincrement().primaryKey(),
  letterId: int("letterId").notNull(),
  emotionType: varchar("emotionType", { length: 50 }).notNull(),
  color: varchar("color", { length: 10 }).notNull(),
  x: decimal("x", { precision: 10, scale: 4 }).notNull(),
  y: decimal("y", { precision: 10, scale: 4 }).notNull(),
  z: decimal("z", { precision: 10, scale: 4 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmotionStar = typeof emotionStars.$inferSelect;
export type InsertEmotionStar = typeof emotionStars.$inferInsert;
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
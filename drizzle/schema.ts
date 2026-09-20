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
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** One-time email verification codes, stored hashed and never returned to clients. */
export const emailVerificationCodes = mysqlTable("email_verification_codes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  attempts: int("attempts").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode = typeof emailVerificationCodes.$inferInsert;

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

/** Prevents duplicate expiry notifications for the same membership window. */
export const membershipExpiryReminders = mysqlTable("membership_expiry_reminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  membershipId: int("membershipId").notNull(),
  reminderType: mysqlEnum("reminderType", ["expiry_7days", "expiry_3days", "expiry_today"]).notNull(),
  expiryDate: timestamp("expiryDate").notNull(),
  sentAt: timestamp("sentAt"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MembershipExpiryReminder = typeof membershipExpiryReminders.$inferSelect;
export type InsertMembershipExpiryReminder = typeof membershipExpiryReminders.$inferInsert;

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

/**
 * Reports table - stores user reports/complaints
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  targetType: mysqlEnum("targetType", ["letter", "user", "comment"]).notNull(),
  targetId: int("targetId").notNull(),
  reason: varchar("reason", { length: 100 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "reviewing", "resolved", "dismissed"]).default("pending").notNull(),
  handledBy: int("handledBy"),
  handledAt: timestamp("handledAt"),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Daily stats table - stores daily statistics for dashboard
 */
export const dailyStats = mysqlTable("daily_stats", {
  id: int("id").autoincrement().primaryKey(),
  date: date("date").notNull().unique(),
  totalUsers: int("totalUsers").default(0).notNull(),
  newUsers: int("newUsers").default(0).notNull(),
  totalLetters: int("totalLetters").default(0).notNull(),
  newLetters: int("newLetters").default(0).notNull(),
  publicLetters: int("publicLetters").default(0).notNull(),
  totalStars: int("totalStars").default(0).notNull(),
  newStars: int("newStars").default(0).notNull(),
  vipCount: int("vipCount").default(0).notNull(),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  reportCount: int("reportCount").default(0).notNull(),
  bannedUsers: int("bannedUsers").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyStat = typeof dailyStats.$inferSelect;
export type InsertDailyStat = typeof dailyStats.$inferInsert;

/**
 * Admin users table - stores admin account information
 */
export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  role: mysqlEnum("role", ["admin", "moderator", "analyst"]).default("admin").notNull(),
  permissions: json("permissions"),
  lastLoginAt: timestamp("lastLoginAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * System config table - stores system-wide configuration
 */
export const systemConfigs = mysqlTable("system_configs", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  type: mysqlEnum("type", ["string", "number", "boolean", "json"]).default("string").notNull(),
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemConfig = typeof systemConfigs.$inferSelect;
export type InsertSystemConfig = typeof systemConfigs.$inferInsert;

/**
 * Operation logs table - stores admin operation logs
 */
export const operationLogs = mysqlTable("operation_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("targetType", { length: 50 }),
  targetId: int("targetId"),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OperationLog = typeof operationLogs.$inferSelect;
export type InsertOperationLog = typeof operationLogs.$inferInsert;

/**
 * Letter templates table - stores user-saved letter templates
 */
export const letterTemplates = mysqlTable("letter_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  templateName: varchar("templateName", { length: 100 }).notNull(),
  content: text("content").notNull(),
  backgroundType: varchar("backgroundType", { length: 50 }).notNull(),
  emotionTags: json("emotionTags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LetterTemplate = typeof letterTemplates.$inferSelect;
export type InsertLetterTemplate = typeof letterTemplates.$inferInsert;

/**
 * Support tickets table - stores member support requests and response metrics
 */
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  category: mysqlEnum("category", ["technical", "feedback", "billing", "other"]).default("other").notNull(),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("high").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  assignedAdminId: int("assignedAdminId"),
  response: text("response"),
  firstResponseAt: timestamp("firstResponseAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

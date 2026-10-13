import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"] as const);
export const membershipTypeEnum = pgEnum("membership_type", [
  "free",
  "monthly",
  "yearly",
] as const);
export const reminderTypeEnum = pgEnum("reminder_type", [
  "expiry_7days",
  "expiry_3days",
  "expiry_today",
] as const);
export const timeCapsuleStatusEnum = pgEnum("time_capsule_status", [
  "pending",
  "opened",
] as const);
export const reportTargetTypeEnum = pgEnum("report_target_type", [
  "letter",
  "user",
  "comment",
] as const);
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
] as const);
export const adminRoleEnum = pgEnum("admin_role", [
  "admin",
  "moderator",
  "analyst",
] as const);
export const systemConfigTypeEnum = pgEnum("system_config_type", [
  "string",
  "number",
  "boolean",
  "json",
] as const);
export const supportCategoryEnum = pgEnum("support_category", [
  "technical",
  "feedback",
  "billing",
  "other",
] as const);
export const supportPriorityEnum = pgEnum("support_priority", [
  "high",
  "medium",
  "low",
] as const);
export const supportStatusEnum = pgEnum("support_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  bannedAt: timestamp("bannedAt"),
  banReason: text("banReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** One-time email verification codes, stored hashed and never returned to clients. */
export const emailVerificationCodes = pgTable("email_verification_codes", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode =
  typeof emailVerificationCodes.$inferInsert;

/** Login audit trail used for rate limiting, anomaly detection and user activity history. */
export const loginEvents = pgTable("login_events", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  email: varchar("email", { length: 320 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 128 }).notNull(),
  userAgent: varchar("userAgent", { length: 512 }),
  success: boolean("success").default(false).notNull(),
  failureReason: varchar("failureReason", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoginEvent = typeof loginEvents.$inferSelect;
export type InsertLoginEvent = typeof loginEvents.$inferInsert;

/**
 * Letters table - stores user letters and AI responses
 */
export const letters = pgTable("letters", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  backgroundType: varchar("backgroundType", { length: 50 }),
  emotionTags: jsonb("emotionTags"),
  isPublic: boolean("isPublic").default(false).notNull(),
  publicConsent: boolean("publicConsent").default(false).notNull(),
  emotionScore: integer("emotionScore"),
  emotionType: varchar("emotionType", { length: 50 }),
  keywords: jsonb("keywords"),
  reply: text("reply"),
  replyGeneratedAt: timestamp("replyGeneratedAt"),
  safetyFlag: boolean("safetyFlag").default(false).notNull(),
  riskLevel: varchar("riskLevel", { length: 16 }).default("low").notNull(),
  riskCategory: varchar("riskCategory", { length: 32 }),
  requiresHumanReview: boolean("requiresHumanReview").default(false).notNull(),
  crisisDetectedAt: timestamp("crisisDetectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Letter = typeof letters.$inferSelect;
export type InsertLetter = typeof letters.$inferInsert;

/**
 * Emotions table - stores detailed emotion analysis for each letter
 */
export const emotions = pgTable("emotions", {
  id: serial("id").primaryKey(),
  letterId: integer("letterId").notNull(),
  emotionType: varchar("emotionType", { length: 50 }).notNull(),
  emotionScore: integer("emotionScore").notNull(),
  keywords: jsonb("keywords"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Emotion = typeof emotions.$inferSelect;
export type InsertEmotion = typeof emotions.$inferInsert;

/**
 * Memberships table - stores user membership information
 */
export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  membershipType: membershipTypeEnum("membershipType")
    .default("free")
    .notNull(),
  membershipExpiry: timestamp("membershipExpiry"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  paypalSubscriptionId: varchar("paypalSubscriptionId", { length: 255 }),
  paymentStatus: varchar("paymentStatus", { length: 32 })
    .default("none")
    .notNull(),
  autoRenew: boolean("autoRenew").default(true).notNull(),
  cancelledAt: timestamp("cancelledAt"),
  dailyLetterCount: integer("dailyLetterCount").default(0).notNull(),
  lastLetterDate: date("lastLetterDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = typeof memberships.$inferInsert;

/** Prevents duplicate expiry notifications for the same membership window. */
export const membershipExpiryReminders = pgTable(
  "membership_expiry_reminders",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    membershipId: integer("membershipId").notNull(),
    reminderType: reminderTypeEnum("reminderType").notNull(),
    expiryDate: timestamp("expiryDate").notNull(),
    sentAt: timestamp("sentAt"),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);

export type MembershipExpiryReminder =
  typeof membershipExpiryReminders.$inferSelect;
export type InsertMembershipExpiryReminder =
  typeof membershipExpiryReminders.$inferInsert;

/**
 * Subscription records table - stores all subscription transactions
 */
export const subscriptionRecords = pgTable("subscription_records", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  membershipType: varchar("membershipType", { length: 50 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CNY").notNull(),
  provider: varchar("provider", { length: 32 }).default("stripe").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", {
    length: 255,
  }).unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", {
    length: 255,
  }).unique(),
  paypalSubscriptionId: varchar("paypalSubscriptionId", { length: 255 }),
  paypalTransactionId: varchar("paypalTransactionId", { length: 255 }).unique(),
  status: varchar("status", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type SubscriptionRecord = typeof subscriptionRecords.$inferSelect;
export type InsertSubscriptionRecord = typeof subscriptionRecords.$inferInsert;

/**
 * Public letters table - stores public/shareable letters
 */
export const publicLetters = pgTable("public_letters", {
  id: serial("id").primaryKey(),
  letterId: integer("letterId").notNull().unique(),
  userId: integer("userId").notNull(),
  excerpt: varchar("excerpt", { length: 500 }).notNull(),
  moderationStatus: varchar("moderationStatus", { length: 16 }).default("approved").notNull(),
  redactionFields: jsonb("redactionFields"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: integer("reviewedBy"),
  emotionTags: jsonb("emotionTags"),
  starCount: integer("starCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PublicLetter = typeof publicLetters.$inferSelect;
export type InsertPublicLetter = typeof publicLetters.$inferInsert;

/** Public publishing requests waiting for PII/safety review. */
export const publicModerationRequests = pgTable("public_moderation_requests", {
  id: serial("id").primaryKey(),
  letterId: integer("letterId").notNull().unique(),
  userId: integer("userId").notNull(),
  proposedExcerpt: varchar("proposedExcerpt", { length: 500 }).notNull(),
  redactedExcerpt: varchar("redactedExcerpt", { length: 500 }).notNull(),
  redactionFields: jsonb("redactionFields"),
  reason: varchar("reason", { length: 500 }),
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  reviewedBy: integer("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PublicModerationRequest = typeof publicModerationRequests.$inferSelect;
export type InsertPublicModerationRequest = typeof publicModerationRequests.$inferInsert;

/** Human-review queue for high-risk letters. The raw letter remains private. */
export const crisisCases = pgTable("crisis_cases", {
  id: serial("id").primaryKey(),
  letterId: integer("letterId").notNull().unique(),
  userId: integer("userId").notNull(),
  priority: varchar("priority", { length: 16 }).default("highest").notNull(),
  riskLevel: varchar("riskLevel", { length: 16 }).default("high").notNull(),
  riskCategory: varchar("riskCategory", { length: 32 }),
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  reviewedBy: integer("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrisisCase = typeof crisisCases.$inferSelect;
export type InsertCrisisCase = typeof crisisCases.$inferInsert;

/**
 * Stars table - stores user interactions (shared feelings)
 */
export const stars = pgTable("stars", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  publicLetterId: integer("publicLetterId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userPublicLetterUnique: uniqueIndex("stars_user_public_letter_unique")
    .on(table.userId, table.publicLetterId),
}));

export type Star = typeof stars.$inferSelect;
export type InsertStar = typeof stars.$inferInsert;

/**
 * Daily quotes table - stores daily selected quotes
 */
export const dailyQuotes = pgTable("daily_quotes", {
  id: serial("id").primaryKey(),
  letterId: integer("letterId").notNull(),
  quote: varchar("quote", { length: 500 }).notNull(),
  emotionTags: jsonb("emotionTags"),
  date: date("date").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyQuote = typeof dailyQuotes.$inferSelect;
export type InsertDailyQuote = typeof dailyQuotes.$inferInsert;

/**
 * Time capsules table - stores letters to future self
 */
export const timeCapsules = pgTable("time_capsules", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  openDate: timestamp("openDate").notNull(),
  status: timeCapsuleStatusEnum("status").default("pending").notNull(),
  autoReply: text("autoReply"),
  category: varchar("category", { length: 32 }),
  mood: varchar("mood", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  openedAt: timestamp("openedAt"),
});

export type TimeCapsule = typeof timeCapsules.$inferSelect;
export type InsertTimeCapsule = typeof timeCapsules.$inferInsert;

/**
 * Emotion stars table - stores 3D star positions for emotion constellation
 */
export const emotionStars = pgTable("emotion_stars", {
  id: serial("id").primaryKey(),
  letterId: integer("letterId").notNull(),
  emotionType: varchar("emotionType", { length: 50 }).notNull(),
  color: varchar("color", { length: 10 }).notNull(),
  x: numeric("x", { precision: 10, scale: 4 }).notNull(),
  y: numeric("y", { precision: 10, scale: 4 }).notNull(),
  z: numeric("z", { precision: 10, scale: 4 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmotionStar = typeof emotionStars.$inferSelect;
export type InsertEmotionStar = typeof emotionStars.$inferInsert;

/**
 * Reports table - stores user reports/complaints
 */
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporterId").notNull(),
  targetType: reportTargetTypeEnum("targetType").notNull(),
  targetId: integer("targetId").notNull(),
  reason: varchar("reason", { length: 100 }).notNull(),
  description: text("description"),
  status: reportStatusEnum("status").default("pending").notNull(),
  handledBy: integer("handledBy"),
  handledAt: timestamp("handledAt"),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Daily stats table - stores daily statistics for dashboard
 */
export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  totalUsers: integer("totalUsers").default(0).notNull(),
  newUsers: integer("newUsers").default(0).notNull(),
  totalLetters: integer("totalLetters").default(0).notNull(),
  newLetters: integer("newLetters").default(0).notNull(),
  publicLetters: integer("publicLetters").default(0).notNull(),
  totalStars: integer("totalStars").default(0).notNull(),
  newStars: integer("newStars").default(0).notNull(),
  vipCount: integer("vipCount").default(0).notNull(),
  revenue: numeric("revenue", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  reportCount: integer("reportCount").default(0).notNull(),
  bannedUsers: integer("bannedUsers").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyStat = typeof dailyStats.$inferSelect;
export type InsertDailyStat = typeof dailyStats.$inferInsert;

/**
 * Admin users table - stores admin account information
 */
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  role: adminRoleEnum("role").default("admin").notNull(),
  permissions: jsonb("permissions"),
  lastLoginAt: timestamp("lastLoginAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * System config table - stores system-wide configuration
 */
export const systemConfigs = pgTable("system_configs", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  type: systemConfigTypeEnum("type").default("string").notNull(),
  description: text("description"),
  updatedBy: integer("updatedBy"),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type SystemConfig = typeof systemConfigs.$inferSelect;
export type InsertSystemConfig = typeof systemConfigs.$inferInsert;

/**
 * Operation logs table - stores admin operation logs
 */
export const operationLogs = pgTable("operation_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("adminId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("targetType", { length: 50 }),
  targetId: integer("targetId"),
  details: jsonb("details"),
  ipAddress: varchar("ipAddress", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OperationLog = typeof operationLogs.$inferSelect;
export type InsertOperationLog = typeof operationLogs.$inferInsert;

/**
 * Letter templates table - stores user-saved letter templates
 */
export const letterTemplates = pgTable("letter_templates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  templateName: varchar("templateName", { length: 100 }).notNull(),
  content: text("content").notNull(),
  backgroundType: varchar("backgroundType", { length: 50 }).notNull(),
  emotionTags: jsonb("emotionTags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type LetterTemplate = typeof letterTemplates.$inferSelect;
export type InsertLetterTemplate = typeof letterTemplates.$inferInsert;

/**
 * Support tickets table - stores member support requests and response metrics
 */
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  category: supportCategoryEnum("category").default("other").notNull(),
  description: text("description").notNull(),
  priority: supportPriorityEnum("priority").default("high").notNull(),
  status: supportStatusEnum("status").default("open").notNull(),
  assignedAdminId: integer("assignedAdminId"),
  response: text("response"),
  firstResponseAt: timestamp("firstResponseAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

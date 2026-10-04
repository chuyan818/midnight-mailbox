CREATE TYPE "public"."admin_role" AS ENUM('admin', 'moderator', 'analyst');--> statement-breakpoint
CREATE TYPE "public"."membership_type" AS ENUM('free', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('expiry_7days', 'expiry_3days', 'expiry_today');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_target_type" AS ENUM('letter', 'user', 'comment');--> statement-breakpoint
CREATE TYPE "public"."support_category" AS ENUM('technical', 'feedback', 'billing', 'other');--> statement-breakpoint
CREATE TYPE "public"."support_priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."support_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."system_config_type" AS ENUM('string', 'number', 'boolean', 'json');--> statement-breakpoint
CREATE TYPE "public"."time_capsule_status" AS ENUM('pending', 'opened');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"permissions" jsonb,
	"lastLoginAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "daily_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"letterId" integer NOT NULL,
	"quote" varchar(500) NOT NULL,
	"emotionTags" jsonb,
	"date" date NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_quotes_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"totalUsers" integer DEFAULT 0 NOT NULL,
	"newUsers" integer DEFAULT 0 NOT NULL,
	"totalLetters" integer DEFAULT 0 NOT NULL,
	"newLetters" integer DEFAULT 0 NOT NULL,
	"publicLetters" integer DEFAULT 0 NOT NULL,
	"totalStars" integer DEFAULT 0 NOT NULL,
	"newStars" integer DEFAULT 0 NOT NULL,
	"vipCount" integer DEFAULT 0 NOT NULL,
	"revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"reportCount" integer DEFAULT 0 NOT NULL,
	"bannedUsers" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_stats_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "email_verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"codeHash" varchar(128) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"consumedAt" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emotion_stars" (
	"id" serial PRIMARY KEY NOT NULL,
	"letterId" integer NOT NULL,
	"emotionType" varchar(50) NOT NULL,
	"color" varchar(10) NOT NULL,
	"x" numeric(10, 4) NOT NULL,
	"y" numeric(10, 4) NOT NULL,
	"z" numeric(10, 4) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"letterId" integer NOT NULL,
	"emotionType" varchar(50) NOT NULL,
	"emotionScore" integer NOT NULL,
	"keywords" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "letter_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"templateName" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"backgroundType" varchar(50) NOT NULL,
	"emotionTags" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "letters" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"content" text NOT NULL,
	"backgroundType" varchar(50),
	"emotionTags" jsonb,
	"isPublic" boolean DEFAULT false NOT NULL,
	"emotionScore" integer,
	"emotionType" varchar(50),
	"keywords" jsonb,
	"reply" text,
	"replyGeneratedAt" timestamp,
	"safetyFlag" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_expiry_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"membershipId" integer NOT NULL,
	"reminderType" "reminder_type" NOT NULL,
	"expiryDate" timestamp NOT NULL,
	"sentAt" timestamp,
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"membershipType" "membership_type" DEFAULT 'free' NOT NULL,
	"membershipExpiry" timestamp,
	"stripeCustomerId" varchar(255),
	"stripeSubscriptionId" varchar(255),
	"paypalSubscriptionId" varchar(255),
	"paymentStatus" varchar(32) DEFAULT 'none' NOT NULL,
	"autoRenew" boolean DEFAULT true NOT NULL,
	"cancelledAt" timestamp,
	"dailyLetterCount" integer DEFAULT 0 NOT NULL,
	"lastLetterDate" date,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "operation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"adminId" integer NOT NULL,
	"action" varchar(100) NOT NULL,
	"targetType" varchar(50),
	"targetId" integer,
	"details" jsonb,
	"ipAddress" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_letters" (
	"id" serial PRIMARY KEY NOT NULL,
	"letterId" integer NOT NULL,
	"userId" integer NOT NULL,
	"excerpt" varchar(500) NOT NULL,
	"emotionTags" jsonb,
	"starCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "public_letters_letterId_unique" UNIQUE("letterId")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporterId" integer NOT NULL,
	"targetType" "report_target_type" NOT NULL,
	"targetId" integer NOT NULL,
	"reason" varchar(100) NOT NULL,
	"description" text,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"handledBy" integer,
	"handledAt" timestamp,
	"resolution" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stars" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"publicLetterId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"membershipType" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CNY' NOT NULL,
	"provider" varchar(32) DEFAULT 'stripe' NOT NULL,
	"stripeCustomerId" varchar(255),
	"stripeSubscriptionId" varchar(255),
	"stripePaymentIntentId" varchar(255),
	"paypalSubscriptionId" varchar(255),
	"paypalTransactionId" varchar(255),
	"status" varchar(50) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_records_stripeSubscriptionId_unique" UNIQUE("stripeSubscriptionId"),
	CONSTRAINT "subscription_records_stripePaymentIntentId_unique" UNIQUE("stripePaymentIntentId"),
	CONSTRAINT "subscription_records_paypalTransactionId_unique" UNIQUE("paypalTransactionId")
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"subject" varchar(200) NOT NULL,
	"category" "support_category" DEFAULT 'other' NOT NULL,
	"description" text NOT NULL,
	"priority" "support_priority" DEFAULT 'high' NOT NULL,
	"status" "support_status" DEFAULT 'open' NOT NULL,
	"assignedAdminId" integer,
	"response" text,
	"firstResponseAt" timestamp,
	"resolvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"type" "system_config_type" DEFAULT 'string' NOT NULL,
	"description" text,
	"updatedBy" integer,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_configs_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "time_capsules" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"content" text NOT NULL,
	"openDate" timestamp NOT NULL,
	"status" time_capsule_status DEFAULT 'pending' NOT NULL,
	"autoReply" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"openedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"passwordHash" varchar(255),
	"emailVerifiedAt" timestamp,
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);

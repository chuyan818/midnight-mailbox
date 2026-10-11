CREATE TABLE "crisis_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"letterId" integer NOT NULL,
	"userId" integer NOT NULL,
	"priority" varchar(16) DEFAULT 'highest' NOT NULL,
	"riskLevel" varchar(16) DEFAULT 'high' NOT NULL,
	"riskCategory" varchar(32),
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"reviewedBy" integer,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crisis_cases_letterId_unique" UNIQUE("letterId")
);
--> statement-breakpoint
CREATE TABLE "public_moderation_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"letterId" integer NOT NULL,
	"userId" integer NOT NULL,
	"proposedExcerpt" varchar(500) NOT NULL,
	"redactedExcerpt" varchar(500) NOT NULL,
	"redactionFields" jsonb,
	"reason" varchar(500),
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"reviewedBy" integer,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "public_moderation_requests_letterId_unique" UNIQUE("letterId")
);
--> statement-breakpoint
ALTER TABLE "letters" ADD COLUMN "publicConsent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "letters" ADD COLUMN "riskLevel" varchar(16) DEFAULT 'low' NOT NULL;--> statement-breakpoint
ALTER TABLE "letters" ADD COLUMN "riskCategory" varchar(32);--> statement-breakpoint
ALTER TABLE "letters" ADD COLUMN "requiresHumanReview" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "letters" ADD COLUMN "crisisDetectedAt" timestamp;--> statement-breakpoint
ALTER TABLE "public_letters" ADD COLUMN "moderationStatus" varchar(16) DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "public_letters" ADD COLUMN "redactionFields" jsonb;--> statement-breakpoint
ALTER TABLE "public_letters" ADD COLUMN "reviewedAt" timestamp;--> statement-breakpoint
ALTER TABLE "public_letters" ADD COLUMN "reviewedBy" integer;--> statement-breakpoint

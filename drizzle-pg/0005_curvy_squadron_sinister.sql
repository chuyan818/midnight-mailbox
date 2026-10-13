ALTER TABLE "users" ADD COLUMN "bannedAt" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banReason" text;

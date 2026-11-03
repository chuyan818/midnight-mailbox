ALTER TABLE "users" ADD COLUMN "securityQuestion" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "securityAnswerHash" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "securityQuestionUpdatedAt" timestamp;--> statement-breakpoint

-- Remove only the explicitly marked seed records; preserve all real quotes.
DELETE FROM "daily_quotes"
WHERE "quote" ~ '^\[测试数据\]';--> statement-breakpoint

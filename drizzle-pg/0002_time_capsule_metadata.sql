ALTER TABLE "time_capsules" ADD COLUMN IF NOT EXISTS "category" varchar(32);
ALTER TABLE "time_capsules" ADD COLUMN IF NOT EXISTS "mood" varchar(32);

-- Keep the earliest row for each reminder window before enforcing uniqueness.
DELETE FROM "membership_expiry_reminders" AS duplicate
USING "membership_expiry_reminders" AS original
WHERE duplicate."membershipId" = original."membershipId"
  AND duplicate."reminderType" = original."reminderType"
  AND duplicate."expiryDate" = original."expiryDate"
  AND duplicate."id" > original."id";

ALTER TABLE "membership_expiry_reminders"
  ADD CONSTRAINT "membership_expiry_reminder_window_unique"
  UNIQUE("membershipId", "reminderType", "expiryDate");

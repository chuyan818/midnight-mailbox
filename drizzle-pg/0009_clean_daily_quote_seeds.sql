-- Remove seed quotes even when an older generator already wrapped the marker in new text.
DELETE FROM "daily_quotes"
WHERE "quote" LIKE '%[测试数据]%';--> statement-breakpoint

ALTER TABLE `subscription_records` DROP INDEX `subscription_records_paypalSubscriptionId_unique`;--> statement-breakpoint
ALTER TABLE `subscription_records` ADD `paypalTransactionId` varchar(255);--> statement-breakpoint
ALTER TABLE `subscription_records` ADD CONSTRAINT `subscription_records_paypalTransactionId_unique` UNIQUE(`paypalTransactionId`);
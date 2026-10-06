ALTER TABLE `subscription_records` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `subscription_records` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `subscription_records` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `subscription_records` ADD CONSTRAINT `subscription_records_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`);
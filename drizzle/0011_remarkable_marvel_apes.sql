ALTER TABLE `memberships` ADD `autoRenew` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `memberships` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `subscription_records` ADD `provider` varchar(32) DEFAULT 'stripe' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscription_records` ADD `paypalSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `subscription_records` ADD CONSTRAINT `subscription_records_paypalSubscriptionId_unique` UNIQUE(`paypalSubscriptionId`);
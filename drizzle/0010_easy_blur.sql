ALTER TABLE `memberships` ADD `paypalSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `memberships` ADD `paymentStatus` varchar(32) DEFAULT 'none' NOT NULL;
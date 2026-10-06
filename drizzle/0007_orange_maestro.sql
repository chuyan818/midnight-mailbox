CREATE TABLE `membership_expiry_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`membershipId` int NOT NULL,
	`reminderType` enum('expiry_7days','expiry_3days','expiry_today') NOT NULL,
	`expiryDate` timestamp NOT NULL,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `membership_expiry_reminders_id` PRIMARY KEY(`id`)
);

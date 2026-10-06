CREATE TABLE `emotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`letterId` int NOT NULL,
	`emotionType` varchar(50) NOT NULL,
	`emotionScore` int NOT NULL,
	`keywords` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emotions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`backgroundType` varchar(50),
	`emotionScore` int,
	`emotionType` varchar(50),
	`keywords` json,
	`reply` text,
	`replyGeneratedAt` timestamp,
	`safetyFlag` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`membershipType` enum('free','monthly','yearly') NOT NULL DEFAULT 'free',
	`membershipExpiry` timestamp,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`dailyLetterCount` int NOT NULL DEFAULT 0,
	`lastLetterDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `memberships_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `subscription_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`membershipType` varchar(50) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'CNY',
	`stripePaymentIntentId` varchar(255),
	`status` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_records_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);

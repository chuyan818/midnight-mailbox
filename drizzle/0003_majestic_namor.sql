CREATE TABLE `daily_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`letterId` int NOT NULL,
	`quote` varchar(500) NOT NULL,
	`emotionTags` json,
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_quotes_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `emotion_stars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`letterId` int NOT NULL,
	`emotionType` varchar(50) NOT NULL,
	`color` varchar(10) NOT NULL,
	`x` decimal(10,4) NOT NULL,
	`y` decimal(10,4) NOT NULL,
	`z` decimal(10,4) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emotion_stars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `public_letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`letterId` int NOT NULL,
	`userId` int NOT NULL,
	`excerpt` varchar(500) NOT NULL,
	`emotionTags` json,
	`starCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `public_letters_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_letters_letterId_unique` UNIQUE(`letterId`)
);
--> statement-breakpoint
CREATE TABLE `stars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`publicLetterId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `time_capsules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`openDate` timestamp NOT NULL,
	`status` enum('pending','opened') NOT NULL DEFAULT 'pending',
	`autoReply` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`openedAt` timestamp,
	CONSTRAINT `time_capsules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `letters` ADD `emotionTags` json;--> statement-breakpoint
ALTER TABLE `letters` ADD `isPublic` boolean DEFAULT false NOT NULL;
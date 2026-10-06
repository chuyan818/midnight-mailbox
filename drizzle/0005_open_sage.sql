CREATE TABLE `letter_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateName` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`backgroundType` varchar(50) NOT NULL,
	`emotionTags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `letter_templates_id` PRIMARY KEY(`id`)
);

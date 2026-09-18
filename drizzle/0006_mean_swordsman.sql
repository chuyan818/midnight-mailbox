CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(200) NOT NULL,
	`category` enum('technical','feedback','billing','other') NOT NULL DEFAULT 'other',
	`description` text NOT NULL,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'high',
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`assignedAdminId` int,
	`response` text,
	`firstResponseAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);

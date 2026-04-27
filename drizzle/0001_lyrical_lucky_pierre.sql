CREATE TABLE `follow_ups` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`representative_id` text NOT NULL,
	`proposal_id` text,
	`deal_id` text,
	`scheduled_date` integer NOT NULL,
	`type` text DEFAULT 'general' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`result` text,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`representative_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_followups_rep` ON `follow_ups` (`representative_id`);--> statement-breakpoint
CREATE INDEX `idx_followups_customer` ON `follow_ups` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_followups_status` ON `follow_ups` (`status`);--> statement-breakpoint
CREATE INDEX `idx_followups_scheduled` ON `follow_ups` (`scheduled_date`);--> statement-breakpoint
CREATE INDEX `idx_followups_rep_status_scheduled` ON `follow_ups` (`representative_id`,`status`,`scheduled_date`);
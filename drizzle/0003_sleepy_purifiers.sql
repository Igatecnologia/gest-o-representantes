CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`filename` text NOT NULL,
	`url` text NOT NULL,
	`size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`uploaded_by_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_attachments_entity` ON `attachments` (`entity`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_attachments_user` ON `attachments` (`uploaded_by`);--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`representative_id` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`accuracy` real,
	`distance_meters` real,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`representative_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_visits_customer` ON `visits` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_visits_rep` ON `visits` (`representative_id`);--> statement-breakpoint
CREATE INDEX `idx_visits_created` ON `visits` (`created_at`);
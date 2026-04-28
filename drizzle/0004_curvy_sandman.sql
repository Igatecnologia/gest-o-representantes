CREATE TABLE `message_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text DEFAULT 'whatsapp' NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_templates_category` ON `message_templates` (`category`);
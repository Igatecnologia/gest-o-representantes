CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`details` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_user` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `audit_logs` (`entity`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_created` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `commissions` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`representative_id` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paid_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`representative_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_commissions_sale` ON `commissions` (`sale_id`);--> statement-breakpoint
CREATE INDEX `idx_commissions_rep` ON `commissions` (`representative_id`);--> statement-breakpoint
CREATE INDEX `idx_commissions_status` ON `commissions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_commissions_rep_status` ON `commissions` (`representative_id`,`status`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`representative_id` text,
	`name` text NOT NULL,
	`trade_name` text,
	`document` text,
	`email` text,
	`phone` text,
	`cep` text,
	`street` text,
	`number` text,
	`complement` text,
	`district` text,
	`city` text,
	`state` text,
	`latitude` real,
	`longitude` real,
	`source` text DEFAULT 'web' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`representative_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_customers_rep` ON `customers` (`representative_id`);--> statement-breakpoint
CREATE INDEX `idx_customers_name` ON `customers` (`name`);--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`customer_id` text NOT NULL,
	`representative_id` text NOT NULL,
	`product_id` text,
	`value` integer DEFAULT 0 NOT NULL,
	`stage` text DEFAULT 'lead' NOT NULL,
	`probability` integer DEFAULT 20 NOT NULL,
	`expected_close_date` integer,
	`notes` text,
	`sort_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`closed_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`representative_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_deals_rep` ON `deals` (`representative_id`);--> statement-breakpoint
CREATE INDEX `idx_deals_customer` ON `deals` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_deals_stage` ON `deals` (`stage`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`price` integer NOT NULL,
	`implementation_price` integer DEFAULT 0 NOT NULL,
	`type` text DEFAULT 'perpetual' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_products_name` ON `products` (`name`);--> statement-breakpoint
CREATE TABLE `proposal_items` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`label` text NOT NULL,
	`type` text DEFAULT 'one_time' NOT NULL,
	`default_value` integer NOT NULL,
	`value` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_proposal_items_proposal` ON `proposal_items` (`proposal_id`);--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`representative_id` text NOT NULL,
	`product_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`valid_until` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`representative_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_proposals_rep` ON `proposals` (`representative_id`);--> statement-breakpoint
CREATE INDEX `idx_proposals_customer` ON `proposals` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_proposals_status` ON `proposals` (`status`);--> statement-breakpoint
CREATE INDEX `idx_proposals_status_valid` ON `proposals` (`status`,`valid_until`);--> statement-breakpoint
CREATE TABLE `representatives` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`commission_pct` real DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_reps_user` ON `representatives` (`user_id`);--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`representative_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` integer NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'approved' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`representative_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_sales_rep` ON `sales` (`representative_id`);--> statement-breakpoint
CREATE INDEX `idx_sales_customer` ON `sales` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_sales_status` ON `sales` (`status`);--> statement-breakpoint
CREATE INDEX `idx_sales_created` ON `sales` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_sales_rep_status_created` ON `sales` (`representative_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'rep' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
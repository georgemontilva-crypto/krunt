CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_signed_in` timestamp,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(64),
	`topic` varchar(120),
	`message` text NOT NULL,
	`handled` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`product_name` varchar(255) NOT NULL,
	`flavor_name` varchar(120) NOT NULL,
	`unit_price_cents` int NOT NULL,
	`quantity` int NOT NULL,
	`line_total_cents` int NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(32) NOT NULL,
	`access_key` varchar(64) NOT NULL,
	`channel` enum('retail','wholesale') NOT NULL,
	`wholesale_account_id` int,
	`customer_name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(64) NOT NULL,
	`business_name` varchar(255),
	`address` varchar(255) NOT NULL,
	`address2` varchar(255),
	`city` varchar(120) NOT NULL,
	`state` varchar(64) NOT NULL,
	`zip` varchar(20) NOT NULL,
	`notes` text,
	`subtotal_cents` int NOT NULL,
	`shipping_cents` int NOT NULL,
	`total_cents` int NOT NULL,
	`status` enum('pending_payment','paid','processing','shipped','completed','cancelled') NOT NULL DEFAULT 'pending_payment',
	`tracking_number` varchar(120),
	`admin_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`flavor_key` varchar(64) NOT NULL,
	`in_stock` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `variant_product_flavor` UNIQUE(`product_id`,`flavor_key`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`short_name` varchar(120) NOT NULL,
	`tagline` varchar(255),
	`description` text,
	`net_weight` varchar(120),
	`retail_price_cents` int NOT NULL,
	`wholesale_price_cents` int NOT NULL,
	`case_size` int NOT NULL DEFAULT 10,
	`published` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` varchar(64) NOT NULL,
	`value` text,
	CONSTRAINT `site_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `wholesale_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`business_name` varchar(255) NOT NULL,
	`contact_name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(64) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`tax_id` varchar(120),
	`website` varchar(255),
	`address` varchar(255) NOT NULL,
	`city` varchar(120) NOT NULL,
	`state` varchar(64) NOT NULL,
	`zip` varchar(20) NOT NULL,
	`notes` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_at` timestamp,
	`last_signed_in` timestamp,
	CONSTRAINT `wholesale_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `wholesale_accounts_email_unique` UNIQUE(`email`)
);

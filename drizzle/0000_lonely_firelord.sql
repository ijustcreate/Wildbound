CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`animation_id` text NOT NULL,
	`frame_index` integer NOT NULL,
	`facing_index` integer NOT NULL,
	`region_x` real,
	`region_y` real,
	`region_w` real,
	`region_h` real,
	`good_tags` text NOT NULL,
	`bad_tags` text NOT NULL,
	`comment` text NOT NULL,
	`rig_revision` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_user_unit_clip_idx` ON `feedback` (`user_id`,`unit_id`,`animation_id`,`created_at`);
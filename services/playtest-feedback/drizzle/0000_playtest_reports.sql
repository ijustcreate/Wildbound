CREATE TABLE `playtest_reports` (
  `id` text PRIMARY KEY NOT NULL,
  `category` text NOT NULL,
  `message` text NOT NULL,
  `game_version` text NOT NULL,
  `game_screen` text NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `playtest_reports_created_at` ON `playtest_reports` (`created_at`);

ALTER TABLE `poll` ADD `time-limit` integer;--> statement-breakpoint
ALTER TABLE `submission` ADD `started_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `submission` ADD `completed_at` integer;
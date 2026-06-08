ALTER TABLE `question` ADD `max_selections` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `question` ADD `is_required` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `question` DROP COLUMN `config`;
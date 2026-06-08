DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "answer_question_idx";--> statement-breakpoint
DROP INDEX "poll_slug_unique";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
ALTER TABLE `answer` ALTER COLUMN "is_correct" TO "is_correct" integer NOT NULL;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `answer_question_idx` ON `answer` (`question_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `poll_slug_unique` ON `poll` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
ALTER TABLE `answer` ADD `answer_text` text NOT NULL;--> statement-breakpoint
ALTER TABLE `answer` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `answer` DROP COLUMN `option_text`;
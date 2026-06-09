DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "poll_slug_unique";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "user_poll_unique_idx";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
ALTER TABLE `question` ALTER COLUMN "metadata" TO "metadata" text NOT NULL;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `poll_slug_unique` ON `poll` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_poll_unique_idx` ON `submission` (`userId`,`poll_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
ALTER TABLE `user_answer` ADD `value` text NOT NULL;--> statement-breakpoint
ALTER TABLE `user_answer` DROP COLUMN `answer_id`;--> statement-breakpoint
ALTER TABLE `user_answer` DROP COLUMN `sort_order`;--> statement-breakpoint
ALTER TABLE `user_answer` DROP COLUMN `text_response`;
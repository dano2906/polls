CREATE INDEX `poll_user_id_idx` ON `poll` (`user_id`);--> statement-breakpoint
CREATE INDEX `poll_slug_idx` ON `poll` (`slug`);--> statement-breakpoint
CREATE INDEX `poll_status_idx` ON `poll` (`status`);--> statement-breakpoint
CREATE INDEX `poll_questions_poll_id_idx` ON `poll_question` (`poll_id`);--> statement-breakpoint
CREATE INDEX `poll_questions_question_id_idx` ON `poll_question` (`question_id`);--> statement-breakpoint
CREATE INDEX `submission_poll_id_idx` ON `submission` (`poll_id`);--> statement-breakpoint
CREATE INDEX `submission_user_id_idx` ON `submission` (`userId`);--> statement-breakpoint
CREATE INDEX `user_answer_submission_id_idx` ON `user_answer` (`submission_id`);--> statement-breakpoint
CREATE INDEX `user_answer_question_id_idx` ON `user_answer` (`question_id`);
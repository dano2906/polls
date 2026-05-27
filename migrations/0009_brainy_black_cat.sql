PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_poll_question` (
	`poll_id` text NOT NULL,
	`question_id` text NOT NULL,
	`order` integer DEFAULT 0,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_poll_question`("poll_id", "question_id", "order") SELECT "poll_id", "question_id", "order" FROM `poll_question`;--> statement-breakpoint
DROP TABLE `poll_question`;--> statement-breakpoint
ALTER TABLE `__new_poll_question` RENAME TO `poll_question`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_submission` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`userId` text NOT NULL,
	`submitted_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_submission`("id", "poll_id", "userId", "submitted_at") SELECT "id", "poll_id", "userId", "submitted_at" FROM `submission`;--> statement-breakpoint
DROP TABLE `submission`;--> statement-breakpoint
ALTER TABLE `__new_submission` RENAME TO `submission`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_poll_unique_idx` ON `submission` (`userId`,`poll_id`);--> statement-breakpoint
CREATE TABLE `__new_user_answer` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`question_id` text NOT NULL,
	`answer_id` text,
	`sort_order` integer,
	`text_response` text,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`answer_id`) REFERENCES `answer`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_answer`("id", "submission_id", "question_id", "answer_id", "sort_order", "text_response") SELECT "id", "submission_id", "question_id", "answer_id", "sort_order", "text_response" FROM `user_answer`;--> statement-breakpoint
DROP TABLE `user_answer`;--> statement-breakpoint
ALTER TABLE `__new_user_answer` RENAME TO `user_answer`;
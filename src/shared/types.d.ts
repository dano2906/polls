import type { InferSelectModel } from "drizzle-orm";
import type { z } from "zod";
import type { userAnswer } from "#/db/schema";
import type {
	createAnswerInput,
	createPollInput,
	createQuestionInput,
	createSubmissionInput,
	questionsBatchSchema,
	selectAnswerOutput,
	selectPollOutput,
	selectQuestionOutput,
	selectSubmissionOutput,
} from "./validation";

export type Poll = z.infer<typeof selectPollOutput>;
export type NewPollInput = z.infer<typeof createPollInput>;

export type Question = z.infer<typeof selectQuestionOutput>;
export type NewQuestion = z.infer<typeof createQuestionInput>;
export type NewQuestionBatch = z.infer<typeof questionsBatchSchema>;

export type Answer = z.infer<typeof selectAnswerOutput>;
export type NewAswer = z.infer<typeof createAnswerInput>;

export type Submission = z.infer<typeof selectSubmissionOutput>;
export type NewSubmission = z.infer<typeof createSubmissionInput>;
export type UserAnswer = InferSelectModel<typeof userAnswer>;

export enum Statuses {
	DRAFT = "draft",
	PUBLISHED = "published",
	ARCHIVED = "archived",
}

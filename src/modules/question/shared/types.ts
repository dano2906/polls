import type { InferSelectModel } from "drizzle-orm";
import type { z } from "zod";
import type { userAnswer } from "@/common/db/schema";
import type {
	createAnswerInput,
	createQuestionInput,
	questionsBatchSchema,
	selectAnswerOutput,
	selectQuestionOutput,
	selectSubmissionOutput,
} from "../lib/validation";

export type Question = z.infer<typeof selectQuestionOutput>;
export type NewQuestion = z.infer<typeof createQuestionInput>;
export type NewQuestionBatch = z.infer<typeof questionsBatchSchema>;

export type Answer = z.infer<typeof selectAnswerOutput>;
export type NewAswer = z.infer<typeof createAnswerInput>;

export type Submission = z.infer<typeof selectSubmissionOutput>;
export type UserAnswer = InferSelectModel<typeof userAnswer>;

export type GeneratePollQuestion = {
	context: string;
	lang?: "spanish" | "english";
};

export const QUESTION_TYPES = [
	"single_choice",
	"multiple_choice",
	"open_answer",
	"ranking",
	"rating",
	"date_single",
	"date_range",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface QuestionMetadata {
	minRating?: number;
	maxRating?: number;
	minDate?: string | null;
	maxDate?: string | null;
}

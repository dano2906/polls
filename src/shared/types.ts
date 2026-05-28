import type { InferSelectModel } from "drizzle-orm";
import type { z } from "zod";
import type { userAnswer } from "#/db/schema";
import type {
	createAnswerInput,
	createPollInput,
	createQuestionInput,
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
export type UserAnswer = InferSelectModel<typeof userAnswer>;

export enum Statuses {
	DRAFT = "draft",
	PUBLISHED = "published",
	ARCHIVED = "archived",
}

export type GeneratePoll = {
	context: string;
	lang?: "spanish" | "english";
};

export const QUESTION_TYPES = [
	"single_choice",
	"multiple_choice",
	"open_answer",
	"ranking",
	"rating",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface ExportData {
	name: string;
	description: string | null;
	startDate: Date;
	endDate: Date | null;
	questions: {
		questionText: string;
		type: QuestionType;
		hasCorrectAnswers: boolean | null;
		maxSelections: number | null;
		order: number | null;
		isRequired: boolean | null;
		metadata: {
			minRating?: number;
			maxRating?: number;
		};
		answers: {
			answerText: string | null;
			isCorrect: boolean | null;
		}[];
	}[];
}

export enum ExportFormat {
	EXCEL = "excel",
	JSON = "json",
	CSV = "csv",
}

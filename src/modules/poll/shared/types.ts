import type z from "zod";
import type { QuestionMetadata } from "@/question/shared/types";
import type {
	createPollInput,
	exportDataSchema,
	selectPollOutput,
} from "../lib/validation";

export type Poll = z.infer<typeof selectPollOutput>;
export type NewPollInput = z.infer<typeof createPollInput>;

export const POLL_STATUS_FLOW = ["draft", "published", "archived"] as const;
export type PollStatus = (typeof POLL_STATUS_FLOW)[number];

export type SelectedAnswer = {
	answerId: string;
	answerText: string | null;
	isCorrect: boolean | null;
	sortOrder: number | null;
};

export type UserQuestionResult = {
	id: string;
	questionText: string;
	type:
		| "single_choice"
		| "multiple_choice"
		| "open_answer"
		| "ranking"
		| "rating"
		| "date_single"
		| "date_range"
		| string;
	metadata: QuestionMetadata;
	order: number | null;
	textResponse: string | null;
	selectedAnswers: SelectedAnswer[];
};

export type ExportData = z.infer<typeof exportDataSchema>;

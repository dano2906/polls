import type { z } from "zod";
import type {
	createQuestionInput,
	questionsBatchSchema,
	selectQuestionOutput,
} from "../lib/validation";

export type Question = z.infer<typeof selectQuestionOutput>;
export type NewQuestion = z.infer<typeof createQuestionInput>;
export type NewQuestionBatch = z.infer<typeof questionsBatchSchema>;

export type GeneratePollQuestion = {
	context: string;
	lang?: "spanish" | "english";
};

export type QuestionBatchInput = z.infer<typeof questionsBatchSchema>;

export const QUESTION_TYPES = [
	"single_choice",
	"multiple_choice",
	"open_answer",
	"ranking",
	"rating",
	"date_single",
	"date_range",
	"point_distribution",
	"geolocation",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export type QuestionInput = z.infer<typeof createQuestionInput>;

export type QuestionMetadata =
	| { type: "open_answer" }
	| { type: "rating"; minValue: number; maxValue: number }
	| { type: "ranking" }
	| { type: "single_choice"; hasCorrectAnswers: boolean; maxSelections: number }
	| {
			type: "multiple_choice";
			hasCorrectAnswers: boolean;
			maxSelections: number;
	  }
	| { type: "date_single"; minDate?: string | null; maxDate?: string | null }
	| { type: "date_range"; minDate?: string | null; maxDate?: string | null }
	| { type: "point_distribution"; distributionAmount: number }
	| {
			type: "geolocation";
			requireAddress?: boolean;
			defaultCenter?: { lat: number; lng: number };
			zoom?: number;
	  };

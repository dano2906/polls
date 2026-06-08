import type z from "zod";
import type { QuestionType } from "@/question/shared/types";
import type { createPollInput, selectPollOutput } from "../lib/validation";

export type Poll = z.infer<typeof selectPollOutput>;
export type NewPollInput = z.infer<typeof createPollInput>;

export enum Statuses {
	DRAFT = "draft",
	PUBLISHED = "published",
	ARCHIVED = "archived",
}

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

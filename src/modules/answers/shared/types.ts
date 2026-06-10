import type { InferSelectModel } from "drizzle-orm";
import type z from "zod";
import type { userAnswer } from "@/common/db/schema";
import type {
	createAnswerInput,
	selectAnswerOutput,
	selectSubmissionOutput,
} from "@/question/lib/validation";

export type UserAnswerValue =
	| { type: "open_answer"; textResponse: string }
	| { type: "rating"; score: number }
	| { type: "ranking"; orderedAnswerIds: string[] }
	| { type: "single_choice"; selectedAnswerId: string }
	| { type: "multiple_choice"; selectedAnswerIds: string[] }
	| { type: "date_single"; date: string }
	| { type: "date_range"; startDate: string; endDate: string }
	| { type: "point_distribution"; points: Record<string, number> }
	| {
			type: "geolocation";
			lat: number;
			lng: number;
			address?: string | null;
	  };

export type Answer = z.infer<typeof selectAnswerOutput>;
export type NewAswer = z.infer<typeof createAnswerInput>;

export type Submission = z.infer<typeof selectSubmissionOutput>;
export type UserAnswer = InferSelectModel<typeof userAnswer>;

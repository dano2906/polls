import type { InferSelectModel } from "drizzle-orm";
import type {
	answer,
	poll,
	question,
	submission,
	userAnswer,
} from "#/db/schema";

export type Poll = InferSelectModel<typeof poll>;
export type Question = InferSelectModel<typeof question>;
export type Answer = InferSelectModel<typeof answer>;
export type Submission = InferSelectModel<typeof submission>;
export type UserAnswer = InferSelectModel<typeof userAnswer>;

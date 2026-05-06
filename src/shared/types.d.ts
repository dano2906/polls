import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { answer, poll, question, submission } from "#/db/schema";

export type Poll = InferSelectModel<typeof poll>;
export type NewPoll = InferInsertModel<typeof poll>;
export type Question = InferSelectModel<typeof question>;
export type NewQuestion = InferInsertModel<typeof question>;
export type Answer = InferSelectModel<typeof answer>;
export type NewAnswer = InferInsertModel<typeof answer>;
export type Submission = InferSelectModel<typeof submission>;
export type NewSubmission = InferInsertModel<typeof submission>;

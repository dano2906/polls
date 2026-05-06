import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod";
import { answer, poll, question, submission } from "#/db/schema";

export const createPollInput = createInsertSchema(poll);
export const createQuestionInput = createInsertSchema(question);
export const createAnswerInput = createInsertSchema(answer);
export const createSubmissionInput = createInsertSchema(submission);

export type NewPostInput = z.infer<typeof createPollInput>;
export type NewQuestion = z.infer<typeof createQuestionInput>;
export type NewAswer = z.infer<typeof createAnswerInput>;
export type NewSubmission = z.infer<typeof createSubmissionInput>;

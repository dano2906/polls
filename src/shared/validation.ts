import { createInsertSchema } from "drizzle-zod";
import { answer, poll, question, submission } from "#/db/schema";

export const createPollInput = createInsertSchema(poll);
export const createQuestionInput = createInsertSchema(question);
export const createAnswerInput = createInsertSchema(answer);
export const createSubmissionInput = createInsertSchema(submission);

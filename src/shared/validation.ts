import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { answer, poll, question, submission } from "#/db/schema";

export const createPollInput = z
	.object({
		name: z
			.string()
			.min(2, { message: "Debe tener mínimo 2 caracteres" })
			.max(200, { message: "Debe tener máximo 32 caracteres" }),
		slug: z.string().optional(),
		startDate: z.date(),
		endDate: z.date().optional(),
		description: z.string().max(200).optional(),
		status: z.enum(["draft", "published", "archived"]).optional(),
		userId: z.string(),
	})
	.refine(
		(data) => {
			if (!data.endDate) return true;
			return data.endDate >= (data.startDate as Date);
		},
		{
			message: "La fecha de fin no puede ser anterior a la de inicio",
			path: ["endDate"],
		},
	)
	.refine(
		(data) => {
			if (!data.slug) return true;
			return data.slug.length < 6;
		},
		{
			message: "El slug debe 6 caracteres alfanuméricos.",
			path: ["slug"],
		},
	);
export const createQuestionInput = z
	.object({
		type: z.enum(["single_choice", "multiple_choice"]),
		text: z.string().max(500),
		hasCorrectAnswer: z.boolean(),
		config: z.object({
			maxSelections: z.number().optional(),
			isRequired: z.boolean().optional(),
		}),
	})
	.refine((data) => {
		if (
			data.type === "single_choice" &&
			data.config.maxSelections &&
			data.config.maxSelections > 1
		)
			return false;
		else return true;
	});
export const questionsBatchSchema = z.object({
	questions: z.array(createQuestionInput),
});
export const selectPollOutput = createSelectSchema(poll);
export const selectQuestionOutput = createSelectSchema(question);
export const createAnswerInput = createInsertSchema(answer);
export const selectAnswerOutput = createSelectSchema(answer);
export const createSubmissionInput = createInsertSchema(submission);
export const selectSubmissionOutput = createSelectSchema(submission);

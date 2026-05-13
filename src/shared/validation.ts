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
export const editPollInput = z
	.object({
		name: z
			.string()
			.min(2, { message: "Debe tener mínimo 2 caracteres" })
			.max(200, { message: "Debe tener máximo 32 caracteres" }),
		startDate: z.date(),
		endDate: z.date().optional(),
		description: z.string().max(200).optional(),
		status: z.enum(["draft", "published", "archived"]).optional(),
		userId: z.string(),
	})
	.partial()
	.refine(
		(data) => {
			if (!data.endDate) return true;
			return data.endDate >= (data.startDate as Date);
		},
		{
			message: "La fecha de fin no puede ser anterior a la de inicio",
			path: ["endDate"],
		},
	);
export const createAnswerInput = z.object({
	answerText: z
		.string()
		.min(1, { message: "Este campo es requerido" })
		.max(500, { message: "Debe tener máximo 500 caracteres" }),
	isCorrect: z.boolean().default(false),
});
export const createQuestionInput = z
	.object({
		type: z.enum(["single_choice", "multiple_choice"]),
		questionText: z.string().max(500),
		hasCorrectAnswer: z.boolean(),
		maxSelections: z.number().default(1).optional(),
		isRequired: z.boolean().optional(),
		answers: z.array(createAnswerInput),
	})
	.refine((data) => {
		if (
			data.type === "single_choice" &&
			data.maxSelections &&
			data.maxSelections > 1
		)
			return false;
		else return true;
	});
export const questionsBatchSchema = z
	.object({
		questions: z.array(createQuestionInput),
		pollId: z.string(),
	})
	.refine((data) => {
		if (data.questions.length === 0 || !data.pollId) return false;
		return true;
	});
export const selectPollOutput = createSelectSchema(poll);
export const selectQuestionOutput = createSelectSchema(question);

export const selectAnswerOutput = createSelectSchema(answer);
export const createSubmissionInput = createInsertSchema(submission);
export const selectSubmissionOutput = createSelectSchema(submission);

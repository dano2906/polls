import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { poll } from "@/common/db/schema";
import { QUESTION_TYPES } from "@/question/shared/types";

export const createPollInput = z
	.object({
		name: z
			.string()
			.min(2, { message: "Debe tener mínimo 2 caracteres" })
			.max(200, { message: "Debe tener máximo 32 caracteres" }),
		slug: z.string().optional(),
		startDate: z.date(),
		endDate: z.date().optional(),
		description: z.string().max(500).optional(),
		timeLimit: z.number().optional(),
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
export const forkPollInput = z.object({ pollSlug: z.string().min(6).max(6) });
export const editPollInput = z
	.object({
		name: z
			.string()
			.min(2, { message: "Debe tener mínimo 2 caracteres" })
			.max(200, { message: "Debe tener máximo 32 caracteres" }),
		startDate: z.date(),
		endDate: z.date().optional(),
		timeLimit: z.number().optional(),
		description: z.string().max(500).optional(),
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

export const pollsSearchFiltershSchema = z.object({
	q: z.string().optional().default(""),
	status: z
		.enum(["all", "draft", "published", "archived"])
		.default("all")
		.optional(),
	error: z.string().optional().catch(undefined),
	view: z.enum(["compact", "list"]).default("compact"),
});
export const pollsSearchFilterWithUserSchema = pollsSearchFiltershSchema.extend(
	{
		userId: z.string(),
	},
);

export const questionTypeSchema = z.enum(QUESTION_TYPES);

export const exportDataSchema = z.object({
	name: z.string().min(1, "El nombre es obligatorio"),
	description: z.string().nullable(),

	// z.coerce.date() transforma automáticamente los strings del JSON de la red en objetos Date reales
	startDate: z.coerce.date().default(() => new Date()),
	endDate: z.coerce.date().nullable().default(null),

	questions: z.array(
		z.object({
			questionText: z.string().min(1, "El texto de la pregunta es obligatorio"),
			type: questionTypeSchema,
			hasCorrectAnswers: z.boolean().nullable().default(false),
			maxSelections: z.number().nullable().default(1),
			order: z.number().nullable().default(0),
			isRequired: z.boolean().nullable().default(false),
			metadata: z.object({
				minRating: z.number().optional(),
				maxRating: z.number().optional(),
				distributionAmount: z.number().optional(),
				minDate: z.string().optional(),
				maxDate: z.string().optional(),
			}),

			answers: z.array(
				z.object({
					answerText: z.string().nullable().default(""),
					isCorrect: z.boolean().nullable().default(false),
				}),
			),
		}),
	),
});

export const selectPollOutput = createSelectSchema(poll);

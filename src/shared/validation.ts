import { createSelectSchema } from "drizzle-zod";
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
		description: z.string().max(500).optional(),
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
export const createAnswerInput = z.object({
	id: z.string().nullable().optional(),
	answerText: z
		.string()
		.min(1, { message: "Este campo es requerido" })
		.max(500, { message: "Debe tener máximo 500 caracteres" })
		.describe("Enunciado de la respuesta."),
	isCorrect: z
		.boolean()
		.default(false)
		.describe(
			"Campo para saber si la respuesta es correcta o no. Por defecto es falso y va en dependencia de si la pregunta tiene respuestas correctas o no.",
		),
});
export const createQuestionInput = z
	.object({
		id: z.string().nullable().optional(),
		type: z
			.enum(["single_choice", "multiple_choice"])
			.describe("Tipo de la pregunta."),
		questionText: z
			.string()
			.max(500)
			.describe("El enunciado o pregunta clara."),
		hasCorrectAnswers: z
			.boolean()
			.describe("Campo para saber si la pregunta tiene respuestas correctas."),
		maxSelections: z
			.number()
			.default(1)
			.optional()
			.describe("Cantidad máxima de selecciones posibles."),
		isRequired: z
			.boolean()
			.optional()
			.describe("Campo para saber si la pregunta es de respuesta obligatoria."),
		answers: z.array(createAnswerInput).describe("Arreglo de respuestas"),
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
		questions: z.array(createQuestionInput).describe("Arreglo de preguntas"),
		slug: z.string().describe("Slug de la encuesta"),
	})
	.refine((data) => {
		if (data.questions.length === 0) return false;
		return true;
	});
export const generateQuestionsSchema = z.object({
	lang: z.enum(["spanish", "english"]),
	pollDescription: z.string().optional().nullable(),
	context: z.string().min(32).max(500),
});

const submissionAnswerInput = z.record(
	z.uuid({ message: "La clave debe ser un UUID válido" }),
	z.union([z.uuid(), z.array(z.uuid())]),
);

export const completePollInput = z.object({
	pollId: z.uuid(),
	answers: submissionAnswerInput,
});

export const pollsSearchFiltershSchema = z.object({
	q: z.string().optional().default(""),
	status: z
		.enum(["all", "draft", "published", "archived"])
		.default("all")
		.optional(),
	error: z.string().optional().catch(undefined),
});
export const pollsSearchFilterWithUserSchema = pollsSearchFiltershSchema.extend(
	{
		userId: z.string(),
	},
);

export const selectPollOutput = createSelectSchema(poll);
export const selectQuestionOutput = createSelectSchema(question);

export const selectAnswerOutput = createSelectSchema(answer);
export const selectSubmissionOutput = createSelectSchema(submission);

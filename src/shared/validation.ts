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
		.min(1)
		.max(500, { message: "Debe tener máximo 500 caracteres" })
		.describe("Enunciado de la respuesta."),
	isCorrect: z
		.boolean()
		.default(false)
		.describe(
			"Campo para saber si la respuesta es correcta o no. Por defecto es falso y va en dependencia de si la pregunta tiene respuestas correctas o no.",
		),
	imageUrl: z.string().url("Debe ser una URL válida").nullable().optional(),
	imagePublicId: z.string().nullable().optional(),
});

const baseQuestionFields = z.object({
	id: z.string().nullable().optional(),
	questionText: z.string().min(1).max(500).describe("El enunciado claro."),
	isRequired: z.boolean().default(true).optional(),
	imageUrl: z.url("Debe ser una URL válida").nullable().optional(),
	imagePublicId: z.string().nullable().optional(),
});

// --- TIPO: Open Answer ---
const openAnswerSchema = baseQuestionFields.extend({
	type: z.literal("open_answer"),
	hasCorrectAnswers: z.literal(false).default(false),
	maxSelections: z.literal(1).default(1),
	answers: z.tuple([]).default([]), // Forzamos un array estrictamente vacío
});

// --- TIPO: Rating (Calificación) ---
const ratingSchema = baseQuestionFields
	.extend({
		type: z.literal("rating"),
		hasCorrectAnswers: z.literal(false).default(false),
		maxSelections: z.literal(1).default(1),
		answers: z.tuple([]).default([]), // Forzamos un array estrictamente vacío
		minValue: z.number().min(0).max(10).default(1),
		maxValue: z.number().min(1).max(10).default(5),
	})
	.refine((data) => (data.minValue ?? 1) < (data.maxValue ?? 5), {
		message: "El valor máximo debe ser estrictamente mayor al valor mínimo.",
		path: ["maxValue"],
	});

// --- TIPO: Ranking (Ordenamiento) ---
const rankingSchema = baseQuestionFields.extend({
	type: z.literal("ranking"),
	hasCorrectAnswers: z.literal(false).default(false),
	maxSelections: z.literal(1).default(1),
	answers: z
		.array(createAnswerInput)
		.min(2, "Para ordenar debes añadir al menos 2 opciones."),
});

// --- TIPOS: Opciones Seleccionables (Single / Multiple) ---
const choiceQuestionsSchema = baseQuestionFields
	.extend({
		type: z.enum(["single_choice", "multiple_choice"]),
		hasCorrectAnswers: z.boolean().default(false),
		maxSelections: z.number().min(1).default(1).optional(),
		answers: z
			.array(createAnswerInput)
			.min(2, "Debes añadir al menos 2 opciones de respuesta."),
	})
	.superRefine((data, ctx) => {
		const correctAnswersCount = data.answers.filter(
			(ans) => ans.isCorrect,
		).length;
		const totalAnswersCount = data.answers.length;

		// Validación Single Choice
		if (data.type === "single_choice") {
			if (data.maxSelections && data.maxSelections > 1) {
				ctx.addIssue({
					code: "custom",
					path: ["maxSelections"],
					message:
						"En selección simple, el máximo de selecciones no puede ser mayor a 1.",
				});
			}
			if (data.hasCorrectAnswers && correctAnswersCount > 1) {
				ctx.addIssue({
					code: "custom",
					path: ["answers"],
					message:
						"Una pregunta de selección simple no puede tener más de una respuesta correcta.",
				});
			}
		}

		// Validación Multiple Choice
		if (data.type === "multiple_choice" && data.maxSelections) {
			if (data.maxSelections > totalAnswersCount) {
				ctx.addIssue({
					code: "custom",
					path: ["maxSelections"],
					message:
						"El límite máximo no puede superar la cantidad de opciones disponibles.",
				});
			}
		}

		// Validación de banderas de evaluación (Correctas vs Incorrectas)
		if (data.hasCorrectAnswers && correctAnswersCount === 0) {
			ctx.addIssue({
				code: "custom",
				path: ["answers"],
				message: "Se indicó que hay respuestas correctas, marca al menos una.",
			});
		}

		if (!data.hasCorrectAnswers && correctAnswersCount > 0) {
			ctx.addIssue({
				code: "custom",
				path: ["answers"],
				message:
					"No se activó la evaluación, ninguna opción debe marcarse como correcta.",
			});
		}
	});

export const dateSingleQuestionSchema = baseQuestionFields
	.extend({
		type: z.literal("date_single"),
		hasCorrectAnswers: z.literal(false).default(false),
		maxSelections: z.literal(1).default(1),
		answers: z.tuple([]).default([]), // Forzamos un array estrictamente vacío
		// Parámetros opcionales si el creador quiere poner límites (YYYY-MM-DD)
		minDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (debe ser YYYY-MM-DD)")
			.nullable()
			.optional(),
		maxDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (debe ser YYYY-MM-DD)")
			.nullable()
			.optional(),
	})
	.refine(
		(data) => {
			if (data.minDate && data.maxDate) {
				return new Date(data.minDate) <= new Date(data.maxDate);
			}
			return true;
		},
		{
			message: "La fecha máxima no puede ser anterior a la fecha mínima.",
			path: ["maxDate"],
		},
	);

// --- TIPO: Date Range (Rango de Fechas) ---
export const dateRangeQuestionSchema = baseQuestionFields
	.extend({
		type: z.literal("date_range"),
		hasCorrectAnswers: z.literal(false).default(false),
		maxSelections: z.literal(1).default(1),
		answers: z.tuple([]).default([]),
		minDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (debe ser YYYY-MM-DD)")
			.nullable()
			.optional(),
		maxDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (debe ser YYYY-MM-DD)")
			.nullable()
			.optional(),
	})
	.refine(
		(data) => {
			if (data.minDate && data.maxDate) {
				return new Date(data.minDate) <= new Date(data.maxDate);
			}
			return true;
		},
		{
			message: "La fecha máxima permisible no puede ser anterior a la mínima.",
			path: ["maxDate"],
		},
	);

// ========================================================
// 2. UNION DISCRIMINADA FINAL
// ========================================================
export const createQuestionInput = z.discriminatedUnion("type", [
	openAnswerSchema,
	ratingSchema,
	rankingSchema,
	choiceQuestionsSchema,
	dateSingleQuestionSchema,
	dateRangeQuestionSchema,
]);
export const questionsBatchSchema = z
	.object({
		questions: z.array(createQuestionInput).describe("Arreglo de preguntas"),
		slug: z.string().describe("Slug de la encuesta"),
	})
	.superRefine((data, ctx) => {
		// Validación del lote: Evitar arreglos vacíos con un mensaje personalizado
		if (!data.questions || data.questions.length === 0) {
			ctx.addIssue({
				code: "custom",
				path: ["questions"],
				message: "La encuesta debe contener al menos una pregunta.",
			});
		}
	});
export const generateQuestionsSchema = z.object({
	lang: z.enum(["spanish", "english"]),
	pollDescription: z.string().optional().nullable(),
	context: z.string().min(32).max(500),
});

const submissionAnswerInput = z.record(
	z.uuid({ message: "La clave debe ser un UUID válido" }),
	z.union([z.string(), z.array(z.string())]),
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
	view: z.enum(["compact", "list"]).default("compact"),
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

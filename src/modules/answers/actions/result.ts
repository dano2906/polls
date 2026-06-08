import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/common/db";
import { poll, question, submission, userAnswer } from "@/common/db/schema";
import { getSession } from "@/common/lib/auth-functions";
import { completePollInput } from "../lib/validation";

export const submitPollAnswers = createServerFn()
	.validator(completePollInput)
	.handler(async ({ data }) => {
		const { pollId, answers } = data;
		const session = await getSession();

		if (!session) {
			throw redirect({ to: "/" });
		}

		const existingPoll = await db.query.poll.findFirst({
			where: eq(poll.id, pollId),
		});

		if (!existingPoll) {
			throw new Error("Poll not found");
		}

		if (existingPoll.status !== "published") {
			throw new Error("Poll is not accepting submissions");
		}

		const targetQuestionIds = Object.keys(answers);
		const pollQuestionsData = await db
			.select({ id: question.id, type: question.type })
			.from(question)
			.where(inArray(question.id, targetQuestionIds));

		const questionTypesMap = new Map(
			pollQuestionsData.map((q) => [q.id, q.type]),
		);

		return await db.transaction(async (tx) => {
			// 1. Crear el registro de la entrega (Submission)
			const [newSubmission] = await tx
				.insert(submission)
				.values({
					pollId,
					userId: session.user.id,
				})
				.returning();

			const answersToInsert = Object.entries(answers).flatMap(
				([questionId, value]): (typeof userAnswer.$inferInsert)[] => {
					const qType = questionTypesMap.get(questionId);

					// Validación de valores vacíos
					if (
						value === undefined ||
						value === null ||
						(Array.isArray(value) && value.length === 0)
					) {
						return [];
					}

					// --- CASO A: ORDENAMIENTO (Ranking) ---
					if (qType === "ranking" && Array.isArray(value)) {
						return value.map((aId, index) => ({
							submissionId: newSubmission.id,
							questionId: questionId,
							answerId: aId,
							textResponse: null,
							sortOrder: index + 1,
						}));
					}

					// --- CASO B: SELECCIÓN MÚLTIPLE ---
					if (qType === "multiple_choice" && Array.isArray(value)) {
						return value.map((aId) => ({
							submissionId: newSubmission.id,
							questionId: questionId,
							answerId: aId,
							textResponse: null,
							sortOrder: null,
						}));
					}

					// --- 🆕 CASO E: RANGO DE FECHAS (date_range) ---
					if (qType === "date_range" && typeof value === "string") {
						return [
							{
								submissionId: newSubmission.id,
								questionId: questionId,
								answerId: null,
								// Guardamos el string plano directamente: "2026-06-09/2026-06-25"
								textResponse: value,
								sortOrder: null,
							},
						];
					}

					// --- CASO C: TEXTO LIBRE, CALIFICACIÓN O FECHA ÚNICA ---
					// 💡 Añadimos "date_single" y "date" aquí porque se guardan como un string simple directo
					if (
						qType === "open_answer" ||
						qType === "rating" ||
						qType === "date_single"
					) {
						return [
							{
								submissionId: newSubmission.id,
								questionId: questionId,
								answerId: null,
								textResponse: String(value), // Guarda la fecha ISO string o YYYY-MM-DD directamente
								sortOrder: null,
							},
						];
					}

					// --- CASO D: SELECCIÓN SIMPLE ---
					return [
						{
							submissionId: newSubmission.id,
							questionId: questionId,
							answerId: String(value),
							textResponse: null,
							sortOrder: null,
						},
					];
				},
			);

			if (answersToInsert.length > 0) {
				await tx.insert(userAnswer).values(answersToInsert);
			}

			return { success: true, submissionId: newSubmission.id };
		});
	});

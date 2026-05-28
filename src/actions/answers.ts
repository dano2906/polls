import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq, inArray } from "drizzle-orm";
import { db } from "#/db";
import { poll, question, submission, userAnswer } from "#/db/schema";
import { getSession } from "#/lib/auth-functions";
import { completePollInput } from "#/shared/validation";

export const submitPollAnswers = createServerFn()
	.inputValidator(completePollInput)
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

		// 💡 PASO CLAVE: Buscamos las preguntas asociadas a este formulario en la DB.
		// Esto nos permite conocer el 'type' real de cada pregunta sin depender de lo que envíe el cliente.
		const targetQuestionIds = Object.keys(answers);
		const pollQuestionsData = await db
			.select({ id: question.id, type: question.type })
			.from(question)
			.where(inArray(question.id, targetQuestionIds));

		// Lo convertimos en un mapa de acceso rápido { [id]: "rating" | "open_answer" | etc }
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
					// 💡 SOLUCIÓN: Tipamos el retorno de cada iteración
					const qType = questionTypesMap.get(questionId);

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
					if (Array.isArray(value)) {
						return value.map((aId) => ({
							submissionId: newSubmission.id,
							questionId: questionId,
							answerId: aId,
							textResponse: null,
							sortOrder: null,
						}));
					}

					// --- CASO C: TEXTO LIBRE O CALIFICACIÓN ---
					if (qType === "open_answer" || qType === "rating") {
						return [
							{
								submissionId: newSubmission.id,
								questionId: questionId,
								answerId: null,
								textResponse: String(value),
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

import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "#/db";
import { answer, pollQuestions, question } from "#/db/schema";
import { questionsBatchSchema } from "#/shared/validation";

export const createQuestions = createServerFn({ method: "POST" })
	.inputValidator((data) => questionsBatchSchema.parse(data))
	.handler(async ({ data }) => {
		await db.transaction(async (tx) => {
			for (const [index, qData] of data.questions.entries()) {
				// 1. Insertar la Pregunta (una por una para obtener su ID)
				const [insertedQuestion] = await tx
					.insert(question)
					.values({
						questionText: qData.questionText,
						type: qData.type,
						hasCorrectAnswers: qData.hasCorrectAnswers ?? false,
						maxSelections: qData.maxSelections ?? 1,
						isRequired: qData.isRequired ?? true,
					})
					.returning();

				const questionId = insertedQuestion.id;

				// 2. Vincular con la Encuesta (Tabla pivot/relación)
				await tx.insert(pollQuestions).values({
					pollId: data.pollId,
					questionId,
					order: index + 1,
				});

				// 3. Insertar todas las respuestas de ESTA pregunta en bloque
				if (qData.answers && qData.answers.length > 0) {
					const answersToInsert = qData.answers.map(
						(ans, ans_index: number) => ({
							questionId,
							answerText: ans.answerText,
							isCorrect: ans.isCorrect,
							order: ans_index,
						}),
					);

					await tx.insert(answer).values(answersToInsert);
				}
			}

			return { success: true };
		});
	});

export const saveQuestionsBatch = createServerFn({
	method: "POST",
})
	.inputValidator((data) => questionsBatchSchema.parse(data))
	.handler(async ({ data }) => {
		const { questions: questionsData, pollId } = data;
		return await db.transaction(async (tx) => {
			// 1. Rastrear IDs para limpieza posterior (Deletions)
			const currentQuestionIds: string[] = [];

			for (let i = 0; i < questionsData.length; i++) {
				const qData = questionsData[i];
				let qId = qData.id;

				// --- FLUJO DE PREGUNTA ---
				if (qId) {
					// Actualizar pregunta existente
					await tx
						.update(question)
						.set({
							type: qData.type,
							questionText: qData.questionText,
							hasCorrectAnswers: qData.hasCorrectAnswers,
							maxSelections: qData.maxSelections,
							isRequired: qData.isRequired,
						})
						.where(eq(question.id, qId));
				} else {
					// Insertar nueva pregunta
					const [newQ] = await tx
						.insert(question)
						.values({
							type: qData.type,
							questionText: qData.questionText,
							hasCorrectAnswers: qData.hasCorrectAnswers,
							maxSelections: qData.maxSelections,
							isRequired: qData.isRequired,
						})
						.returning({ id: question.id });
					qId = newQ.id;
				}
				currentQuestionIds.push(qId);

				// --- FLUJO DE TABLA INTERMEDIA (pollQuestions) ---
				// Aseguramos el vínculo y actualizamos el orden
				const [existingLink] = await tx
					.select()
					.from(pollQuestions)
					.where(
						and(
							eq(pollQuestions.pollId, pollId),
							eq(pollQuestions.questionId, qId),
						),
					);

				if (existingLink) {
					await tx
						.update(pollQuestions)
						.set({ order: i })
						.where(
							and(
								eq(pollQuestions.pollId, pollId),
								eq(pollQuestions.questionId, qId),
							),
						);
				} else {
					await tx.insert(pollQuestions).values({
						pollId,
						questionId: qId,
						order: i,
					});
				}

				// --- FLUJO DE RESPUESTAS ---
				const currentAnswerIds: string[] = [];
				for (let j = 0; j < qData.answers.length; j++) {
					const aData = qData.answers[j];
					if (aData.id) {
						await tx
							.update(answer)
							.set({
								answerText: aData.answerText,
								isCorrect: aData.isCorrect,
								order: j,
							})
							.where(eq(answer.id, aData.id));
						currentAnswerIds.push(aData.id);
					} else {
						const [newA] = await tx
							.insert(answer)
							.values({
								questionId: qId,
								answerText: aData.answerText,
								isCorrect: aData.isCorrect,
								order: j,
							})
							.returning({ id: answer.id });
						currentAnswerIds.push(newA.id);
					}
				}

				// Limpiar respuestas eliminadas de esta pregunta
				await tx
					.delete(answer)
					.where(
						and(
							eq(answer.questionId, qId),
							notInArray(answer.id, currentAnswerIds),
						),
					);
			}

			// --- LIMPIEZA FINAL DE PREGUNTAS ---
			// 1. Buscamos qué preguntas estaban vinculadas a este poll pero ya no están en el batch
			const linksToDelete = await tx
				.select({ qId: pollQuestions.questionId })
				.from(pollQuestions)
				.where(
					and(
						eq(pollQuestions.pollId, pollId),
						notInArray(pollQuestions.questionId, currentQuestionIds),
					),
				);

			const idsToDelete = linksToDelete.map((l) => l.qId);

			if (idsToDelete.length > 0) {
				// 2. Borrar los vínculos en la tabla intermedia
				await tx
					.delete(pollQuestions)
					.where(
						and(
							eq(pollQuestions.pollId, pollId),
							inArray(pollQuestions.questionId, idsToDelete),
						),
					);

				// 3. (Opcional) Borrar las preguntas huérfanas y sus respuestas
				// Si una pregunta solo pertenece a un poll, al desvincularla deberías borrarla
				await tx.delete(answer).where(inArray(answer.questionId, idsToDelete));
				await tx.delete(question).where(inArray(question.id, idsToDelete));
			}

			return { success: true };
		});
	});

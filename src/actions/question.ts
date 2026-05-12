import { createServerFn } from "@tanstack/react-start";
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
						hasCorrectAnswers: qData.hasCorrectAnswer ?? false,
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

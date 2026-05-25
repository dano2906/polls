import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "#/db";
import { answer, poll, pollQuestions, question, submission } from "#/db/schema";
import { getSession } from "#/lib/auth-functions";
import { openrouter } from "#/lib/openrouter";
import { generateRandomCode } from "#/lib/utils";
import {
	createQuestionInput,
	generateQuestionsSchema,
	questionsBatchSchema,
} from "#/shared/validation";

export const createQuestions = createServerFn({ method: "POST" })
	.inputValidator(questionsBatchSchema)
	.handler(async ({ data }) => {
		const { slug } = data;
		const session = await getSession();
		if (!session) {
			throw notFound();
		}
		const currentPoll = await db.query.poll.findFirst({
			where: and(eq(poll.slug, slug), eq(poll.userId, session?.user.id)),
		});

		if (!currentPoll) {
			throw notFound();
		}

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
					pollId: currentPoll.id,
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

					return await tx.insert(answer).values(answersToInsert);
				}
			}

			return { success: true };
		});
	});

export const saveQuestionsBatch = createServerFn({
	method: "POST",
})
	.inputValidator(questionsBatchSchema)
	.handler(async ({ data }) => {
		const { questions: questionsData, slug } = data;

		const session = await getSession();
		if (!session) {
			throw notFound();
		}
		const currentPoll = await db.query.poll.findFirst({
			where: and(eq(poll.slug, slug), eq(poll.userId, session?.user.id)),
		});

		if (!currentPoll) {
			throw notFound();
		}

		return await db.transaction(async (tx) => {
			const existingSubmissions = await tx
				.select({ id: submission.id })
				.from(submission)
				.where(eq(submission.pollId, currentPoll.id))
				.limit(1);
			const hasResponses = existingSubmissions.length > 0;

			let targetPollId = currentPoll.id;
			const isNewVersion = hasResponses;
			let activeSlug = slug;

			if (isNewVersion) {
				const newPollId = crypto.randomUUID();
				await tx
					.update(poll)
					.set({
						status: "archived",
						updatedAt: new Date(),
					})
					.where(eq(poll.id, currentPoll.id));
				const newSlug = generateRandomCode();
				await tx.insert(poll).values({
					id: newPollId,
					userId: currentPoll.userId,
					rootId: currentPoll.rootId || currentPoll.id,
					name: currentPoll.name,
					description: currentPoll.description,
					slug: newSlug,
					status: "published",
					version: (currentPoll.version ?? 1) + 1,
					metadata: currentPoll.metadata,
					startDate: currentPoll.startDate,
					endDate: currentPoll.endDate,
				});
				targetPollId = newPollId;
				activeSlug = slug;
			}

			// 1. Rastrear IDs para limpieza posterior (Deletions)
			const currentQuestionIds: string[] = [];

			for (let i = 0; i < questionsData.length; i++) {
				const qData = questionsData[i];
				let qId = qData.id;

				// --- FLUJO DE PREGUNTA ---
				if (qId && !isNewVersion) {
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

				// --- VÍNCULO EN TABLA INTERMEDIA (pollQuestions) ---
				if (!isNewVersion) {
					const [existingLink] = await tx
						.select()
						.from(pollQuestions)
						.where(
							and(
								eq(pollQuestions.pollId, targetPollId),
								eq(pollQuestions.questionId, qId),
							),
						);

					if (existingLink) {
						await tx
							.update(pollQuestions)
							.set({ order: i })
							.where(
								and(
									eq(pollQuestions.pollId, targetPollId),
									eq(pollQuestions.questionId, qId),
								),
							);
					} else {
						await tx.insert(pollQuestions).values({
							pollId: targetPollId,
							questionId: qId,
							order: i,
						});
					}
				} else {
					// Si es una nueva versión, vinculamos directo la nueva pregunta al nuevo pollId
					await tx.insert(pollQuestions).values({
						pollId: targetPollId,
						questionId: qId,
						order: i,
					});
				}

				// --- FLUJO DE RESPUESTAS ---
				const currentAnswerIds: string[] = [];
				for (let j = 0; j < qData.answers.length; j++) {
					const aData = qData.answers[j];

					if (aData.id && !isNewVersion) {
						// Actualizar respuesta existente en caliente
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
						// Nueva respuesta (o clonación limpia por nueva versión)
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

				// Limpiar opciones eliminadas de la pregunta (Solo si NO es una nueva versión)
				if (!isNewVersion) {
					await tx
						.delete(answer)
						.where(
							and(
								eq(answer.questionId, qId),
								notInArray(answer.id, currentAnswerIds),
							),
						);
				}
			}

			// --- LIMPIEZA FINAL DE PREGUNTAS ---
			// 1. Buscamos qué preguntas estaban vinculadas a este poll pero ya no están en el batch
			if (!isNewVersion) {
				const linksToDelete = await tx
					.select({ qId: pollQuestions.questionId })
					.from(pollQuestions)
					.where(
						and(
							eq(pollQuestions.pollId, targetPollId),
							notInArray(pollQuestions.questionId, currentQuestionIds),
						),
					);

				const idsToDelete = linksToDelete.map((l) => l.qId);

				if (idsToDelete.length > 0) {
					await tx
						.delete(pollQuestions)
						.where(
							and(
								eq(pollQuestions.pollId, targetPollId),
								inArray(pollQuestions.questionId, idsToDelete),
							),
						);

					const remainingLinks = await tx
						.select({ questionId: pollQuestions.questionId })
						.from(pollQuestions)
						.where(inArray(pollQuestions.questionId, idsToDelete));

					const stillLinkedIds = new Set(
						remainingLinks.map((r) => r.questionId),
					);
					const orphanIds = idsToDelete.filter((id) => !stillLinkedIds.has(id));

					if (orphanIds.length > 0) {
						await tx
							.delete(answer)
							.where(inArray(answer.questionId, orphanIds));
						await tx.delete(question).where(inArray(question.id, orphanIds));
					}
				}
			}

			return {
				success: true,
				versioned: isNewVersion,
				pollId: targetPollId,
				slug: activeSlug,
			};
		});
	});

export const generateQuestionsFromContext = createServerFn({ method: "POST" })
	.inputValidator(generateQuestionsSchema)
	.handler(async ({ data }) => {
		const result = await generateText({
			model: openrouter.chat(process.env.OPENROUTER_MODEL as string),
			output: Output.object({
				schema: createQuestionInput,
			}),
			system: `You are an expert educational assessment specialist and survey design professional.

Your task is to analyze the provided context and generate a high-quality, relevant, and objective questionnaire based ONLY on that context.

Strictly adhere to the following guidelines:
1. Accuracy: Every question, option, and correct answer must be directly verifiable using the provided context. Do not extrapolate, assume, or introduce external facts.
2. Clarity: Statements must be concise, unambiguous, and free from trick or misleading phrasing.
3. Distractors: Options (incorrect answers) must be plausible and distinct from one another, not obviously filler text.
4. Consistency: The "correctAnswer" property must match exactly one of the items listed inside the "options" array.
5. Answer in ${data.lang ?? "spanish"}.
6. Maintain consistency between type of the question and max number of selections. A single choice question never must have max selection greater than 1.
${data.pollDescription && `7. Use the description of the survey (${data.pollDescription}) to fill the info gaps. If there is no description use only the context`}

You must output your response to fit the requested JSON schema perfectly. Do not include any conversational text, introductory remarks, or markdown wrappers outside the schema.`,
			prompt: `Context: \n ${data.context}`,
		});

		return result.output;
	});

export const enhanceGenerateQuestionContext = createServerFn({ method: "POST" })
	.inputValidator(generateQuestionsSchema.partial())
	.handler(async ({ data }) => {
		const result = await generateText({
			model: openrouter.chat(process.env.OPENROUTER_MODEL as string),
			system: `You are an expert content editor and data structuring specialist. 

Your task is to analyze the provided raw text and rewrite it into a highly optimized, clean, and dense reference context that will be used by another AI model to generate test questions.

Please strictly follow these editing guidelines:
1. Retain All Core Facts: Ensure that all technical terms, definitions, statistics, historical dates, and specific concepts from the original text are preserved exactly as they are. Do not lose any substance.
2. Eliminate Fluff & Redundancy: Remove conversational filler, repetitive explanations, emotional phrasing, and unnecessary introductory sentences. 
3. Improve Structure & Clarity: Organize the information using clear, logical sections. When applicable, use bullet points or key-value structures to separate distinct concepts.
4. Ensure Objectivity: Maintain an informative, authoritative, and completely neutral tone. 
5. Do Not Extrapolate: Do not invent new facts, add external knowledge, or make assumptions that cannot be verified by the original text.
6. Answer in ${data.lang ?? "spanish"}.
Output ONLY the optimized, structured version of the text. Do not include any introductory phrases, explanations, or meta-commentary.`,
			prompt: `Original Text to Optimize:\n"${data.context}"`,
		});

		return result.output;
	});

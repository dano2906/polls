import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { getSession } from "@/auth/actions/auth";
import { db } from "@/common/db";
import {
	answer,
	poll,
	pollQuestions,
	question,
	submission,
} from "@/common/db/schema";
import { openrouter } from "@/common/lib/openrouter";
import { generateRandomCode } from "@/poll/lib/utils";
import {
	createQuestionInput,
	generateQuestionsSchema,
	questionsBatchSchema,
} from "@/question/lib/validation";
import type { QUESTION_TYPES } from "@/question/shared/types";
import { getMetadataForQuestion } from "../lib/utils";

// ==========================================
// 1. CREATE QUESTIONS (BATCH INSERT INICIAL)
// ==========================================
export const createQuestions = createServerFn({ method: "POST" })
	.validator(questionsBatchSchema)
	.handler(async ({ data }) => {
		const { slug } = data;
		const session = await getSession();
		if (!session) {
			throw notFound();
		}

		const currentPoll = await db.query.poll.findFirst({
			where: and(eq(poll.slug, slug), eq(poll.userId, session.user.id)),
		});

		if (!currentPoll) {
			throw notFound();
		}

		return await db.transaction(async (tx) => {
			for (const [index, qData] of data.questions.entries()) {
				const [insertedQuestion] = await tx
					.insert(question)
					.values({
						...(qData.id ? { id: qData.id } : {}),
						questionText: qData.questionText,
						type: qData.type as (typeof QUESTION_TYPES)[number],
						hasCorrectAnswers: "hasCorrectAnswers" in qData ? qData.hasCorrectAnswers : false,
						maxSelections: "maxSelections" in qData ? qData.maxSelections ?? 1 : 1,
						isRequired: qData.isRequired ?? false,
						imageUrl: qData.imageUrl ?? null,
						imagePublicId: qData.imagePublicId ?? null,
						metadata: getMetadataForQuestion(qData),
					})
					.returning();

				const questionId = insertedQuestion.id;

				await tx.insert(pollQuestions).values({
					pollId: currentPoll.id,
					questionId,
					order: index + 1,
				});

				if (
					"answers" in qData &&
					Array.isArray(qData.answers) &&
					qData.answers.length > 0
				) {
					const answersToInsert = qData.answers.map(
						(ans, ans_index: number) => ({
							questionId,
							answerText: ans.answerText,
							isCorrect: ans.isCorrect ?? false,
							order: ans_index,
							imageUrl: ans.imageUrl ?? null,
							imagePublicId: ans.imagePublicId ?? null,
						}),
					);

					await tx.insert(answer).values(answersToInsert);
				}
			}

			return { success: true };
		});
	});

// =======================================================
// 2. SAVE QUESTIONS BATCH (UPSERT + VERSIONADO PROFUNDO)
// =======================================================
export const saveQuestionsBatch = createServerFn({
	method: "POST",
})
	.validator(questionsBatchSchema)
	.handler(async ({ data }) => {
		const { questions: questionsData, slug } = data;

		const session = await getSession();
		if (!session) {
			throw notFound();
		}

		const currentPoll = await db.query.poll.findFirst({
			where: and(eq(poll.slug, slug), eq(poll.userId, session.user.id)),
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
				activeSlug = newSlug;
			}

			// --- NEW VERSION PATH: BATCH ALL INSERTS ---
			if (isNewVersion) {
				const questionValues = questionsData.map((qData) => ({
					id: crypto.randomUUID(),
					questionText: qData.questionText,
					type: qData.type as (typeof QUESTION_TYPES)[number],
					hasCorrectAnswers: "hasCorrectAnswers" in qData ? qData.hasCorrectAnswers : false,
					maxSelections: "maxSelections" in qData ? qData.maxSelections ?? 1 : 1,
					isRequired: qData.isRequired,
					imageUrl: qData.imageUrl ?? null,
					imagePublicId: qData.imagePublicId ?? null,
					metadata: getMetadataForQuestion(qData),
				}));

				await tx.insert(question).values(questionValues);
				await tx
					.insert(pollQuestions)
					.values(
						questionValues.map((qv, i) => ({
							pollId: targetPollId,
							questionId: qv.id,
							order: i + 1,
						})),
					);

				const answerValues = questionsData.flatMap((qData, i) => {
					if (
						!("answers" in qData) ||
						!Array.isArray(qData.answers)
					)
						return [];
					return qData.answers.map((aData, j) => ({
						id: crypto.randomUUID(),
						questionId: questionValues[i].id,
						answerText: aData.answerText,
						isCorrect: aData.isCorrect ?? false,
						order: j,
						imageUrl: aData.imageUrl ?? null,
						imagePublicId: aData.imagePublicId ?? null,
					}));
				});

				if (answerValues.length > 0) {
					await tx.insert(answer).values(answerValues);
				}

				return {
					success: true,
					versioned: true,
					pollId: targetPollId,
					slug: activeSlug,
				};
			}

			// --- IN-PLACE EDIT PATH (BATCHED) ---
			const currentQuestionIds: string[] = [];

			const existingLinks = await tx
				.select()
				.from(pollQuestions)
				.where(eq(pollQuestions.pollId, targetPollId));

			const existingLinkMap = new Map(
				existingLinks.map((l) => [l.questionId, l]),
			);

			const updateQuestions: { qId: string; qData: typeof questionsData[number] }[] = [];
			const insertQuestions: { qData: typeof questionsData[number] }[] = [];

			for (const qData of questionsData) {
				if (qData.id) {
					updateQuestions.push({ qId: qData.id, qData });
				} else {
					insertQuestions.push({ qData });
				}
			}

			await Promise.all(
				updateQuestions.map(({ qId, qData }) =>
					tx
						.update(question)
						.set({
							type: qData.type as (typeof QUESTION_TYPES)[number],
							questionText: qData.questionText,
							hasCorrectAnswers: "hasCorrectAnswers" in qData ? qData.hasCorrectAnswers : false,
							maxSelections: "maxSelections" in qData ? qData.maxSelections ?? 1 : 1,
							isRequired: qData.isRequired,
							imageUrl: qData.imageUrl ?? null,
							imagePublicId: qData.imagePublicId ?? null,
							metadata: getMetadataForQuestion(qData),
						})
						.where(eq(question.id, qId)),
				),
			);

			const insertedIds: string[] = [];
			if (insertQuestions.length > 0) {
				const insertValues = insertQuestions.map(({ qData }) => ({
					id: crypto.randomUUID(),
					questionText: qData.questionText,
					type: qData.type as (typeof QUESTION_TYPES)[number],
					hasCorrectAnswers: "hasCorrectAnswers" in qData ? qData.hasCorrectAnswers : false,
					maxSelections: "maxSelections" in qData ? qData.maxSelections ?? 1 : 1,
					isRequired: qData.isRequired,
					imageUrl: qData.imageUrl ?? null,
					imagePublicId: qData.imagePublicId ?? null,
					metadata: getMetadataForQuestion(qData),
				}));
				await tx.insert(question).values(insertValues);
				insertedIds.push(...insertValues.map((v) => v.id));
			}

			let updateIdx = 0;
			let insertIdx = 0;
			for (const qData of questionsData) {
				if (qData.id) {
					currentQuestionIds.push(updateQuestions[updateIdx].qId);
					updateIdx++;
				} else {
					currentQuestionIds.push(insertedIds[insertIdx]);
					insertIdx++;
				}
			}

			// Batch poll_question link updates and new inserts
			const newLinkValues: { pollId: string; questionId: string; order: number }[] = [];
			const linkUpdatePromises: Promise<any>[] = [];

			for (let i = 0; i < questionsData.length; i++) {
				const qId = currentQuestionIds[i];
				const existingLink = existingLinkMap.get(qId);

				if (existingLink) {
					linkUpdatePromises.push(
						tx
							.update(pollQuestions)
							.set({ order: i + 1 })
							.where(
								and(
									eq(pollQuestions.pollId, targetPollId),
									eq(pollQuestions.questionId, qId),
								),
							),
					);
				} else {
					newLinkValues.push({
						pollId: targetPollId,
						questionId: qId,
						order: i + 1,
					});
				}
			}

			await Promise.all(linkUpdatePromises);

			if (newLinkValues.length > 0) {
				await tx.insert(pollQuestions).values(newLinkValues);
			}

			// Process answers per question (batched)
			const answerProcessPromises = [];

			for (let i = 0; i < questionsData.length; i++) {
				const qData = questionsData[i];
				const qId = currentQuestionIds[i];

				if (
					!("answers" in qData) ||
					!Array.isArray(qData.answers) ||
					qData.answers.length === 0
				)
					continue;

				const currentAnswerIds: string[] = [];
				const updateAnswerPromises: Promise<any>[] = [];
				const insertAnswerValues: {
					id: string;
					questionId: string;
					answerText: string;
					isCorrect: boolean;
					order: number;
					imageUrl: string | null;
					imagePublicId: string | null;
				}[] = [];

				for (let j = 0; j < qData.answers.length; j++) {
					const aData = qData.answers[j];
					if (aData.id) {
						const answerOrder = j;
						updateAnswerPromises.push(
							tx
								.update(answer)
								.set({
									answerText: aData.answerText,
									isCorrect: aData.isCorrect,
									order: answerOrder,
									imageUrl: aData.imageUrl ?? null,
									imagePublicId: aData.imagePublicId ?? null,
								})
								.where(eq(answer.id, aData.id)),
						);
						currentAnswerIds.push(aData.id);
					} else {
						insertAnswerValues.push({
							id: crypto.randomUUID(),
							questionId: qId,
							answerText: aData.answerText,
							isCorrect: aData.isCorrect ?? false,
							order: j,
							imageUrl: aData.imageUrl ?? null,
							imagePublicId: aData.imagePublicId ?? null,
						});
					}
				}

				answerProcessPromises.push(
					Promise.all(updateAnswerPromises).then(async () => {
						if (insertAnswerValues.length > 0) {
							await tx.insert(answer).values(insertAnswerValues);
							currentAnswerIds.push(...insertAnswerValues.map((v) => v.id));
						}

						if (currentAnswerIds.length > 0) {
							await tx
								.delete(answer)
								.where(
									and(
										eq(answer.questionId, qId),
										notInArray(answer.id, currentAnswerIds),
									),
								);
						}
					}),
				);
			}

			await Promise.all(answerProcessPromises);

			// Orphan question cleanup (simplified)
			const linksToDelete = await tx
				.select({ qId: pollQuestions.questionId })
				.from(pollQuestions)
				.where(
					and(
						eq(pollQuestions.pollId, targetPollId),
						currentQuestionIds.length > 0
							? notInArray(pollQuestions.questionId, currentQuestionIds)
							: undefined,
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
				const orphanIds = idsToDelete.filter(
					(id) => !stillLinkedIds.has(id),
				);

				if (orphanIds.length > 0) {
					await tx
						.delete(answer)
						.where(inArray(answer.questionId, orphanIds));
					await tx
						.delete(question)
						.where(inArray(question.id, orphanIds));
				}
			}

			return {
				success: true,
				versioned: false,
				pollId: targetPollId,
				slug: activeSlug,
			};
		});
	});

export const generateQuestionsFromContext = createServerFn({ method: "POST" })
	.validator(generateQuestionsSchema)
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
			prompt: `Context: \n ${data.context.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").slice(0, 2000)}`,
		});

		return result.output;
	});

export const enhanceGenerateQuestionContext = createServerFn({ method: "POST" })
	.validator(generateQuestionsSchema.partial())
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
			prompt: `Original Text to Optimize:\n"${(data.context ?? "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").slice(0, 2000)}"`,
		});

		return result.output;
	});

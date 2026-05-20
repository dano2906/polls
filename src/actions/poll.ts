import { randomUUID } from "node:crypto";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { answer, poll, pollQuestions, question } from "#/db/schema.ts";
import { generateRandomCode } from "#/lib/utils.ts";
import {
	createPollInput,
	editPollInput,
	forkPollInput,
} from "#/shared/validation.ts";
import { db } from "@/db";

export const getPublishedPolls = createServerFn({ method: "GET" }).handler(
	async () => {
		const res = await db.query.poll.findMany({
			where: (poll, { eq }) => eq(poll.status, "published"),
			columns: {
				description: true,
				endDate: true,
				name: true,
				startDate: true,
				version: true,
				slug: true,
			},
			with: {
				user: {
					columns: {
						name: true,
						email: true,
						image: true,
					},
				},
			},
			orderBy: asc(poll.startDate),
		});
		if (!res || res.length === 0) return [];
		return res;
	},
);

export const getUserPolls = createServerFn({ method: "GET" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data }) => {
		try {
			const res = await db
				.select({
					name: poll.name,
					description: poll.description,
					slug: poll.slug,
					startDate: poll.startDate,
					endDate: poll.endDate,
					status: poll.status,
					version: poll.version,
				})
				.from(poll)
				.where(eq(poll.userId, data.userId))
				.orderBy(asc(poll.startDate));
			if (!res || res.length === 0) return [];
			return res;
		} catch (error) {
			console.log("error", error);
		}
	});

export const getPollDetails = createServerFn({ method: "GET" })
	.inputValidator((data: { slug: string }) => data)
	.handler(async ({ data }) => {
		const poll = await db.query.poll.findFirst({
			where: (poll, { eq }) => eq(poll.slug, data.slug),
			columns: {
				description: true,
				endDate: true,
				name: true,
				startDate: true,
				status: true,
				version: true,
			},
			with: {
				pollQuestions: {
					columns: {
						order: true,
						pollId: true,
					},
					with: {
						question: {
							with: {
								answers: {
									columns: {
										metadata: false,
									},
								},
							},
						},
					},
				},
			},
		});
		if (!poll) {
			throw notFound();
		}
		const questions = poll.pollQuestions.map((item) => {
			return {
				order: item.order,
				pollId: item.pollId,
				...item.question,
			};
		});
		return {
			name: poll.name,
			description: poll.description,
			startDate: poll.startDate,
			endDate: poll.endDate,
			status: poll.status,
			version: poll.version,
			metadata: undefined,
			questions,
		};
	});

export const createPoll = createServerFn({ method: "POST" })
	.inputValidator(createPollInput)
	.handler(async ({ data }) => {
		try {
			const newId = randomUUID();
			const res = await db.insert(poll).values({
				...data,
				id: newId,
				slug:
					data.slug && data.slug.length === 6
						? data.slug
						: generateRandomCode(),
			});
			if (res.rowsAffected > 0) {
				return {
					id: newId,
				};
			}
		} catch (error) {
			console.log("error", error);
		}
	});

export const forkPoll = createServerFn({ method: "POST" })
	.inputValidator(forkPollInput)
	.handler(async ({ data }) => {
		const { pollSlug } = data;

		try {
			// Iniciamos una transacción para asegurar la atomicidad
			const result = await db.transaction(async (tx) => {
				// 1. Obtener la encuesta original con todas sus preguntas y respuestas
				const originalPoll = await tx.query.poll.findFirst({
					where: eq(poll.slug, pollSlug),
					with: {
						pollQuestions: {
							with: {
								question: {
									with: {
										answers: true,
									},
								},
							},
						},
					},
				});

				if (!originalPoll) {
					throw notFound({
						throw: true,
					});
				}

				// 2. Calcular la nueva versión y el nuevo slug único
				const nextVersion = (originalPoll.version ?? 1) + 1;
				const nextSlug = generateRandomCode();

				// 3. Insertar la nueva encuesta clonada
				const [insertedPoll] = await tx
					.insert(poll)
					.values({
						userId: originalPoll.userId,
						name: `${originalPoll.name}`,
						description: originalPoll.description,
						slug: nextSlug,
						status: "draft",
						version: nextVersion,
						metadata: originalPoll.metadata,
						startDate: new Date(originalPoll.startDate),
						endDate: originalPoll.endDate
							? new Date(originalPoll.endDate)
							: null,
						rootId: originalPoll.id,
					})
					.returning({ id: poll.id });

				const newPollId = insertedPoll.id;

				// 4. Iterar sobre las preguntas para duplicarlas
				for (const pq of originalPoll.pollQuestions) {
					const origQuestion = pq.question;

					// Insertar la nueva pregunta
					const [insertedQuestion] = await tx
						.insert(question)
						.values({
							type: origQuestion.type,
							questionText: origQuestion.questionText,
							hasCorrectAnswers: origQuestion.hasCorrectAnswers,
							maxSelections: origQuestion.maxSelections,
							isRequired: origQuestion.isRequired,
						})
						.returning({ id: question.id });

					const newQuestionId = insertedQuestion.id;

					// Crear la relación en la tabla intermedia de la nueva encuesta
					await tx.insert(pollQuestions).values({
						pollId: newPollId,
						questionId: newQuestionId,
						order: pq.order,
					});

					// 5. Si la pregunta tiene respuestas, duplicarlas en lote
					if (origQuestion.answers && origQuestion.answers.length > 0) {
						const newAnswers = origQuestion.answers.map((ans) => ({
							questionId: newQuestionId,
							answerText: ans.answerText,
							isCorrect: ans.isCorrect,
							order: ans.order,
							metadata: ans.metadata,
						}));

						await tx.insert(answer).values(newAnswers);
					}
				}

				// Retornamos el ID de la nueva encuesta clonada
				return { success: true, newPollId };
			});

			return result;
		} catch (error) {
			console.error("Error al duplicar la encuesta:", error);
			throw new Error("No se pudo duplicar la encuesta");
		}
	});

export const updatePoll = createServerFn({ method: "POST" })
	.inputValidator(({ slug, values }) => ({
		slug,
		updatedData: editPollInput.parse(values),
	}))
	.handler(async ({ data }) => {
		try {
			if (!data.slug) {
				throw new Error("El slug es necesario para identificar la encuesta");
			}
			const res = await db
				.update(poll)
				.set({
					...data.updatedData,
					updatedAt: new Date(),
				})
				.where(eq(poll.slug, data.slug));

			if (res) {
				return {
					success: true,
					slug: data.slug,
				};
			}
		} catch (error) {
			console.error("Error al actualizar la encuesta:", error);
			throw error;
		}
	});

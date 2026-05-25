import { randomUUID } from "node:crypto";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq, like, or, sql } from "drizzle-orm";
import {
	answer,
	poll,
	pollQuestions,
	question,
	submission,
} from "#/db/schema.ts";
import { generateRandomCode } from "#/lib/utils.ts";
import {
	createPollInput,
	editPollInput,
	forkPollInput,
	pollsSearchFiltershSchema,
	pollsSearchFilterWithUserSchema,
} from "#/shared/validation.ts";
import { db } from "@/db";

export const getPublishedPolls = createServerFn({ method: "GET" })
	.inputValidator(pollsSearchFiltershSchema)
	.handler(async ({ data }) => {
		const { q } = data;
		const res = await db.query.poll.findMany({
			where: (table, { and, or, eq, like }) => {
				const conditions = [];
				conditions.push(eq(table.status, "published"));
				if (q && q.trim() !== "") {
					const searchTerm = `%${q}%`;
					conditions.push(
						or(
							like(table.name, searchTerm),
							like(table.description, searchTerm),
						),
					);
				}
				return conditions.length > 0 ? and(...conditions) : undefined;
			},
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
	});

export const getUserPolls = createServerFn({ method: "GET" })
	.inputValidator(pollsSearchFilterWithUserSchema)
	.handler(async ({ data }) => {
		const { userId, q, status } = data;

		try {
			const conditions = [];
			conditions.push(eq(poll.userId, userId));
			if (status && status !== "all") {
				conditions.push(eq(poll.status, status));
			}

			if (q && q.trim() !== "") {
				const searchTerm = `%${q.trim()}%`;
				conditions.push(
					or(like(poll.name, searchTerm), like(poll.description, searchTerm)),
				);
			}

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
				.where(and(...conditions))
				.orderBy(asc(poll.startDate));

			return res ?? [];
		} catch (error) {
			console.log("Error al obtener encuestas del usuario:", error);
			return [];
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
			const [newPoll] = await db
				.insert(poll)
				.values({
					...data,
					id: newId,
					slug:
						data.slug && data.slug.length === 6
							? data.slug
							: generateRandomCode(),
				})
				.returning();
			if (newPoll) {
				return {
					slug: newPoll.slug,
				};
			}
			throw new Error("Failed to create poll");
		} catch (error) {
			console.log("error", error);
			throw error;
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

export const validatePollAccess = createServerFn({ method: "GET" })
	.inputValidator((data: { userId: string; slug: string }) => data)
	.handler(async ({ data }) => {
		const { slug, userId } = data;
		const now = new Date();

		// 1. Buscar la encuesta por su slug
		const currentPoll = await db.query.poll.findFirst({
			where: eq(poll.slug, slug),
		});

		// ❌ CASO 1: La encuesta no existe
		if (!currentPoll) {
			throw notFound();
		}

		// ❌ CASO 2: Control de Estados (Draft / Archived)
		if (currentPoll.status === "draft" && currentPoll.userId !== userId) {
			return {
				allowed: false,
				reason: "UNAUTHORIZED",
				message: "Esta encuesta aún no ha sido publicada.",
			};
		}

		if (currentPoll.status === "archived") {
			return {
				allowed: false,
				reason: "ARCHIVED",
				message: "Esta encuesta ha sido archivada y ya no acepta respuestas.",
			};
		}

		// ❌ CASO 3: Plazo de tiempo (¿Ya empezó? ¿Ya terminó?)
		// Validar si tiene fecha de inicio y si ya pasó
		if (currentPoll.startDate && now < currentPoll.startDate) {
			return {
				allowed: false,
				reason: "NOT_STARTED",
				message: `Esta encuesta comenzará el ${currentPoll.startDate.toLocaleString("es")}.`,
			};
		}

		// Validar si tiene fecha de fin y si ya expiró
		if (currentPoll.endDate && now > currentPoll.endDate) {
			return {
				allowed: false,
				reason: "EXPIRED",
				message: "El plazo para responder esta encuesta ha finalizado.",
			};
		}

		// ❌ CASO 4: El usuario ya respondió (Duplicados)
		// Gracias a tu índice único en `user_poll_unique_idx`, podemos estar seguros de esto
		const existingSubmission = await db.query.submission.findFirst({
			where: and(
				eq(submission.pollId, currentPoll.id),
				eq(submission.userId, userId),
			),
		});

		if (existingSubmission) {
			return {
				allowed: false,
				reason: "ALREADY_SUBMITTED",
				message:
					"Ya has completado esta encuesta. No se permiten múltiples respuestas.",
				submissionId: existingSubmission.id, // Útil si quieres redirigirlo a sus respuestas
			};
		}

		// ❌ CASO 5: Límite de respuestas globales (Metadata)
		// Revisamos el campo json 'metadata' que definiste en tu esquema
		if (currentPoll.metadata?.limitResponses) {
			// Contamos cuántas respuestas totales tiene la encuesta
			const totalSubmissions = await db
				.select({ count: sql<number>`count(*)` })
				.from(submission)
				.where(eq(submission.pollId, currentPoll.id));

			const count = totalSubmissions[0]?.count ?? 0;

			if (count >= currentPoll.metadata.limitResponses) {
				return {
					allowed: false,
					reason: "CAP_REACHED",
					message:
						"Esta encuesta ha alcanzado el límite máximo de respuestas permitidas.",
				};
			}
		}

		//  SI PASA TODAS LAS VALIDACIONES
		return {
			allowed: true,
			pollId: currentPoll.id,
			pollName: currentPoll.name,
		};
	});

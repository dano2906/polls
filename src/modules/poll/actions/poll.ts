import { randomUUID } from "node:crypto";
import { notFound, redirect } from "@tanstack/react-router";
import { createClientOnlyFn, createServerFn } from "@tanstack/react-start";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import type { UserAnswerValue } from "@/answers/shared/types";
import {
	ensureSession,
	getSession,
	hashPassword,
	verifyPassword,
} from "@/auth/actions/auth";
import { db } from "@/common/db";
import {
	answer,
	poll,
	pollQuestions,
	question,
	submission,
	userAnswer,
} from "@/common/db/schema";
import { exportPoll } from "@/common/lib/export";
import { passwordSchema } from "@/common/lib/validation";
import { ExportFormat } from "@/common/shared/types";
import type { QuestionMetadata } from "@/question/shared/types";
import { generateRandomCode } from "../lib/utils";
import {
	createPollInput,
	editPollInput,
	exportDataSchema,
	forkPollInput,
	pollsSearchFiltershSchema,
	pollsSearchFilterWithUserSchema,
} from "../lib/validation";
import type { ExportData } from "../shared/types";

export const createPollPublicURL = createClientOnlyFn(async (slug: string) => {
	return await navigator.clipboard.writeText(
		`${import.meta.env.VITE_PUBLIC_APP_URL}/p/${slug}`,
	);
});

export const exportPollFn = createClientOnlyFn(
	async ({
		format = ExportFormat.JSON,
		filename = "Encuesta",
		poll,
	}: {
		format: ExportFormat;
		filename: string;
		poll: ExportData;
	}) => {
		switch (format) {
			case "csv":
				exportPoll.csv(poll, filename);
				break;
			case "json":
				exportPoll.json(poll, filename);
				break;
			case "excel":
				exportPoll.excel(poll, filename);
				break;
			default:
				break;
		}
	},
);

export const getPublishedPolls = createServerFn({ method: "GET" })
	.validator(pollsSearchFiltershSchema)
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

export const getListedUserPolls = createServerFn({ method: "GET" })
	.validator(pollsSearchFilterWithUserSchema)
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

export const getCompactUserPolls = createServerFn({ method: "GET" })
	.validator(pollsSearchFilterWithUserSchema)
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

			// 1. Ejecutamos la consulta aplicando tus filtros
			const res = await db
				.select({
					id: poll.id,
					rootId: poll.rootId,
					name: poll.name,
					description: poll.description,
					slug: poll.slug,
					startDate: poll.startDate,
					endDate: poll.endDate,
					status: poll.status,
					version: poll.version,
					createdAt: poll.createdAt,
				})
				.from(poll)
				.where(and(...conditions))
				.orderBy(
					sql`COALESCE(${poll.rootId}, ${poll.id})`,
					desc(poll.createdAt),
				);

			const groupedPolls = res.reduce(
				(acc, currentPoll) => {
					const groupKey = currentPoll.rootId ?? currentPoll.id;

					if (!acc[groupKey]) {
						acc[groupKey] = [];
					}

					acc[groupKey].push(currentPoll);
					return acc;
				},
				{} as Record<string, typeof res>,
			);

			return groupedPolls;
		} catch (error) {
			console.log("Error al obtener encuestas del usuario:", error);
			return {};
		}
	});

export const getPollDetails = createServerFn({ method: "GET" })
	.validator((data: { slug: string }) => data)
	.handler(async ({ data }) => {
		const session = await ensureSession();

		const poll = await db.query.poll.findFirst({
			where: (poll, { eq }) => eq(poll.slug, data.slug),
			columns: {
				id: true,
				description: true,
				endDate: true,
				name: true,
				startDate: true,
				status: true,
				version: true,
				timeLimit: true,
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

		// 4. Buscamos si el usuario ya inició un intento para esta encuesta
		let currentSubmission = await db.query.submission.findFirst({
			where: (submission, { eq, and }) =>
				and(
					eq(submission.pollId, poll.id),
					eq(submission.userId, session.session.userId),
				),
		});

		// 5. Si no existe, creamos la sumisión con la hora exacta del servidor
		if (!currentSubmission) {
			const [newSubmission] = await db
				.insert(submission)
				.values({
					pollId: poll.id,
					userId: session.session.userId,
					startedAt: new Date(),
				})
				.returning();

			currentSubmission = newSubmission;
		}

		// Mapeo de preguntas (Tu lógica exacta intacta)
		const questions = poll.pollQuestions.map((item) => {
			let parsedMetadata = {};

			if (item.question.metadata) {
				try {
					parsedMetadata =
						typeof item.question.metadata === "string"
							? JSON.parse(item.question.metadata)
							: item.question.metadata;
				} catch (e) {
					console.error(
						`Error parseando metadata de la pregunta ${item.question.id}:`,
						e,
					);
				}
			}

			return {
				order: item.order,
				pollId: item.pollId,
				...item.question,
				metadata: parsedMetadata,
			};
		});

		// 6. Retornamos los datos de la encuesta junto con los de la sumisión
		return {
			id: poll.id,
			name: poll.name,
			description: poll.description,
			startDate: poll.startDate,
			endDate: poll.endDate,
			status: poll.status,
			version: poll.version,
			timeLimit: poll.timeLimit,
			pollMetadata: undefined,
			questions,
			submission: {
				id: currentSubmission.id,
				startedAt: currentSubmission.startedAt,
			},
		};
	});

export const createPoll = createServerFn({ method: "POST" })
	.validator(createPollInput)
	.handler(async ({ data }) => {
		try {
			const newId = randomUUID();
			const hasPassword = !!(data.password && data.password.trim().length > 0);
			const hashedPassword = hasPassword
				? await hashPassword({
						data: {
							password: data.password as string,
						},
					})
				: null;
			const [newPoll] = await db
				.insert(poll)
				.values({
					...data,
					id: newId,
					timeLimit: data.timeLimit ?? null,
					password: hashedPassword,
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

export const updatePoll = createServerFn({ method: "POST" })
	.validator(
		({
			slug,
			values,
			scenario = "update",
		}: {
			slug: string;
			values: unknown;
			scenario?: "update" | "status";
		}) => ({
			slug,
			updatedData: editPollInput.parse(values),
			scenario,
		}),
	)
	.handler(async ({ data }) => {
		try {
			if (!data.slug) {
				throw new Error("El slug es necesario para identificar la encuesta");
			}
			const currentPoll = await db
				.select({ id: poll.id })
				.from(poll)
				.where(eq(poll.slug, data.slug))
				.get();

			if (!currentPoll) {
				throw new Error("La encuesta especificada no existe");
			}

			if (
				data.scenario === "status" &&
				data.updatedData.status === "published"
			) {
				const questionCount = await db
					.select({ count: sql<number>`count(*)` })
					.from(pollQuestions)
					.where(eq(pollQuestions.pollId, currentPoll.id))
					.get();

				if (!questionCount || questionCount.count === 0) {
					throw new Error(
						"No puedes publicar una encuesta que no tiene preguntas",
					);
				}
			}
			const res = await db
				.update(poll)
				.set({
					...data.updatedData,
					timeLimit: data.updatedData.timeLimit,
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
			throw error;
		}
	});

export const validatePollAccess = createServerFn({ method: "GET" })
	.validator((data: { userId: string; slug: string }) => data)
	.handler(async ({ data }) => {
		const { slug, userId } = data;
		const now = new Date();
		const { user } = await ensureSession();

		// 1. Buscar la encuesta por su slug (incluyendo la nueva columna timeLimit)
		const currentPoll = await db.query.poll.findFirst({
			where: eq(poll.slug, slug),
		});

		// ❌ CASO 1: La encuesta no existe
		if (!currentPoll) {
			throw notFound();
		}

		// ❌ CASO 2: Control de Estados (Draft / Archived)
		if (currentPoll.status === "draft" && currentPoll.userId !== userId) {
			throw redirect({
				to: "/",
				search: { error: "Esta encuesta aún no ha sido publicada." },
			});
		}

		if (currentPoll.status === "archived") {
			throw redirect({
				to: "/",
				search: {
					error: "Esta encuesta ha sido archivada y ya no acepta respuestas.",
				},
			});
		}

		// ❌ CASO 3: Plazo de tiempo general (¿Ya empezó? ¿Ya terminó?)
		if (currentPoll.startDate && now < currentPoll.startDate) {
			throw redirect({
				to: "/",
				search: {
					error: `Esta encuesta comenzará el ${currentPoll.startDate.toLocaleString("es")}.`,
				},
			});
		}

		if (currentPoll.endDate && now > currentPoll.endDate) {
			throw redirect({
				to: "/",
				search: {
					error: "El plazo para responder esta encuesta ha finalizado.",
				},
			});
		}

		// ❌ CASO 4. Tiene contraseña
		if (currentPoll.password) {
			const accessCookie = getCookie(`poll_unlocked_${slug}`);
			if (!accessCookie)
				throw redirect({
					to: "/p/$slug/password",
					params: { slug },
				});
			const decodedJson = atob(accessCookie);
			const { userId: cookieUserId } = JSON.parse(decodedJson);

			if (cookieUserId !== user.id) {
				deleteCookie(`poll_unlocked_${slug}`);
				throw redirect({
					to: "/p/$slug/password",
					params: { slug },
				});
			}
		}

		// 🔍 CASO 5: Evaluación de la Sumisión Existente
		const existingSubmission = await db.query.submission.findFirst({
			where: and(
				eq(submission.pollId, currentPoll.id),
				eq(submission.userId, userId),
			),
		});

		if (existingSubmission) {
			// Condición A: Si la encuesta ya fue explícitamente terminada/enviada
			if (existingSubmission.completedAt) {
				throw redirect({
					to: "/p/$slug/result",
					params: { slug },
				});
			}

			// Condición B: Si no está completada pero la encuesta TIENE límite de tiempo
			if (currentPoll.timeLimit) {
				const startedAtTime = new Date(existingSubmission.startedAt).getTime();
				const nowTime = now.getTime();

				// Calculamos cuántos segundos han pasado desde que inició
				const secondsElapsed = (nowTime - startedAtTime) / 1000;

				// Si el tiempo transcurrido supera el límite (+ 5 segundos de cortesía por latencia de red)
				if (secondsElapsed > currentPoll.timeLimit + 5) {
					await db
						.update(submission)
						.set({ completedAt: now })
						.where(eq(submission.id, existingSubmission.id));
					throw redirect({
						to: "/p/$slug/result",
						params: { slug },
					});
				}
			}

			// Si llegó aquí significa que:
			// - O la encuesta tiene tiempo límite y todavía le quedan minutos/segundos.
			// - O la encuesta NO tiene tiempo límite y simplemente está refrescando la página.
			// En ambos casos, ¡lo dejamos continuar!
		}

		// ❌ CASO 5: Límite de respuestas globales (Metadata)
		if (currentPoll.metadata?.limitResponses) {
			const totalSubmissions = await db
				.select({ count: sql<number>`count(*)` })
				.from(submission)
				.where(eq(submission.pollId, currentPoll.id));

			const count = totalSubmissions[0]?.count ?? 0;

			if (count >= currentPoll.metadata.limitResponses) {
				throw redirect({
					to: "/",
					search: {
						error:
							"Esta encuesta ha alcanzado el límite máximo de respuestas permitidas.",
					},
				});
			}
		}

		// Si pasa todas las validaciones (o es un intento activo válido), permitimos el acceso
		return {
			allowed: true,
			pollId: currentPoll.id,
			pollName: currentPoll.name,
		};
	});

export const deletePollBySlug = createServerFn({ method: "POST" })
	.validator((data: { slug: string }) => data)
	.handler(async ({ data }) => {
		const session = await getSession();

		if (!session) {
			throw new Error("UNAUTHORIZED");
		}

		try {
			const deletedPoll = await db
				.delete(poll)
				.where(and(eq(poll.slug, data.slug), eq(poll.userId, session.user.id)))
				.returning({ id: poll.id, name: poll.name });

			if (deletedPoll.length === 0) {
				throw notFound();
			}

			return {
				success: true,
				message: `Encuesta "${deletedPoll[0].name}" eliminada correctamente.`,
			};
		} catch (error) {
			console.error("Error al eliminar la encuesta:", error);
			throw new Error("No se pudo eliminar la encuesta.");
		}
	});

export const importPollAction = createServerFn()
	.validator(exportDataSchema)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user?.id) {
			throw redirect({ to: "/" });
		}

		return await db.transaction(async (tx) => {
			// 1. Insertar la encuesta principal
			const [newPoll] = await tx
				.insert(poll)
				.values({
					userId: session.user.id,
					name: data.name,
					description: data.description,
					slug: generateRandomCode(),
					status: "draft",
					startDate: data.startDate,
					endDate: data.endDate,
					version: 1,
				})
				.returning();

			if (!data.questions || data.questions.length === 0) {
				return { success: true, slug: newPoll.slug };
			}

			// 2. Mapear preguntas transformando la metadata y limpiando los tipos null de Zod
			const questionsToInsert: (typeof question.$inferInsert)[] =
				data.questions.map((q) => {
					let dbMetadata: QuestionMetadata;

					switch (q.type) {
						case "rating":
							dbMetadata = {
								type: "rating",
								minValue: q.metadata.minRating ?? 1,
								maxValue: q.metadata.maxRating ?? 5,
							};
							break;
						case "single_choice":
						case "multiple_choice":
							dbMetadata = {
								type: q.type,
								hasCorrectAnswers: q.hasCorrectAnswers ?? false,
								maxSelections: q.maxSelections ?? 1,
							};
							break;
						case "date_single":
						case "date_range":
							dbMetadata = {
								type: q.type,
								minDate: null,
								maxDate: null,
							};
							break;

						default:
							dbMetadata = { type: q.type as "geolocation" | "open_answer" };
							break;
					}

					return {
						type: q.type,
						questionText: q.questionText,
						// Usamos '??' para convertir el 'boolean | null' de Zod en un 'boolean' puro que Drizzle acepte
						hasCorrectAnswers: q.hasCorrectAnswers ?? false,
						maxSelections: q.maxSelections ?? 1,
						isRequired: q.isRequired ?? false, // <-- SOLUCIÓN ERROR 3: Elimina el null para Drizzle
						metadata: dbMetadata,
					};
				});

			const insertedQuestions = await tx
				.insert(question)
				.values(questionsToInsert)
				.returning({ id: question.id });

			// 3. Preparar estructuras masivas para relaciones y opciones de respuesta
			const pollQuestionsToInsert: (typeof pollQuestions.$inferInsert)[] = [];
			const answersToInsert: (typeof answer.$inferInsert)[] = [];

			data.questions.forEach((q, index) => {
				const newQuestionId = insertedQuestions[index].id;

				pollQuestionsToInsert.push({
					pollId: newPoll.id,
					questionId: newQuestionId,
					order: q.order ?? 0,
				});

				if (q.answers && q.answers.length > 0) {
					q.answers.forEach((ans, idx) => {
						// SOLUCIÓN ERRORES 1 y 2: Ajustado al formato estricto que acepta la tabla 'answer'
						answersToInsert.push({
							questionId: newQuestionId,
							answerText: ans.answerText || "",
							isCorrect: ans.isCorrect ?? false,
							order: idx, // Asignamos directamente el índice del bucle como orden cronológico
							// Eliminamos ans.metadata ya que las respuestas de encuestas no llevan metadata extendida
						});
					});
				}
			});

			// 4. Ejecución final en lote
			await tx.insert(pollQuestions).values(pollQuestionsToInsert);

			if (answersToInsert.length > 0) {
				await tx.insert(answer).values(answersToInsert);
			}

			return { success: true, slug: newPoll.slug };
		});
	});

export const forkPoll = createServerFn({ method: "POST" })
	.validator(forkPollInput)
	.handler(async ({ data }) => {
		const { pollSlug } = data;

		try {
			const result = await db.transaction(async (tx) => {
				// 1. Obtener la encuesta desde la que se está haciendo el fork
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
					throw notFound({ throw: true });
				}

				// 2. Identificar el ID raíz de la familia
				const targetRootId = originalPoll.rootId ?? originalPoll.id;

				// 3. NUEVA LÓGICA: Buscar la versión más alta en TODA la familia (raíz + hijas)
				const [highestVersionPoll] = await tx
					.select({ version: poll.version })
					.from(poll)
					.where(
						or(
							eq(poll.rootId, targetRootId), // Hijas que apuntan a la raíz
							eq(poll.id, targetRootId), // La encuesta raíz misma
						),
					)
					.orderBy(desc(poll.version)) // Ordenamos de mayor a menor
					.limit(1); // Nos quedamos solo con la más alta

				// Calculamos la siguiente versión basándonos en el máximo real del árbol
				const maxFamilyVersion = highestVersionPoll?.version
					? Number(highestVersionPoll.version)
					: 1;
				const nextVersion = maxFamilyVersion + 1;

				const nextSlug = generateRandomCode();

				// 4. Insertar la nueva encuesta clonada con la versión consecutiva global
				const [insertedPoll] = await tx
					.insert(poll)
					.values({
						userId: originalPoll.userId,
						name: originalPoll.name,
						description: originalPoll.description,
						slug: nextSlug,
						status: "draft",
						version: nextVersion, // <-- Ahora sí, v3, v4, etc. consecutivas
						metadata: originalPoll.metadata,
						startDate: new Date(originalPoll.startDate),
						endDate: originalPoll.endDate
							? new Date(originalPoll.endDate)
							: null,
						rootId: targetRootId, // Mantenemos el mismo ID raíz para toda la familia
					})
					.returning({ id: poll.id });

				const newPollId = insertedPoll.id;

				if (
					!originalPoll.pollQuestions ||
					originalPoll.pollQuestions.length === 0
				) {
					return { success: true, newPollId };
				}

				// 5. PREPARACIÓN EN LOTE: Preguntas
				const questionsToInsert = originalPoll.pollQuestions.map((pq) => ({
					type: pq.question.type,
					questionText: pq.question.questionText,
					hasCorrectAnswers: pq.question.hasCorrectAnswers,
					maxSelections: pq.question.maxSelections,
					isRequired: pq.question.isRequired,
					metadata: pq.question.metadata,
					imagePublicId: pq.question.imagePublicId,
				}));

				const insertedQuestions = await tx
					.insert(question)
					.values(questionsToInsert)
					.returning({ id: question.id });

				// 6. CONSTRUCCIÓN DE RELACIONES Y RESPUESTAS
				const pollQuestionsToInsert: any[] = [];
				const answersToInsert: any[] = [];

				originalPoll.pollQuestions.forEach((pq, index) => {
					const newQuestionId = insertedQuestions[index].id;

					pollQuestionsToInsert.push({
						pollId: newPollId,
						questionId: newQuestionId,
						order: pq.order,
					});

					if (pq.question.answers && pq.question.answers.length > 0) {
						pq.question.answers.forEach((ans) => {
							answersToInsert.push({
								questionId: newQuestionId,
								answerText: ans.answerText,
								isCorrect: ans.isCorrect,
								order: ans.order,
								metadata: ans.metadata,
							});
						});
					}
				});

				await tx.insert(pollQuestions).values(pollQuestionsToInsert);

				if (answersToInsert.length > 0) {
					await tx.insert(answer).values(answersToInsert);
				}

				return { success: true, newPollId };
			});

			return result;
		} catch (error) {
			console.error("Error al duplicar la encuesta:", error);
			throw new Error("No se pudo duplicar la encuesta");
		}
	});

export const getUserPollResults = createServerFn({ method: "GET" })
	.validator((data: { userId: string; slug: string }) => data)
	.handler(async ({ data }) => {
		const { slug, userId } = data;

		// 1. CONSULTA ESTRUCTURA
		const pollStructure = await db.query.poll.findFirst({
			where: (table, { eq }) => eq(table.slug, slug),
			columns: {
				id: true,
				name: true,
				description: true,
			},
			with: {
				pollQuestions: {
					orderBy: (pq, { asc }) => [asc(pq.order)],
					columns: { order: true },
					with: {
						question: {
							with: {
								answers: {
									orderBy: (ans, { asc }) => [asc(ans.order)],
									columns: {
										id: true,
										answerText: true,
										isCorrect: true,
										order: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!pollStructure) {
			throw notFound();
		}

		// 2. CONSULTA RESPUESTAS
		const userAnswersRows = await db
			.select({
				questionId: userAnswer.questionId,
				value: userAnswer.value,
				submittedAt: submission.submittedAt,
			})
			.from(userAnswer)
			.innerJoin(submission, eq(userAnswer.submissionId, submission.id))
			.where(
				and(
					eq(submission.pollId, pollStructure.id),
					eq(submission.userId, userId),
				),
			);

		const submittedAt = userAnswersRows[0]?.submittedAt ?? null;

		const userAnswersMap = new Map<string, any>();
		for (const row of userAnswersRows) {
			if (row.questionId) {
				userAnswersMap.set(row.questionId, row.value);
			}
		}

		// 3. FUSIÓN EN MEMORIA
		const results = pollStructure.pollQuestions.map((pq) => {
			const q = pq.question;
			// Forzamos el tipado para aprovechar el discriminated union
			const uv = userAnswersMap.get(q.id) as UserAnswerValue | undefined;

			let textResponse: string | null = null;
			const selectedAnswers: any[] = []; // Usamos any o un tipo extendido para inyectar score/dates

			// Si el usuario respondió, leemos estrictamente según el `type` guardado
			if (uv) {
				switch (uv.type) {
					case "open_answer":
						textResponse = uv.textResponse;
						break;

					case "rating":
						// Lo metemos en el array para que el frontend lo lea en selectedAnswers[0].score
						selectedAnswers.push({ score: uv.score });
						break;

					case "ranking":
						uv.orderedAnswerIds.forEach((id, index) => {
							const ans = q.answers.find((a) => a.id === id);
							if (ans) {
								selectedAnswers.push({
									id: ans.id, // ID compatible con el frontend
									answerText: ans.answerText,
									isCorrect: ans.isCorrect,
									orderIndex: index, // Clave para que el frontend mantenga el orden
								});
							}
						});
						break;

					case "single_choice": {
						const ans = q.answers.find((a) => a.id === uv.selectedAnswerId);
						if (ans) {
							selectedAnswers.push({
								id: ans.id,
								answerText: ans.answerText,
								isCorrect: ans.isCorrect,
							});
						}
						break;
					}

					case "multiple_choice":
						uv.selectedAnswerIds.forEach((id) => {
							const ans = q.answers.find((a) => a.id === id);
							if (ans) {
								selectedAnswers.push({
									id: ans.id,
									answerText: ans.answerText,
									isCorrect: ans.isCorrect,
								});
							}
						});
						break;
					case "point_distribution":
						if (uv.points) {
							Object.entries(uv.points).forEach(([answerId, points]) => {
								const ans = q.answers.find((a) => a.id === answerId);
								if (ans) {
									selectedAnswers.push({
										id: ans.id,
										answerText: ans.answerText,
										points,
									});
								}
							});
						}
						break;
					case "geolocation": {
						selectedAnswers.push({
							lat: uv.lat,
							lng: uv.lng,
							address: uv.address,
						});
						break;
					}

					case "date_single":
						selectedAnswers.push({ dateValue: uv.date });
						break;

					case "date_range":
						selectedAnswers.push({
							startDate: uv.startDate,
							endDate: uv.endDate,
						});
						break;
				}
			}

			return {
				questionText: q.questionText,
				type: q.type,
				metadata: q.metadata,
				order: pq.order ?? 0,
				textResponse,
				selectedAnswers,
			};
		});

		return {
			poll: {
				name: pollStructure.name,
				description: pollStructure.description,
				submittedAt,
			},
			results,
		};
	});

export const validatePollPassword = createServerFn({ method: "POST" })
	.validator((data: { password: string; slug: string }) => ({
		slug: data.slug,
		password: passwordSchema.parse(data.password),
	}))
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session) {
			throw new Error("UNAUTHORIZED");
		}
		const { slug, password } = data;
		let isValid = false;

		try {
			// 1. Buscamos el hash de la encuesta usando el slug
			const [foundPoll] = await db
				.select({
					password: poll.password,
				})
				.from(poll)
				.where(eq(poll.slug, slug))
				.limit(1);

			// Si la encuesta no existe o no está protegida, no hay nada que validar
			if (!foundPoll || !foundPoll.password) {
				throw notFound();
			}

			// 2. Validamos la contraseña criptográficamente
			isValid = await verifyPassword({
				data: {
					passwordAttempt: password,
					storedValue: foundPoll.password,
				},
			});

			if (isValid) {
				const sessionValue = btoa(
					JSON.stringify({
						slug,
						userId: session.user.id,
						unlockedAt: Date.now(),
					}),
				);

				setCookie(`poll_unlocked_${slug}`, sessionValue, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					maxAge: 3600,
				});

				return { success: true };
			}
		} catch (error) {
			console.error("Error al validar la contraseña en el servidor:", error);
			return { success: false, message: "Error interno del servidor." };
		}

		// 3. Respuesta según el resultado
		if (!isValid) {
			return { success: false, message: "Contraseña incorrecta." };
		}

		return { success: true };
	});

import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { getSession } from "@/auth/actions/auth";
import { db } from "@/common/db";
import { poll, question, submission, userAnswer } from "@/common/db/schema";
import { completePollInput } from "../lib/validation";
import type { UserAnswerValue } from "../shared/types";

export const submitPollAnswers = createServerFn()
	.validator(completePollInput)
	.handler(async ({ data }) => {
		const { pollId, answers } = data;
		const session = await getSession();
		const now = new Date();

		if (!session) {
			throw redirect({ to: "/" });
		}

		// 1. Verificaciones de seguridad e integridad de la encuesta
		const existingPoll = await db.query.poll.findFirst({
			where: eq(poll.id, pollId),
		});

		if (!existingPoll) {
			throw new Error("Encuesta no encontrada");
		}

		if (existingPoll.status !== "published") {
			throw new Error(
				"La encuesta no está aceptando respuestas en este momento",
			);
		}

		// 🔍 [CORRECCIÓN] Recuperamos la sumisión ANTES de la transacción
		const currentSubmission = await db.query.submission.findFirst({
			where: and(
				eq(submission.pollId, pollId),
				eq(submission.userId, session.user.id),
			),
		});

		if (!currentSubmission) {
			throw new Error(
				"No se encontró un registro de inicio para esta encuesta.",
			);
		}

		// 🚀 [CORRECCIÓN] El redirect ahora vive de forma segura fuera de la transacción
		if (currentSubmission.completedAt) {
			throw redirect({
				to: "/p/$slug/result",
				params: { slug: existingPoll.slug as string },
			});
		}

		// ⏱️ VALIDACIÓN DE TIEMPO (También la podemos evaluar fuera)
		if (existingPoll.timeLimit) {
			const startedAtTime = new Date(currentSubmission.startedAt).getTime();
			const secondsElapsed = (now.getTime() - startedAtTime) / 1000;

			// Margen de 10 segundos de tolerancia por latencia
			if (secondsElapsed > existingPoll.timeLimit + 10) {
				// Aquí manejas si guardas parcial o lanzas error
			}
		}

		// 2. Mapeamos los tipos de preguntas para procesar el JSON
		const targetQuestionIds = Object.keys(answers);
		let questionTypesMap = new Map<string, string>();

		if (targetQuestionIds.length > 0) {
			const pollQuestionsData = await db
				.select({ id: question.id, type: question.type })
				.from(question)
				.where(inArray(question.id, targetQuestionIds));

			questionTypesMap = new Map(pollQuestionsData.map((q) => [q.id, q.type]));
		}

		// 3. Ejecutamos la transacción ÚNICAMENTE para la escritura pesada
		return await db.transaction(async (tx) => {
			// Actualizamos la cabecera marcando la fecha de finalización
			await tx
				.update(submission)
				.set({ completedAt: now })
				.where(eq(submission.id, currentSubmission.id));

			// Transformamos las respuestas crudas filtrando las válidas
			const answersToInsert = Object.entries(answers)
				.map(([questionId, rawValue]) => {
					const qType = questionTypesMap.get(questionId);
					if (!qType) return null;

					// Validación de campos vacíos
					if (
						rawValue === undefined ||
						rawValue === null ||
						rawValue === "" ||
						(Array.isArray(rawValue) && rawValue.length === 0)
					) {
						return null;
					}

					let computedValue: UserAnswerValue;

					switch (qType) {
						case "open_answer":
							computedValue = {
								type: "open_answer",
								textResponse: String(rawValue),
							};
							break;
						case "rating":
							computedValue = { type: "rating", score: Number(rawValue) };
							break;
						case "ranking":
							computedValue = {
								type: "ranking",
								orderedAnswerIds: rawValue as string[],
							};
							break;
						case "single_choice":
							computedValue = {
								type: "single_choice",
								selectedAnswerId: String(rawValue),
							};
							break;
						case "multiple_choice":
							computedValue = {
								type: "multiple_choice",
								selectedAnswerIds: rawValue as string[],
							};
							break;
						case "date_single":
							computedValue = { type: "date_single", date: String(rawValue) };
							break;
						case "date_range":
							if (typeof rawValue === "string" && rawValue.includes("/")) {
								const [start, end] = rawValue.split("/");
								computedValue = {
									type: "date_range",
									startDate: start?.trim() ?? "",
									endDate: end?.trim() ?? "",
								};
							} else if (
								typeof rawValue === "object" &&
								rawValue !== null &&
								"startDate" in rawValue
							) {
								computedValue = {
									type: "date_range",
									startDate: rawValue.startDate as string,
									endDate: rawValue.endDate as string,
								};
							} else {
								return null;
							}
							break;
						case "point_distribution":
							if (
								typeof rawValue === "object" &&
								rawValue !== null &&
								!Array.isArray(rawValue)
							) {
								computedValue = {
									type: "point_distribution",
									points: rawValue as Record<string, number>,
								};
							} else {
								return null;
							}
							break;
						case "geolocation":
							if (
								typeof rawValue === "object" &&
								rawValue !== null &&
								"lat" in rawValue &&
								"lng" in rawValue
							) {
								computedValue = {
									type: "geolocation",
									lat: Number(rawValue.lat),
									lng: Number(rawValue.lng),
								};
							} else {
								return null;
							}
							break;
						default:
							return null;
					}

					return {
						submissionId: currentSubmission.id,
						questionId: questionId,
						value: computedValue,
					};
				})
				.filter((item): item is NonNullable<typeof item> => item !== null);

			// Inserción masiva si aplica
			if (answersToInsert.length > 0) {
				await tx.insert(userAnswer).values(answersToInsert);
			}

			return { success: true, submissionId: currentSubmission.id };
		});
	});

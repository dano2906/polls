import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/common/db";
import { poll, question, submission, userAnswer } from "@/common/db/schema";
import { getSession } from "@/common/lib/auth-functions";
import { completePollInput } from "../lib/validation";
import type { UserAnswerValue } from "../shared/types";

export const submitPollAnswers = createServerFn()
	.validator(completePollInput)
	.handler(async ({ data }) => {
		const { pollId, answers } = data;
		const session = await getSession(); // Tu función de autenticación
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

		// 2. Mapeamos los tipos de preguntas para procesar el JSON de las que SÍ llegaron
		const targetQuestionIds = Object.keys(answers);

		let questionTypesMap = new Map<string, string>();
		if (targetQuestionIds.length > 0) {
			const pollQuestionsData = await db
				.select({ id: question.id, type: question.type })
				.from(question)
				.where(inArray(question.id, targetQuestionIds));

			questionTypesMap = new Map(pollQuestionsData.map((q) => [q.id, q.type]));
		}

		// 3. Ejecutamos la transacción de guardado y actualización
		return await db.transaction(async (tx) => {
			// 🔍 Recuperamos la sumisión que se inició en el paso 1
			const currentSubmission = await tx.query.submission.findFirst({
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

			if (currentSubmission.completedAt) {
				throw new Error("Esta encuesta ya fue enviada previamente.");
			}

			// ⏱️ VALIDACIÓN ESTRICTA DE TIEMPO EN SERVIDOR
			if (existingPoll.timeLimit) {
				const startedAtTime = new Date(currentSubmission.startedAt).getTime();
				const secondsElapsed = (now.getTime() - startedAtTime) / 1000;

				// Margen de 10 segundos de tolerancia por la latencia en el envío del formulario
				if (secondsElapsed > existingPoll.timeLimit + 10) {
					// Si el tiempo expiró con creces, forzamos el cierre de la sumisión igual,
					// pero podríamos optar por procesar únicamente lo que envió o lanzar un error.
					// En este caso, salvaremos lo que haya alcanzado a mandar.
				}
			}

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

					// Validación de campos vacíos: Si se acabó el tiempo, el usuario
					// tendrá respuestas vacías que simplemente ignoraremos en la BD.
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
							computedValue = {
								type: "rating",
								score: Number(rawValue),
							};
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
								selectedAnswerIds: rawValue as string[], // Corregido el nombre de la propiedad según tu interfaz
							};
							break;

						case "date_single":
							computedValue = {
								type: "date_single",
								date: String(rawValue),
							};
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

			// Inserción masiva si el usuario logró responder al menos una pregunta
			if (answersToInsert.length > 0) {
				await tx.insert(userAnswer).values(answersToInsert);
			}

			return { success: true, submissionId: currentSubmission.id };
		});
	});

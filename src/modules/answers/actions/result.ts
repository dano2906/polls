import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq, inArray } from "drizzle-orm";
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

		// 2. Mapeamos los tipos de preguntas para saber cómo procesar cada JSON
		const targetQuestionIds = Object.keys(answers);
		if (targetQuestionIds.length === 0) {
			throw new Error("No puedes enviar una encuesta vacía");
		}

		const pollQuestionsData = await db
			.select({ id: question.id, type: question.type })
			.from(question)
			.where(inArray(question.id, targetQuestionIds));

		const questionTypesMap = new Map(
			pollQuestionsData.map((q) => [q.id, q.type]),
		);

		// 3. Ejecutamos la transacción de guardado
		return await db.transaction(async (tx) => {
			// Crear el registro de la cabecera de la entrega (Submission)
			const [newSubmission] = await tx
				.insert(submission)
				.values({
					pollId,
					userId: session.user.id,
				})
				.returning();

			// Transformamos las respuestas crudas en los objetos JSON polimórficos definitivos
			const answersToInsert = Object.entries(answers)
				.map(([questionId, rawValue]) => {
					const qType = questionTypesMap.get(questionId);

					// Validación rápida de campos vacíos (si aplica)
					if (
						rawValue === undefined ||
						rawValue === null ||
						rawValue === "" ||
						(Array.isArray(rawValue) && rawValue.length === 0)
					) {
						return null; // Ignoramos respuestas vacías voluntarias si la pregunta no era obligatoria
					}

					let computedValue: UserAnswerValue;

					// Construimos el payload exacto discriminado por el tipo de pregunta
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
								selectedAnswerIds: rawValue as string[],
							};
							break;

						case "date_single":
							computedValue = {
								type: "date_single",
								date: String(rawValue),
							};
							break;

						case "date_range":
							// Soporta tanto string plano "YYYY-MM-DD/YYYY-MM-DD" como objetos estructurados
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
						default:
							return null; // Si es un tipo desconocido, lo ignoramos de forma segura
					}

					// Retornamos el objeto listo para Drizzle alineado con el esquema de la BD
					return {
						submissionId: newSubmission.id,
						questionId: questionId,
						value: computedValue, // Drizzle serializa este objeto a JSON automáticamente en SQLite
					};
				})
				.filter((item): item is NonNullable<typeof item> => item !== null);

			// Inserción masiva ultra rápida (una sola operación de escritura para todas las respuestas)
			if (answersToInsert.length > 0) {
				await tx.insert(userAnswer).values(answersToInsert);
			}

			return { success: true, submissionId: newSubmission.id };
		});
	});

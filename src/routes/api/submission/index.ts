import { createFileRoute } from "@tanstack/react-router";
import { db } from "#/db/index.ts";
import type { NewSubmission } from "#/shared/types";
import type { UserAnswer } from "#/shared/types.js";
import { submission, userAnswer } from "@/db/schema";

export const Route = createFileRoute("/api/submission/")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const { pollId, userId, answers } =
						(await request.json()) as NewSubmission & { answers: UserAnswer[] };

					// answers: Array<{ questionId: string, optionId?: string, textResponse?: string }>

					const result = await db.transaction(async (tx) => {
						// 1. Crear la cabecera del envío
						const [result] = await tx
							.insert(submission)
							.values({
								userId,
								pollId,
							})
							.returning();

						// 2. Mapear las respuestas del usuario con el ID del envío
						const answersToInsert = answers.map((ans) => ({
							...ans,
							submissionId: result.id,
						}));

						// 3. Insertar todas las respuestas
						await tx.insert(userAnswer).values(answersToInsert);

						return submission;
					});

					return Response.json(
						{ message: "Encuesta enviada con éxito", id: result.id },
						{ status: 201 },
					);
				} catch {
					return Response.json(
						{ error: "Error al procesar el envío" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

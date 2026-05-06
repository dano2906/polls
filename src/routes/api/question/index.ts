import { createFileRoute } from "@tanstack/react-router";
import { db } from "#/db/index.ts";
import { pollQuestions, question } from "#/db/schema.ts";

export const Route = createFileRoute("/api/question/")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const { pollId, order, ...questionData } = await request.json();

					// Usamos una transacción para asegurar que la pregunta se cree y se vincule
					const result = await db.transaction(async (tx) => {
						const [newQuestion] = await tx
							.insert(question)
							.values(questionData)
							.returning();

						if (pollId) {
							await tx.insert(pollQuestions).values({
								pollId,
								questionId: newQuestion.id,
								order: order ?? 0,
							});
						}
						return newQuestion;
					});

					return Response.json(result, { status: 201 });
				} catch {
					return Response.json(
						{ error: "Error al crear pregunta" },
						{ status: 400 },
					);
				}
			},
		},
	},
});

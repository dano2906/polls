import { createFileRoute } from "@tanstack/react-router";
import { createPollInput } from "#/shared/validation";
import { db } from "@/db/index";
import { poll } from "@/db/schema";

export const Route = createFileRoute("/api/poll/")({
	server: {
		handlers: {
			GET: async () => {
				try {
					const allPolls = await db.query.poll.findMany({
						with: { pollQuestions: { with: { question: true } } },
					});
					return Response.json(allPolls);
				} catch {
					return Response.json(
						{ error: "Error al obtener encuestas" },
						{ status: 500 },
					);
				}
			},
			POST: async ({ request }) => {
				try {
					const body = await request.json();
					const validatedData = createPollInput.parse(body);

					const newPoll = await db
						.insert(poll)
						.values(validatedData)
						.returning();
					return Response.json(newPoll[0], { status: 201 });
				} catch (error) {
					return Response.json(
						{ error: "Datos inválidos", details: error },
						{ status: 400 },
					);
				}
			},
		},
	},
});

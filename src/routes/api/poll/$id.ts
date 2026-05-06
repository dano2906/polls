import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "#/db/index.ts";
import { poll } from "#/db/schema.ts";

export const Route = createFileRoute("/api/poll/$id")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const result = await db.query.poll.findFirst({
					where: eq(poll.id, params.id),
					with: {
						pollQuestions: { with: { question: { with: { answers: true } } } },
					},
				});

				if (!result)
					return Response.json({ error: "Not Found" }, { status: 404 });
				return Response.json(result);
			},
			PATCH: async ({ params, request }) => {
				try {
					const body = await request.json();
					// Podrías usar un partial de tu esquema Zod: insertPollSchema.partial().parse(body)
					const updated = await db
						.update(poll)
						.set(body)
						.where(eq(poll.id, params.id))
						.returning();

					return Response.json(updated[0]);
				} catch {
					return Response.json(
						{ error: "Error al actualizar" },
						{ status: 400 },
					);
				}
			},
			DELETE: async ({ params }) => {
				await db.delete(poll).where(eq(poll.id, params.id));
				return Response.json({ message: "Encuesta eliminada" });
			},
		},
	},
});

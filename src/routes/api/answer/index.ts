import { createFileRoute } from "@tanstack/react-router";
import { db } from "#/db/index.ts";
import { answer } from "#/db/schema.ts";

export const Route = createFileRoute("/api/answer/")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = await request.json();
					const data = Array.isArray(body) ? body : [body];

					const newOptions = await db.insert(answer).values(data).returning();
					return Response.json(newOptions, { status: 201 });
				} catch {
					return Response.json(
						{ error: "Error al crear opciones" },
						{ status: 400 },
					);
				}
			},
		},
	},
});

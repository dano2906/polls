import { createFileRoute } from "@tanstack/react-router";
import { getOpenApiDocumentation } from "#/lib/openapi.ts";

export const Route = createFileRoute("/api/openapi")({
	server: {
		handlers: {
			GET: () => {
				return Response.json(getOpenApiDocumentation());
			},
		},
	},
});

import {
	extendZodWithOpenApi,
	OpenAPIRegistry,
	OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
	createAnswerInput,
	createPollInput,
	createQuestionInput,
	createSubmissionInput,
	selectAnswerOutput,
	selectPollOutput,
	selectQuestionOutput,
} from "#/shared/validation.ts";

extendZodWithOpenApi(z);
export const registry = new OpenAPIRegistry();

const ListPoll = registry.register("Poll", selectPollOutput);
const NewPoll = registry.register("Poll", createPollInput);
const ListQuestion = registry.register("Question", selectQuestionOutput);
const ListAnswer = registry.register("Answer", selectAnswerOutput);

// Definición de la ruta
registry.registerPath({
	method: "get",
	path: "/api/poll",
	summary: "Obtener todas las encuestas",
	responses: {
		200: {
			description: "Lista de encuestas con sus preguntas",
			content: { "application/json": { schema: z.array(ListPoll) } },
		},
	},
});
registry.registerPath({
	method: "get",
	path: "/api/poll/{id}",
	summary: "Obtener una encuesta",
	parameters: [
		{
			in: "path",
			name: "id",
			required: true,
			schema: {
				example: "123e4567-e89b-12d3-a456-426614174000",
			},
		},
	],
	responses: {
		200: {
			description: "Obtener una encuesta con sus preguntas",
			content: { "application/json": { schema: ListPoll } },
		},
	},
});
registry.registerPath({
	method: "patch",
	path: "/api/poll/{id}",
	summary: "Editar una encuesta",
	parameters: [
		{
			in: "path",
			name: "id",
			required: true,
			schema: {
				example: "123e4567-e89b-12d3-a456-426614174000",
			},
		},
	],
	responses: {
		200: {
			description: "Editar una encuesta",
			content: { "application/json": { schema: ListPoll } },
		},
	},
});
registry.registerPath({
	method: "delete",
	path: "/api/poll/{id}",
	summary: "Eliminar una encuesta",
	parameters: [
		{
			in: "path",
			name: "id",
			required: true,
			schema: {
				example: "123e4567-e89b-12d3-a456-426614174000",
			},
		},
	],
	responses: {
		200: {
			description: "Eliminar una encuesta",
			content: {
				"application/json": {
					schema: z.object({
						message: z.literal("Encuesta eliminada"),
					}),
				},
			},
		},
	},
});
registry.registerPath({
	method: "post",
	path: "/api/poll",
	summary: "Crear encuesta",
	responses: {
		201: {
			description: "Crear encuesta",
			content: { "application/json": { schema: z.array(NewPoll) } },
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/question",
	summary: "Crear pregunta",
	requestBody: {
		content: {
			"application/json": {},
		},
		required: true,
	},
	responses: {
		201: {
			description: "Pregunta creada con éxito",
			content: {
				"application/json": {
					schema: ListQuestion,
				},
			},
		},
		400: {
			description: "Error de validación",
		},
	},
});
registry.registerPath({
	method: "post",
	path: "/api/answer",
	summary: "Crear respuesta",
	responses: {
		201: {
			description: "Respuesta creada con éxito",
			content: {
				"application/json": {
					schema: ListAnswer,
				},
			},
		},
		400: {
			description: "Error de validación",
		},
	},
});

export function getOpenApiDocumentation() {
	const generator = new OpenApiGeneratorV3(registry.definitions);
	return generator.generateDocument({
		openapi: "3.0.0",
		info: { title: "Polls API", version: "1.0.0" },
	});
}

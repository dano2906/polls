import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { answer, poll, question, submission } from "#/db/schema";

extendZodWithOpenApi(z);
export const createPollInput = createInsertSchema(poll).openapi({
	title: "Crear encuestas",
});
export const selectPollOutput = createSelectSchema(poll).openapi({
	title: "Listar encuestas",
});
export const createQuestionInput = createInsertSchema(question).openapi({
	title: "Crear preguntas",
});
export const selectQuestionOutput = createSelectSchema(question).openapi({
	title: "Listar preguntas",
});
export const createAnswerInput = createInsertSchema(answer).openapi({
	title: "Crear respuesta",
});
export const selectAnswerOutput = createSelectSchema(answer).openapi({
	title: "Listar respuesta",
});
export const createSubmissionInput = createInsertSchema(submission).openapi({
	title: "Crear completamiento de encuesta",
});
export const selectSubmissionOutput = createSelectSchema(submission).openapi({
	title: "Listar completamientos de encuesta",
});

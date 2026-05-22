import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db";
import { submission, userAnswer } from "#/db/schema";
import { getSession } from "#/lib/auth-functions";
import { completePollInput } from "#/shared/validation";

export const submitPollAnswers = createServerFn()
	.inputValidator(completePollInput)
	.handler(async ({ data }) => {
		const { pollId, answers } = data;
		const session = await getSession();

		if (!session) {
			throw redirect({
				to: "/",
			});
		}

		// Usamos una transacción para asegurarnos de que se guarde todo o nada
		return await db.transaction(async (tx) => {
			// 1. Crear el registro de la entrega (Submission)
			const [newSubmission] = await tx
				.insert(submission)
				.values({
					pollId,
					userId: session.user.id,
				})
				.returning();

			const answersToInsert = Object.entries(answers).flatMap(
				([questionId, value]) => {
					/*if (!value || (Array.isArray(value) && value.length === 0)) {
						return [
							{
								submissionId: newSubmission.id,
								questionId: questionId,
								answerId: null,
								textResponse:
									typeof value === "string" ? value : null,
								// Nota: Si usas el mismo objeto para inputs de texto libre, guardamos el string aquí.
							},
						];
					}*/

					// Caso 2: Es un arreglo de IDs (Múltiple elección)
					if (Array.isArray(value)) {
						return value.map((aId) => ({
							submissionId: newSubmission.id,
							questionId: questionId,
							answerId: aId,
							textResponse: null,
						}));
					}

					// Caso 3: Es un único ID en formato string (Selección única)
					return [
						{
							submissionId: newSubmission.id,
							questionId: questionId,
							answerId: value,
							textResponse: null,
						},
					];
				},
			);

			// Inserción en lote en Drizzle
			if (answersToInsert.length > 0) {
				await tx.insert(userAnswer).values(answersToInsert);
			}

			return { success: true, submissionId: newSubmission.id };
		});
	});

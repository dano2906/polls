import z from "zod";

const submissionAnswerInput = z.record(
	z.uuid({ message: "La clave debe ser un UUID válido" }),
	z.union([
		z.string(),
		z.number(),
		z.array(z.string()),
		z.object({ startDate: z.string(), endDate: z.string() }), // Por si manejas el rango como objeto
	]),
);

export const completePollInput = z.object({
	pollId: z.uuid({ message: "ID de encuesta inválido" }),
	answers: submissionAnswerInput,
});

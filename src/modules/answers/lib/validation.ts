import z from "zod";

const submissionAnswerInput = z.record(
	z.uuid({ message: "La clave debe ser un UUID válido" }),
	z.union([
		z.string(), // open_answer, single_choice, date_single, date_range
		z.number(), // rating
		z.array(z.string()), // multiple_choice, ranking
		z.object({ startDate: z.string(), endDate: z.string() }), // date_range
		z.record(z.string(), z.number()), //  point_distribution
		z.record(z.string(), z.string()),
	]),
);

export const completePollInput = z.object({
	pollId: z.uuid({ message: "ID de encuesta inválido" }),
	answers: submissionAnswerInput,
});

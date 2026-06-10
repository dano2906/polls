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
		z.object({
			lat: z
				.number({ error: "La latitud debe ser un número" })
				.min(-90)
				.max(90),
			lng: z
				.number({ error: "La longitud debe ser un número" })
				.min(-180)
				.max(-180),
		}),
	]),
);

export const completePollInput = z.object({
	pollId: z.uuid({ message: "ID de encuesta inválido" }),
	answers: submissionAnswerInput,
});

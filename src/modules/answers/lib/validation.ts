import z from "zod";

const submissionAnswerInput = z.record(
	z.uuid({ message: "La clave debe ser un UUID válido" }),
	z.union([z.string(), z.array(z.string())]),
);

export const completePollInput = z.object({
	pollId: z.uuid(),
	answers: submissionAnswerInput,
});

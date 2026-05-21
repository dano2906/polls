import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, streamText } from "ai";
import { openrouter } from "#/lib/openrouter";
import type { GeneratePoll } from "#/shared/types";
import { questionsBatchSchema } from "#/shared/validation";

export const Route = createFileRoute("/api/poll/generate-questions")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const { context, lang } = (await request.json()) as GeneratePoll;
					if (!context || context.trim().length < 10) {
						return new Response("Too short context", { status: 400 });
					}
					const result = await generateText({
						model: openrouter.chat(process.env.OPENROUTER_MODEL as string),
						output: Output.object({
							schema: questionsBatchSchema,
						}),
						system: `You are an expert educational assessment specialist and survey design professional.

Your task is to analyze the provided context and generate a high-quality, relevant, and objective questionnaire based ONLY on that context.

Strictly adhere to the following guidelines:
1. Accuracy: Every question, option, and correct answer must be directly verifiable using the provided context. Do not extrapolate, assume, or introduce external facts.
2. Clarity: Statements must be concise, unambiguous, and free from trick or misleading phrasing.
3. Distractors: Options (incorrect answers) must be plausible and distinct from one another, not obviously filler text.
4. Consistency: The "correctAnswer" property must match exactly one of the items listed inside the "options" array.
5. Answer in ${lang ?? "spanish"}.

You must output your response to fit the requested JSON schema perfectly. Do not include any conversational text, introductory remarks, or markdown wrappers outside the schema.`,
						prompt: `Context: \n ${context}`,
					});
					return Response.json(result.output);
				} catch (error) {
					console.log(error);
				}
			},
		},
	},
});

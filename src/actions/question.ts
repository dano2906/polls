import { createServerFn } from "@tanstack/react-start";
import { questionsBatchSchema } from "#/shared/validation";

export const createQuestions = createServerFn({ method: "POST" })
	.inputValidator((data) => questionsBatchSchema.parse(data))
	.handler(({ data }) => {
		console.log(data);
		return;
	});

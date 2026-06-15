import z from "zod";
import { passwordSchema } from "@/common/lib/validation";

export const signInSchema = z.object({
	email: z.email(),
	password: passwordSchema,
});

export const signUpSchema = signInSchema.extend({
	name: z.string(),
});

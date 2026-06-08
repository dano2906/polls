import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { poll } from "@/common/db/schema";

export const createPollInput = z
	.object({
		name: z
			.string()
			.min(2, { message: "Debe tener mínimo 2 caracteres" })
			.max(200, { message: "Debe tener máximo 32 caracteres" }),
		slug: z.string().optional(),
		startDate: z.date(),
		endDate: z.date().optional(),
		description: z.string().max(500).optional(),
		status: z.enum(["draft", "published", "archived"]).optional(),
		userId: z.string(),
	})
	.refine(
		(data) => {
			if (!data.endDate) return true;
			return data.endDate >= (data.startDate as Date);
		},
		{
			message: "La fecha de fin no puede ser anterior a la de inicio",
			path: ["endDate"],
		},
	)
	.refine(
		(data) => {
			if (!data.slug) return true;
			return data.slug.length < 6;
		},
		{
			message: "El slug debe 6 caracteres alfanuméricos.",
			path: ["slug"],
		},
	);
export const forkPollInput = z.object({ pollSlug: z.string().min(6).max(6) });
export const editPollInput = z
	.object({
		name: z
			.string()
			.min(2, { message: "Debe tener mínimo 2 caracteres" })
			.max(200, { message: "Debe tener máximo 32 caracteres" }),
		startDate: z.date(),
		endDate: z.date().optional(),
		description: z.string().max(500).optional(),
		status: z.enum(["draft", "published", "archived"]).optional(),
		userId: z.string(),
	})
	.partial()
	.refine(
		(data) => {
			if (!data.endDate) return true;
			return data.endDate >= (data.startDate as Date);
		},
		{
			message: "La fecha de fin no puede ser anterior a la de inicio",
			path: ["endDate"],
		},
	);

export const pollsSearchFiltershSchema = z.object({
	q: z.string().optional().default(""),
	status: z
		.enum(["all", "draft", "published", "archived"])
		.default("all")
		.optional(),
	error: z.string().optional().catch(undefined),
	view: z.enum(["compact", "list"]).default("compact"),
});
export const pollsSearchFilterWithUserSchema = pollsSearchFiltershSchema.extend(
	{
		userId: z.string(),
	},
);

export const selectPollOutput = createSelectSchema(poll);

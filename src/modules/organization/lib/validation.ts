import { z } from "zod";

export const createOrganizationSchema = z.object({
	name: z
		.string()
		.min(2, "El nombre debe tener al menos 2 caracteres")
		.max(100, "El nombre debe tener máximo 100 caracteres"),
	slug: z
		.string()
		.min(3, "El slug debe tener al menos 3 caracteres")
		.max(50, "El slug debe tener máximo 50 caracteres")
		.regex(
			/^[a-z0-9-]+$/,
			"El slug solo puede contener letras minúsculas, números y guiones",
		),
});

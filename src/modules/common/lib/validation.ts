import z from "zod";

export const passwordSchema = z
	.string()
	.min(8, {
		message: "La contraseña debe tener un mínimo de 8 caracteres.",
	})
	.max(25, { message: "La contraseña no puede superar los 25 caracteres." })
	.regex(/[A-Z]/, {
		message: "Debe contener al menos una letra mayúscula.",
	})
	.regex(/[a-z]/, {
		message: "Debe contener al menos una letra minúscula.",
	})
	.regex(/[^A-Za-z0-9]/, {
		message:
			"Debe incluir al menos un carácter especial (ej. @, $, !, #, etc.).",
	});

import z from "zod";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/common/lib/constants";
import { passwordSchema } from "@/common/lib/validation";

export const signInSchema = z.object({
	email: z.email(),
	password: passwordSchema,
});

export const signUpSchema = signInSchema.extend({
	name: z.string(),
});

export const updateAvatarSchema = z.object({
	id: z.string(),
	publicId: z
		.string({ error: "El publicId es requerido" })
		.min(1, "El publicId no puede estar vacío"),
	url: z
		.url("Debe ser una URL válida")
		.refine((val) => val.includes("res.cloudinary.com"), {
			message: "La URL debe pertenecer a Cloudinary",
		}),
});

export const revokeSessionSchema = z.union([
	z.object({ mode: z.literal("single"), token: z.string(), id: z.string() }),
	z.object({
		mode: z.literal("all"),
		id: z.string(),
		token: z.string().optional(),
	}),
]);

export const banUserSchema = z.object({
	id: z.string(),
	banReason: z.string(),
	banExpiresIn: z.union([
		z.literal(1),
		z.literal(7),
		z.literal(15),
		z.literal(31),
	]),
});

export const createUserSchema = signUpSchema.extend({
	avatar: z
		.instanceof(File, { message: "Debe seleccionar un archivo válido" })
		.refine((file) => file.size <= MAX_FILE_SIZE, {
			message: "La imagen no debe superar los 2MB",
		})
		.refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
			message: "Solo se permiten formatos .jpg, .jpeg, .png y .webp",
		})
		.optional()
		.or(z.string().optional()),
	role: z.union([
		z.literal("admin"),
		z.literal("org_admin"),
		z.literal("user"),
	]),
});

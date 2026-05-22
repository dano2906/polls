import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const generateRandomCode = (): string => {
	return Math.random().toString(36).substring(2, 8).toLowerCase();
};

export function createDynamicResponseSchema(questions: any[]) {
	const shape: Record<string, z.ZodTypeAny> = {};

	questions.forEach((q) => {
		if (q.type === "single_choice") {
			let schema = z.string();
			// Si es obligatoria, no puede venir vacía
			if (q.isRequired) {
				schema = schema.min(1, { message: "Esta pregunta es obligatoria." });
			} else {
				// Si no es obligatoria, permitimos un string vacío o nulo opcional
				schema = schema.optional() as any;
			}
			shape[q.id] = schema;
		} else if (q.type === "multiple_choice") {
			let schema = z.array(z.string());

			if (q.isRequired) {
				schema = schema.min(1, { message: "Selecciona al menos una opción." });
			}

			// Validación personalizada para respetar el límite de maxSelections
			if (q.maxSelections && q.maxSelections > 1) {
				schema = schema.refine((val) => val.length <= q.maxSelections, {
					message: `Puedes seleccionar como máximo ${q.maxSelections} opciones.`,
				});
			}

			shape[q.id] = schema;
		}
	});

	return z.object(shape);
}

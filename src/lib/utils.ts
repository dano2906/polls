import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import { getCloudinarySignature } from "#/actions/cloudinary";
import type { QuestionMetadata } from "#/shared/types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const generateRandomCode = (): string => {
	return Math.random().toString(36).substring(2, 8).toLowerCase();
};

export function createDynamicResponseSchema(questions: any[]) {
	const shape: Record<string, z.ZodTypeAny> = {};

	questions.forEach((q) => {
		let metadata: QuestionMetadata = {};
		if (q.metadata) {
			try {
				metadata =
					typeof q.metadata === "string" ? JSON.parse(q.metadata) : q.metadata;
			} catch (e) {
				console.error("Error parseando metadata en validaciones dinámicas:", e);
			}
		}
		switch (q.type) {
			// --- 1. SELECCIÓN SIMPLE ---
			case "single_choice": {
				let schema = z.string();
				if (q.isRequired) {
					schema = schema.min(1, { message: "Esta pregunta es obligatoria." });
				} else {
					schema = schema.optional() as any;
				}
				shape[q.id] = schema;
				break;
			}

			// --- 2. SELECCIÓN MÚLTIPLE ---
			case "multiple_choice": {
				let schema = z.array(z.string());

				if (q.isRequired) {
					schema = schema.min(1, {
						message: "Selecciona al menos una opción.",
					});
				}

				// Límite máximo basado en el esquema de la pregunta
				if (q.maxSelections && q.maxSelections > 1) {
					schema = schema.refine((val) => val.length <= q.maxSelections, {
						message: `Puedes seleccionar como máximo ${q.maxSelections} opciones.`,
					});
				}
				shape[q.id] = schema;
				break;
			}

			// --- 3. RESPUESTA ABIERTA / TEXTO (open_answer) ---
			case "open_answer": {
				let schema = z.string();
				if (q.isRequired) {
					schema = schema
						.trim()
						.min(1, { message: "Debes escribir una respuesta." });
				} else {
					schema = schema.optional() as any;
				}
				shape[q.id] = schema;
				break;
			}

			// --- 4. CALIFICACIÓN (rating) ---
			case "rating": {
				let schema = z.string();

				if (q.isRequired) {
					schema = schema.min(1, {
						message: "Por favor, selecciona una calificación.",
					});
				} else {
					schema = schema.optional() as any;
				}

				const metadata = q.metadata || {};
				const min = q.minValue ?? metadata.minRating ?? 1;
				const max = q.maxValue ?? metadata.maxRating ?? 5;

				// Añadimos refinamiento para asegurar que el valor esté dentro del rango permitido
				shape[q.id] = schema.refine(
					(val) => {
						if (!val) return !q.isRequired; // Si no es obligatorio y viene vacío, pasa.
						const num = Number(val);
						return num >= min && num <= max;
					},
					{
						message: `La calificación debe estar entre ${min} y ${max}.`,
					},
				);
				break;
			}

			// --- 5. ORDENAMIENTO (ranking) ---
			case "ranking": {
				// Una pregunta de ranking devuelve un array con los IDs de las respuestas en el orden elegido.
				let schema = z.array(z.string());

				// Al ser un ordenamiento, se debe validar que se hayan ordenado TODOS los elementos
				const expectedAnswersCount = q.answers?.length || 0;

				if (q.isRequired && expectedAnswersCount > 0) {
					schema = schema
						.min(expectedAnswersCount, {
							message: "Debes ordenar todas las opciones disponibles.",
						})
						.refine((val) => val.length === expectedAnswersCount, {
							message: `Faltan opciones por ordenar (se esperan ${expectedAnswersCount}).`,
						});
				}

				shape[q.id] = schema;
				break;
			}

			case "date_single": {
				let schema = z.string();

				if (q.isRequired) {
					schema = schema.min(1, { message: "Por favor, ingresa una fecha." });
				} else {
					schema = schema.optional() as any;
				}

				const minDateStr = q.minDate ?? metadata.minDate;
				const maxDateStr = q.maxDate ?? metadata.maxDate;

				shape[q.id] = schema.refine(
					(val) => {
						if (!val) return !q.isRequired;
						const selectedDate = new Date(val);
						if (Number.isNaN(selectedDate.getTime())) return false;

						if (minDateStr && selectedDate < new Date(minDateStr)) return false;
						if (maxDateStr && selectedDate > new Date(maxDateStr)) return false;

						return true;
					},
					{
						get message() {
							if (minDateStr && maxDateStr)
								return `La fecha debe estar entre el ${minDateStr} y el ${maxDateStr}.`;
							if (minDateStr)
								return `La fecha no puede ser anterior al ${minDateStr}.`;
							if (maxDateStr)
								return `La fecha no puede ser posterior al ${maxDateStr}.`;
							return "Fecha fuera de los límites permitidos.";
						},
					},
				);
				break;
			}

			case "date_range": {
				// 🛠️ El esquema base ahora espera un string puro
				let schema = z.string();

				if (q.isRequired) {
					schema = schema.min(1, {
						message: "El rango de fechas es obligatorio.",
					});
				} else {
					schema = schema.optional() as any;
				}

				const minDateStr = q.minDate ?? metadata.minDate;
				const maxDateStr = q.maxDate ?? metadata.maxDate;

				shape[q.id] = schema.refine(
					(val) => {
						// Si no es obligatorio y viene vacío, la validación pasa
						if (!val) return !q.isRequired;

						// Si no contiene la barra de separación, el formato es inválido
						if (!val.includes("/")) return false;

						const [startStr, endStr] = val.split("/");

						// Si es obligatorio, requerimos que existan ambas partes del rango
						if (q.isRequired && (!startStr?.trim() || !endStr?.trim()))
							return false;

						// Si no es obligatorio y está a medias, lo tratamos como inválido hasta que se complete
						if (!startStr?.trim() || !endStr?.trim()) return false;

						const fromDate = new Date(startStr.trim());
						const toDate = new Date(endStr.trim());

						// Validamos que sean fechas reales de JS
						if (
							Number.isNaN(fromDate.getTime()) ||
							Number.isNaN(toDate.getTime())
						) {
							return false;
						}

						// Validamos que la fecha inicio no sea posterior a la de fin
						if (fromDate > toDate) return false;

						// Validamos los límites mínimos corporativos
						if (minDateStr) {
							const minLimit = new Date(minDateStr);
							if (fromDate < minLimit || toDate < minLimit) return false;
						}

						// Validamos los límites máximos corporativos
						if (maxDateStr) {
							const maxLimit = new Date(maxDateStr);
							if (fromDate > maxLimit || toDate > maxLimit) return false;
						}

						return true;
					},
					{
						get message() {
							if (minDateStr && maxDateStr) {
								return `El rango de fechas debe estar entre el ${minDateStr} y el ${maxDateStr}.`;
							}
							if (minDateStr) {
								return `Las fechas no pueden ser anteriores al ${minDateStr}.`;
							}
							if (maxDateStr) {
								return `Las fechas no pueden ser posteriores al ${maxDateStr}.`;
							}
							return "Rango de fechas inválido o fuera de los límites permitidos.";
						},
					},
				);
				break;
			}

			// --- CASO POR DEFECTO ---
			default:
				// Si llega un tipo desconocido, permitimos cualquier dato para no romper el formulario entero
				shape[q.id] = z.any().optional();
				break;
		}
	});

	return z.object(shape);
}

export async function uploadToCloudinary(
	file: File,
): Promise<{ url: string; publicId: string }> {
	const config = await getCloudinarySignature();

	if (!config) throw new Error("Error obteniendo la firma");

	// 2. Construir FormData
	const formData = new FormData();
	formData.append("file", file);
	formData.append("api_key", config.apiKey);
	formData.append("timestamp", config.timestamp.toString());
	formData.append("signature", config.signature);
	formData.append("folder", config.folder);

	// 3. Subir
	const response = await fetch(
		`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
		{ method: "POST", body: formData },
	);

	if (!response.ok) throw new Error("Error al subir archivo a Cloudinary");

	const data = await response.json();
	return {
		url: data.secure_url,
		publicId: data.public_id,
	};
}

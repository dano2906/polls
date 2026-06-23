import * as XLSX from "xlsx";
import type { ExportData } from "@/poll/shared/types";

function parseFlexibleDate(cellValue: any): Date {
	if (!cellValue) return new Date();

	// 1. Si SheetJS ya lo extrajo como un objeto Date real (Excel con cellDates: true)
	if (cellValue instanceof Date && !Number.isNaN(cellValue.getTime())) {
		return cellValue;
	}

	const cellStr = String(cellValue).trim();

	// 2. 🚀 SOLUCIÓN CSV: Si viene como formato de fecha pura "AAAA-MM-DD" o "AA/MM/DD"
	// Evitamos que JavaScript lo mande a UTC a la medianoche.
	const pureDateRegex = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/;
	if (pureDateRegex.test(cellStr)) {
		// Reemplazamos guiones por diagonales si los hay para estandarizar
		const normalizedStr = cellStr.replace(/-/g, "/");
		const parsedLocal = new Date(normalizedStr);

		if (!Number.isNaN(parsedLocal.getTime())) {
			return parsedLocal; // Se inicializa directamente en la hora local del usuario
		}
	}

	// 3. Si viene con un formato ISO completo (Ej: "2026-05-28T16:00:00.000Z")
	const timestamp = Date.parse(cellStr);
	if (!Number.isNaN(timestamp)) {
		return new Date(timestamp);
	}

	// 4. Si es un número serial residual de Excel
	if (!Number.isNaN(Number(cellStr))) {
		return new Date((Number(cellStr) - 25569) * 86400 * 1000);
	}

	return new Date();
}

function formatDateForTabular(dateInput: Date): string {
	if (!dateInput) return "";

	const d = new Date(dateInput);
	if (Number.isNaN(d.getTime())) return "";

	// Extraemos los componentes en formato LOCAL del navegador
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function flattenPollData(poll: ExportData) {
	const rows = [];

	for (const q of poll.questions) {
		const baseRow = {
			"Nombre Encuesta": poll.name,
			"Descripcion Encuesta": poll.description || "",
			"Fecha de inicio": formatDateForTabular(poll.startDate),
			"Fecha de fin": poll.endDate ? formatDateForTabular(poll.endDate) : "",
			"Texto Pregunta": q.questionText,
			"Tipo Pregunta": q.type,
			"Orden Pregunta": q.order ?? 0,
			"Contiene respuestas correctas": q.hasCorrectAnswers ? "SI" : "NO",
			"Cantidad maxima de selecciones": q.maxSelections ?? 1,
			"Es requerida": q.isRequired ? "SI" : "NO",
			Metadatos: q.metadata ? JSON.stringify(q.metadata) : JSON.stringify({}),
		};

		if (q.answers.length === 0) {
			rows.push({
				...baseRow,
				"Texto Opcion": "",
				"Es Correcta": "",
			});
		} else {
			for (const ans of q.answers) {
				rows.push({
					...baseRow,
					"Texto Opcion": ans.answerText || "",
					"Es Correcta":
						ans.isCorrect !== null ? (ans.isCorrect ? "SI" : "NO") : "",
				});
			}
		}
	}
	return rows;
}

// --- 2. DESERIALIZADOR (IMPORTACIÓN) ---
export async function parsePollFile(file: File): Promise<ExportData> {
	const extension = file.name.split(".").pop()?.toLowerCase();

	// --- LEER FORMATO JSON DIRECTAMENTE ---
	if (extension === "json") {
		const text = await file.text();
		const parsed = JSON.parse(text);

		return {
			...parsed,
			startDate: new Date(parsed.startDate),
			endDate: parsed.endDate ? new Date(parsed.endDate) : null,
		} as ExportData;
	}

	// --- LEER EXCEL O CSV USANDO SHEETJS ---
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = e.target?.result;
				const workbook = XLSX.read(data, { type: "binary", cellDates: true });
				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];

				const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];
				if (rawRows.length === 0) throw new Error("El archivo está vacío");

				const firstRow = rawRows[0];

				// 💡 VALIDACIÓN 1: ¿Las columnas obligatorias existen?
				if (
					!("Texto Pregunta" in firstRow) ||
					!("Nombre Encuesta" in firstRow)
				) {
					throw new Error(
						"El archivo no tiene el formato correcto. Asegúrate de que las cabeceras coincidan exactamente con la plantilla exportada (Ej: 'Texto Pregunta', 'Nombre Encuesta').",
					);
				}

				const pollName = firstRow["Nombre Encuesta"] || "Encuesta Importada";
				const pollDesc = firstRow["Descripcion Encuesta"] || null;
				const startDate = parseFlexibleDate(firstRow["Fecha de inicio"]);
				const endDate = firstRow["Fecha de fin"]
					? parseFlexibleDate(firstRow["Fecha de fin"])
					: null;

				const questionsMap = new Map<string, ExportData["questions"][number]>();

				// Usamos un contador de líneas para dar feedback ultra preciso en el error
				let lineCount = 1;

				for (const row of rawRows) {
					lineCount++;
					const qText = row["Texto Pregunta"];
					if (!qText) continue;

					if (!questionsMap.has(qText)) {
						let parsedMetadata = {};

						// 💡 VALIDACIÓN 2: Evitar que metadatos corruptos rompan todo
						if (row.Metadatos) {
							try {
								const rawMeta = row.Metadatos;

								if (typeof rawMeta === "object" && rawMeta !== null) {
									// 💡 Si SheetJS ya lo extrajo como objeto, lo asignamos directamente
									parsedMetadata = rawMeta;
								} else if (
									typeof rawMeta === "string" &&
									rawMeta.trim() !== ""
								) {
									// 💡 Si es un string (viene de un CSV limpio), lo parseamos
									parsedMetadata = JSON.parse(rawMeta);
								} else {
									parsedMetadata = {};
								}
							} catch {
								throw new Error(
									`Error de formato JSON en la columna 'Metadatos' (Fila aproximada: ${lineCount}). Asegúrese de usar comillas dobles rectas y un formato válido. Contenido: ${row.Metadatos}`,
								);
							}
						}

						questionsMap.set(qText, {
							questionText: qText,
							type: row["Tipo Pregunta"] || "single_choice",
							order:
								row["Orden Pregunta"] !== undefined
									? Number(row["Orden Pregunta"])
									: 0,
							hasCorrectAnswers: row["Contiene respuestas correctas"] === "SI",
							maxSelections:
								row["Cantidad maxima de selecciones"] !== undefined
									? Number(row["Cantidad maxima de selecciones"])
									: 1,
							isRequired: row["Es requerida"] === "SI",
							metadata: parsedMetadata,
							answers: [],
						});
					}

					const currentQuestion = questionsMap.get(qText);
					const optionText = row["Texto Opcion"]; // ⚠️ OJO AQUÍ: Asegúrate de si es "Texto Opcion" o "Texto Opción" (con acento)

					if (optionText !== undefined && optionText !== "") {
						const isCorrectRaw = row["Es Correcta"];
						currentQuestion?.answers.push({
							answerText: String(optionText),
							isCorrect:
								isCorrectRaw === "SI"
									? true
									: isCorrectRaw === "NO"
										? false
										: null,
						});
					}
				}

				resolve({
					name: pollName,
					description: pollDesc,
					startDate,
					endDate,
					questions: Array.from(questionsMap.values()),
				});
			} catch (err: any) {
				// 💡 Imprimimos el error nativo completo en la consola del navegador para inspección técnica
				console.error("🚨 Error detallado en parsePollFile:", err);

				// Propagamos el mensaje real hacia la UI para que useMutation lo capture
				reject(
					new Error(
						err.message ||
							"Error procesando la estructura del archivo tabular. Verifique las celdas.",
					),
				);
			}
		};

		reader.onerror = () =>
			reject(new Error("Error al leer el archivo físico."));
		reader.readAsBinaryString(file);
	});
}

export const exportPoll = {
	// --- EXPORTAR A JSON (Se mantiene impecable) ---
	json: (poll: ExportData, filename: string) => {
		const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(poll, null, 2))}`;
		const downloadAnchor = document.createElement("a");
		downloadAnchor.setAttribute("href", dataStr);
		downloadAnchor.setAttribute("download", `${filename}.json`);
		downloadAnchor.click();
	},

	// --- EXPORTAR A EXCEL ---
	excel: (poll: ExportData, filename: string) => {
		// Pasamos los datos por el aplanador corregido que asegura strings en metadatos
		const flattenedData = cleanAndFlattenPollData(poll);
		const worksheet = XLSX.utils.json_to_sheet(flattenedData);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Preguntas");

		worksheet["!cols"] = [
			{ wch: 22 }, // Nombre Encuesta
			{ wch: 25 }, // Descripcion Encuesta
			{ wch: 25 }, // Fecha de inicio
			{ wch: 25 }, // Fecha de fin
			{ wch: 35 }, // Texto Pregunta
			{ wch: 15 }, // Tipo Pregunta
			{ wch: 12 }, // Orden Pregunta
			{ wch: 25 }, // Contiene respuestas correctas
			{ wch: 25 }, // Cantidad maxima de selecciones
			{ wch: 12 }, // Es requerida
			{ wch: 30 }, // Metadatos (¡Ahora garantizado como un JSON String válido!)
			{ wch: 25 }, // Texto Opcion
			{ wch: 12 }, // Es Correcta
		];

		XLSX.writeFile(workbook, `${filename}.xlsx`);
	},

	// --- EXPORTAR A CSV ---
	csv: (poll: ExportData, filename: string) => {
		// Usamos exactamente la misma data limpia que el Excel
		const flattenedData = cleanAndFlattenPollData(poll);
		const worksheet = XLSX.utils.json_to_sheet(flattenedData);
		const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

		const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const downloadAnchor = document.createElement("a");
		downloadAnchor.setAttribute("href", url);
		downloadAnchor.setAttribute("download", `${filename}.csv`);
		downloadAnchor.click();
	},
};

/**
 * Función auxiliadora que envuelve a tu 'flattenPollData' original
 * y asegura que los metadatos nunca viajen como nulls ni rompan el importador.
 */
function cleanAndFlattenPollData(poll: ExportData) {
	// 1. Ejecutamos tu lógica de aplanado actual
	const rows = flattenPollData(poll);

	// 2. Normalizamos la columna de metadatos para que sea idéntica en cada fila
	return rows.map((row: any) => {
		let metadataStr = "{}"; // Por defecto un objeto JSON vacío en formato string

		if (row["Metadatos"] || row["Metadatos (JSON Stringified)"]) {
			const rawMeta = row["Metadatos"] || row["Metadatos (JSON Stringified)"];

			if (typeof rawMeta === "object" && rawMeta !== null) {
				// Si venía como objeto, lo aseguramos como string inyectando valores seguros
				const cleanMeta = {
					minDate: rawMeta.minDate ?? "",
					maxDate: rawMeta.maxDate ?? "",
					...rawMeta,
				};
				metadataStr = JSON.stringify(cleanMeta);
			} else if (typeof rawMeta === "string" && rawMeta.trim() !== "") {
				try {
					// Si ya es string, validamos que tenga las propiedades mapeadas como strings
					const parsed = JSON.parse(rawMeta);
					if (parsed && typeof parsed === "object") {
						parsed.minDate = parsed.minDate ?? "";
						parsed.maxDate = parsed.maxDate ?? "";
						metadataStr = JSON.stringify(parsed);
					}
				} catch {
					metadataStr = rawMeta; // Si no es un JSON parseable, dejamos el string original
				}
			}
		} else {
			// Si la fila directamente no tenía la columna de metadatos, le creamos una estructura base de texto
			metadataStr = JSON.stringify({ minDate: "", maxDate: "" });
		}

		// Retornamos la fila asegurando que la propiedad de metadatos tenga el nombre exacto
		// que espera tu analizador (parsePollFile) al importar de vuelta.
		return {
			...row,
			"Metadatos (JSON Stringified)": metadataStr,
		};
	});
}

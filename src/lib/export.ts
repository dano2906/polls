import * as XLSX from "xlsx";
import type { ExportData } from "#/shared/types";

function flattenPollData(poll: ExportData) {
	const rows = [];

	for (const q of poll.questions) {
		const baseRow = {
			"Nombre Encuesta": poll.name,
			"Descripcion Encuesta": poll.description || "",
			"Fecha de inicio": poll.startDate ? poll.startDate : Date.now(),
			"Fecha de fin": poll.endDate ? poll.endDate : null,
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
				const workbook = XLSX.read(data, { type: "binary" });
				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];

				const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];
				if (rawRows.length === 0) throw new Error("El archivo está vacío");

				// Extraemos las propiedades de la encuesta desde la primera fila
				const firstRow = rawRows[0];
				const pollName = firstRow["Nombre Encuesta"] || "Encuesta Importada";
				const pollDesc = firstRow["Descripcion Encuesta"] || null;
				const startDate = firstRow["Fecha de inicio"]
					? new Date(firstRow["Fecha de inicio"])
					: new Date();
				const endDate = firstRow["Fecha de fin"]
					? new Date(firstRow["Fecha de fin"])
					: null;

				// Estructura de reducción para agrupar celdas repetidas en preguntas unificadas
				const questionsMap = new Map<string, ExportData["questions"][number]>();

				for (const row of rawRows) {
					const qText = row["Texto Pregunta"];
					if (!qText) continue;

					if (!questionsMap.has(qText)) {
						// Re-hidratamos el objeto de configuración metadatos
						let parsedMetadata = {};
						try {
							if (row["Metadatos"]) {
								parsedMetadata = JSON.parse(row["Metadatos"]);
							}
						} catch (e) {
							console.error("Error al parsear metadatos de la pregunta", e);
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
					const optionText = row["Texto Opcion"];

					// Si la celda contiene datos de opciones, la insertamos en su respectivo array anidado
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
			} catch (err) {
				reject(
					new Error(
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
	// --- EXPORTAR A JSON ---
	json: (poll: ExportData, filename: string) => {
		const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(poll, null, 2))}`;
		const downloadAnchor = document.createElement("a");
		downloadAnchor.setAttribute("href", dataStr);
		downloadAnchor.setAttribute("download", `${filename}.json`);
		downloadAnchor.click();
	},

	// --- EXPORTAR A EXCEL ---
	excel: (poll: ExportData, filename: string) => {
		const flattenedData = flattenPollData(poll);
		const worksheet = XLSX.utils.json_to_sheet(flattenedData);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Preguntas");

		// Ajustamos dinámicamente los tamaños basándonos en las nuevas columnas del layout plano
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
			{ wch: 20 }, // Metadatos (JSON Stringified)
			{ wch: 25 }, // Texto Opcion
			{ wch: 12 }, // Es Correcta
		];

		XLSX.writeFile(workbook, `${filename}.xlsx`);
	},

	// --- EXPORTAR A CSV ---
	csv: (poll: ExportData, filename: string) => {
		const flattenedData = flattenPollData(poll);
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

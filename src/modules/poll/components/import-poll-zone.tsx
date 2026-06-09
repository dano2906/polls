import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	AlertCircle,
	CheckCircle2,
	FileText,
	ListPlus,
	Trash2,
	Upload,
} from "lucide-react";
import { useState } from "react";
import { parsePollFile } from "@/common/lib/export";
import type { QuestionType } from "@/question/shared/types";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { LoadingSwap } from "@/ui/loading-swap";
import { importPollAction } from "../actions/poll";
import type { ExportData } from "../shared/types";

const typeLabel: Record<QuestionType, string> = {
	multiple_choice: "Selección múltiple",
	single_choice: "Selección simple",
	open_answer: "Respuesta abierta",
	ranking: "Clasificación/Ranking",
	rating: "Evaluación/Rating",
	date_single: "Fecha simple",
	date_range: "Rango de fechas",
};

export function ImportPollZone() {
	const router = useRouter();
	const navigate = useNavigate({ from: "/poll/import" });
	const [isDragActive, setIsDragActive] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);

	// Estado para guardar la previsualización antes de enviar a DB
	const [previewData, setPreviewData] = useState<ExportData | null>(null);

	// Integración de TanStack Query Mutation
	const {
		mutate: submitImport,
		isPending: isSaving,
		error: mutationError,
		isSuccess,
	} = useMutation({
		mutationFn: async (data: ExportData) => {
			const result = await importPollAction({ data });
			if (!result?.success) {
				throw new Error("El servidor no pudo procesar la inserción.");
			}
			return result;
		},
		onSuccess: () => {
			router.invalidate();
			const timeout = setTimeout(() => {
				navigate({
					to: "/dashboard",
				});
				clearTimeout(timeout);
			}, 1000);
		},
	});

	// Validar y cargar archivo en el estado de previsualización
	const processFile = async (file: File) => {
		const allowedExtensions = ["json", "xlsx", "csv"];
		const fileExtension = file.name.split(".").pop()?.toLowerCase();

		if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
			setLocalError(
				"Formato no válido. Solo se admiten archivos .json, .xlsx y .csv",
			);
			return;
		}

		setLocalError(null);
		try {
			// Extrae los datos pero NO los guarda en DB, solo los monta en memoria
			const structuredData = await parsePollFile(file);
			setPreviewData(structuredData);
		} catch (error: any) {
			console.error(error);
			setLocalError(
				error.message || "Error al leer la estructura del archivo.",
			);
		}
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		await processFile(file);
		event.target.value = "";
	};

	const handleDrag = (event: React.DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (event.type === "dragenter" || event.type === "dragover")
			setIsDragActive(true);
		else if (event.type === "dragleave") setIsDragActive(false);
	};

	const handleDrop = async (event: React.DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDragActive(false);
		if (isSaving) return;

		const file = event.dataTransfer.files?.[0];
		if (file) await processFile(file);
	};

	const handleCancelPreview = () => {
		setPreviewData(null);
		setLocalError(null);
	};

	const activeError = localError || mutationError?.message;

	return (
		<div className="w-full mx-auto space-y-6 font-sgc">
			{/* --- CASO A: VISTA DE CARGA (ZONA DROP) --- */}
			{!previewData && (
				<Label
					onDragEnter={handleDrag}
					onDragOver={handleDrag}
					onDragLeave={handleDrag}
					onDrop={handleDrop}
					className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer bg-muted/20 transition-all group relative
                        ${isDragActive ? "border-primary bg-primary/10 scale-[1.01]" : "border-muted-foreground/30 hover:bg-muted/40"}
                    `}
				>
					<div className="flex flex-col items-center justify-center text-center px-4 space-y-2 font-sgc">
						<Upload
							className={`h-8 w-8 transition-colors ${isDragActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}
						/>
						<p className="text-sm font-semibold text-foreground">
							{isDragActive
								? "¡Suéltalo aquí!"
								: "Arrastra o selecciona el archivo de tu encuesta"}
						</p>
						<p className="text-xs text-muted-foreground">
							Formatos admitidos:{" "}
							<span className="font-sgc text-primary">.json, .xlsx, .csv</span>
						</p>
					</div>
					<Input
						type="file"
						accept=".json,.xlsx,.csv"
						className="hidden"
						onChange={handleFileChange}
					/>
				</Label>
			)}

			{/* --- CASO B: PANEL DE PREVISUALIZACIÓN DE APOYO --- */}
			{previewData && (
				<div className="border rounded-xl bg-card overflow-hidden shadow-sm animate-in fade-in-50 duration-200 font-sgc">
					{/* Encabezado de la previsualización */}
					<div className="p-4 bg-muted/50 border-b flex items-center justify-between">
						<div className="flex items-center gap-2">
							<FileText className="h-5 w-5 text-primary" />
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Previsualización de Plantilla
							</span>
						</div>
						<Button
							onClick={handleCancelPreview}
							disabled={isSaving}
							variant={"ghostDestructive"}
							title="Descartar archivo"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>

					{/* Contenido Extendido del Archivo Parseado */}
					<div className="p-5 space-y-4 overflow-y-auto">
						<div>
							<h6 className="text-2xl font-medium tracking-wide text-foreground">
								{previewData.name}
							</h6>
							{previewData.description && (
								<p className="text-sm text-muted-foreground mt-1">
									{previewData.description}
								</p>
							)}
							<Badge
								variant={"secondary"}
								className="text-xs font-sg font-thin px-0 py-1 gap-1 flex items-center w-fit"
							>
								<span className="text-muted-foreground">
									Disponible desde el{" "}
									<strong className="text-foreground font-normal">
										{format(previewData.startDate, "dd/MM/yyyy", {
											locale: es,
										})}
									</strong>
								</span>

								{previewData.endDate && (
									<span className="text-muted-foreground">
										{" "}
										hasta el{" "}
										<strong className="text-foreground font-normal">
											{format(previewData.endDate, "dd/MM/yyyy", {
												locale: es,
											})}
										</strong>
									</span>
								)}
							</Badge>
						</div>

						<div className="border-t pt-4 space-y-3">
							<h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
								<ListPlus className="h-3.5 w-3.5" /> Estructura de Preguntas (
								{previewData.questions.length})
							</h3>

							{previewData.questions.map((q, idx) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: Dont have a field for key
									key={idx}
									className="p-3 border rounded-lg bg-muted/20 space-y-2"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="space-y-0.5">
											<p className="text-base font-medium text-foreground tracking-wide">
												<span className="text-muted-foreground mr-1">
													{q.order ?? idx + 1}.
												</span>{" "}
												{q.questionText}
											</p>
										</div>
										<div className="flex gap-1.5">
											<Badge>{typeLabel[q.type]}</Badge>
											{q.isRequired && (
												<Badge variant={"destructive"}>Obligatoria</Badge>
											)}
											{q.hasCorrectAnswers && (
												<Badge variant={"secondary"}>Evaluada</Badge>
											)}
										</div>
									</div>

									{q.type === "rating" && q.metadata && (
										<span className="bg-background text-muted-foreground tracking-wide font-normal text-xs p-1.5 rounded border flex items-center justify-between">
											Desde {(q.metadata as any).minRating ?? 1} hasta{" "}
											{(q.metadata as any).maxRating ?? 5}.
										</span>
									)}

									{(q.type === "date_single" || q.type === "date_range") &&
										q.metadata &&
										((q.metadata as any).minDate ||
											(q.metadata as any).maxDate) && (
											<span className="bg-background text-muted-foreground tracking-wide font-normal text-xs p-1.5 rounded border flex items-center gap-2 flex-wrap">
												<span className="text-muted-foreground/80">
													Límites de fecha:
												</span>

												{(q.metadata as any).minDate && (
													<span>
														Desde el{" "}
														<strong className="text-foreground font-medium">
															{(() => {
																try {
																	return format(
																		new Date((q.metadata as any).minDate),
																		"dd/MM/yyyy",
																		{ locale: es },
																	);
																} catch {
																	return (q.metadata as any).minDate; // Fallback por si la fecha no es válida
																}
															})()}
														</strong>
													</span>
												)}

												{(q.metadata as any).minDate &&
													(q.metadata as any).maxDate && (
														<span className="text-muted-foreground/40">•</span>
													)}

												{(q.metadata as any).maxDate && (
													<span>
														Hasta el{" "}
														<strong className="text-foreground font-medium">
															{(() => {
																try {
																	return format(
																		new Date((q.metadata as any).maxDate),
																		"dd/MM/yyyy",
																		{ locale: es },
																	);
																} catch {
																	return (q.metadata as any).maxDate; // Fallback por si la fecha no es válida
																}
															})()}
														</strong>
													</span>
												)}
											</span>
										)}

									{/* Mapeo de Opciones de la Pregunta si las tiene */}
									{q.answers && q.answers.length > 0 && (
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
											{q.answers.map((ans, aIdx) => (
												<div
													// biome-ignore lint/suspicious/noArrayIndexKey: Dont have a field for key
													key={aIdx}
													className={`text-xs p-1.5 rounded border flex items-center justify-between ${ans.isCorrect ? "bg-success/5 border-success/20 text-success/70 dark:text-success/40" : "bg-background text-muted-foreground"}`}
												>
													<span className="truncate">{ans.answerText}</span>
													{ans.isCorrect && (
														<span className="text-[9px] font-bold uppercase tracking-wider bg-success/20 px-1 rounded text-success dark:text-success/40 shrink-0">
															Correcta
														</span>
													)}
												</div>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Barra de Acciones Finales */}
					<div className="p-3 bg-muted/30 border-t flex items-center justify-end gap-3">
						<Button
							type="button"
							onClick={handleCancelPreview}
							disabled={isSaving || isSuccess}
							variant={"secondary"}
						>
							<LoadingSwap isLoading={isSaving}>Cancelar</LoadingSwap>
						</Button>
						<Button
							type="button"
							onClick={() => submitImport(previewData)}
							disabled={isSaving || isSuccess}
							variant={"default"}
						>
							<LoadingSwap isLoading={isSaving}>
								{isSuccess ? "¡Guardado!" : "Confirmar e Importar"}
							</LoadingSwap>
						</Button>
					</div>
				</div>
			)}

			{/* --- SECCIÓN DE FEEDBACK COMPARTIDA --- */}
			{activeError && (
				<div className="flex items-center gap-3 p-3 text-sm rounded-lg border bg-destructive/10 border-destructive/20 text-destructive animate-in slide-in-from-top-1 duration-200">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<span>{activeError}</span>
				</div>
			)}

			{isSuccess && (
				<div className="flex items-center gap-3 p-3 text-sm rounded-lg border bg-success/10 border-success/20 text-success dark:text-success/80 animate-in slide-in-from-top-1 duration-200">
					<CheckCircle2 className="h-4 w-4 shrink-0" />
					<span>¡La encuesta ha sido importada con éxito!</span>
				</div>
			)}
		</div>
	);
}

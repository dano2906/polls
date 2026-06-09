import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
	ArrowUpDown,
	BarChart3,
	CalendarIcon,
	CheckCircle2,
	HelpCircle,
	MessageSquare,
	XCircle,
} from "lucide-react";
import { cn } from "@/common/lib/utils";
import type { QuestionMetadata } from "@/question/shared/types";

interface Props {
	question: {
		id: string;
		questionText: string;
		type:
			| "open_answer"
			| "rating"
			| "ranking"
			| "single_choice"
			| "multiple_choice"
			| "date_single"
			| "date_range";
		metadata: QuestionMetadata;
		order: number;
		textResponse: string | null;
		// Dependiendo de cómo tengas definido SelectedAnswer, aquí usamos los campos que
		// inyectamos en la Server Action (score, dateValue, startDate, orderIndex, id)
		selectedAnswers: any[];
	};
}

export function ResponseRenderer({ question }: Props) {
	const { type, textResponse, selectedAnswers, metadata } = question;

	// Extraemos las opciones desde la metadata (útil para choice y ranking si necesitas la lista completa)
	const options = (metadata as any)?.options || [];

	// 1. Estado vacío: Validamos si hay respuestas según el tipo de pregunta
	const hasNoResponse =
		type === "open_answer"
			? !textResponse
			: !selectedAnswers || selectedAnswers.length === 0;

	if (hasNoResponse) {
		return (
			<div className="flex items-start gap-2.5 p-3.5 bg-muted/20 border border-dashed rounded-lg">
				<span className="text-sm text-muted-foreground italic">
					No respondida.
				</span>
			</div>
		);
	}

	switch (type) {
		// --- CASO 1: RESPUESTA ABIERTA ---
		case "open_answer": {
			return (
				<div className="flex items-start gap-2.5 p-3.5 bg-muted/40 border border-dashed rounded-lg">
					<MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
					<p className="text-sm text-foreground italic whitespace-pre-wrap w-full">
						{textResponse?.trim() || (
							<span className="text-muted-foreground not-italic">
								Respondida en blanco.
							</span>
						)}
					</p>
				</div>
			);
		}

		// --- CASO 2: CALIFICACIÓN / RATING ---
		case "rating": {
			// Leemos directamente el score inyectado desde el backend
			const score = selectedAnswers[0]?.score;

			return (
				<div className="flex items-center gap-3 p-3 bg-muted/30 border rounded-lg max-w-xs">
					<BarChart3 className="h-4 w-4 text-primary shrink-0" />
					<span className="text-sm text-muted-foreground">
						Puntuación otorgada:
					</span>
					<span className="text-lg font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
						{score ?? 0}
					</span>
				</div>
			);
		}

		// --- CASO 3: ORDENAMIENTO / RANKING ---
		case "ranking": {
			// El backend ya nos envía el answerText y el orderIndex. Solo tenemos que ordenarlo.
			const orderedAnswers = [...selectedAnswers].sort(
				(a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
			);

			return (
				<div className="space-y-2">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
						<ArrowUpDown className="h-3 w-3" />
						<span>Tu orden de preferencia:</span>
					</div>
					<div className="grid gap-2">
						{orderedAnswers.map((ans, idx) => (
							<div
								key={ans.id}
								className="flex items-center gap-3 p-2.5 bg-background border rounded-lg text-sm font-medium shadow-sm"
							>
								<span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
									{idx + 1}
								</span>
								<span className="text-foreground">{ans.answerText}</span>
							</div>
						))}
					</div>
				</div>
			);
		}

		// --- CASO 4 & 5: SELECCIÓN SIMPLE Y MÚLTIPLE ---
		case "single_choice":
		case "multiple_choice": {
			// Mapeamos los IDs limpios que devuelve el backend
			const selectedIds: string[] = selectedAnswers.map((sa) => sa.id);

			// Detectamos si es un juego/quiz o una encuesta de opinión común
			const isQuiz = selectedAnswers.some((opt: any) => opt.isCorrect === true);

			return (
				<div className="grid gap-2">
					{selectedAnswers.map((ans: any) => {
						const isSelected = selectedIds.includes(ans.id);
						const isCorrectAnswer = ans.isCorrect === true;

						return (
							<div
								key={ans.id}
								className={cn(
									"flex items-center justify-between p-3 border rounded-lg text-sm transition-all duration-200",
									isQuiz
										? isSelected
											? isCorrectAnswer
												? "bg-emerald-500/5 border-emerald-500/30 text-emerald-900 dark:text-emerald-300 font-medium"
												: "bg-destructive/5 border-destructive/20 text-destructive font-medium"
											: isCorrectAnswer
												? "bg-emerald-500/5 border-emerald-500/20 border-dashed text-emerald-600 dark:text-emerald-400"
												: "bg-background border-muted text-muted-foreground/70"
										: isSelected
											? "bg-primary/5 border-primary/30 text-primary font-medium ring-1 ring-primary/10"
											: "bg-background border-muted text-foreground",
								)}
							>
								<div className="flex items-center gap-2.5">
									<span>{ans.answerText || ans.text}</span>
								</div>
								{isQuiz && (
									<div className="flex items-center gap-1.5 text-xs font-semibold shrink-0 ml-4">
										{isCorrectAnswer && (
											<>
												<CheckCircle2 className="h-4 w-4 text-emerald-500" />
												<span
													className={
														isSelected
															? "text-emerald-600 dark:text-emerald-400"
															: "text-emerald-500/70 font-normal"
													}
												>
													{isSelected
														? "¡Correcta!"
														: "Era la respuesta correcta"}
												</span>
											</>
										)}
										{isSelected && !isCorrectAnswer && (
											<>
												<XCircle className="h-4 w-4 text-destructive" />
												<span className="text-destructive">
													Tu selección (Incorrecta)
												</span>
											</>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			);
		}

		// --- CASO 6: FECHA SIMPLE ---
		case "date_single": {
			const rawDate = selectedAnswers[0]?.dateValue;
			const parsedDate = rawDate ? parseISO(rawDate) : null;
			const isValidDate = parsedDate && isValid(parsedDate);

			return (
				<div className="w-full flex items-center gap-3 p-3 bg-muted/30 border rounded-lg max-w-sm">
					<CalendarIcon className="h-4 w-4 text-primary shrink-0" />
					<span className="text-sm font-medium text-foreground">
						{isValidDate ? (
							format(parsedDate, "PPP", { locale: es })
						) : (
							<span className="text-muted-foreground italic">
								Fecha inválida o mal estructurada.
							</span>
						)}
					</span>
				</div>
			);
		}

		// --- CASO 7: RANGO DE FECHAS ---
		case "date_range": {
			const rawStart = selectedAnswers[0]?.startDate;
			const rawEnd = selectedAnswers[0]?.endDate;

			const start = rawStart ? parseISO(rawStart) : null;
			const end = rawEnd ? parseISO(rawEnd) : null;
			const isRangeValid = start && isValid(start) && end && isValid(end);

			return (
				<div className="w-full flex items-center gap-3 p-3 bg-muted/30 border rounded-lg max-w-sm">
					<CalendarIcon className="h-4 w-4 text-primary shrink-0" />
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted-foreground font-medium">
							Período seleccionado:
						</span>
						{isRangeValid ? (
							<span className="text-sm font-semibold text-foreground">
								{format(start, "dd 'de' LLL, yyyy", { locale: es })} –{" "}
								{format(end, "dd 'de' LLL, yyyy", { locale: es })}
							</span>
						) : (
							<span className="text-sm text-muted-foreground italic">
								Período inválido o incompleto.
							</span>
						)}
					</div>
				</div>
			);
		}

		default:
			return (
				<div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg bg-muted/10">
					<HelpCircle className="h-4 w-4 text-muted-foreground" />
					<span>Tipo de respuesta desconocido.</span>
				</div>
			);
	}
}

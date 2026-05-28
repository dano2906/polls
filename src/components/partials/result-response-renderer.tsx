import {
	ArrowUpDown,
	BarChart3,
	CheckCircle2,
	HelpCircle,
	MessageSquare,
	XCircle,
} from "lucide-react";
import { cn } from "#/lib/utils";

interface Props {
	question: {
		id: string;
		questionText: string;
		type: string;
		order: number | null;
		textResponse: string | null;
		selectedAnswers: {
			answerId: string;
			answerText: string | null;
			isCorrect: boolean | null;
			sortOrder?: number | null;
		}[];
	};
}

export function ResponseRenderer({ question }: Props) {
	const { type, selectedAnswers, textResponse } = question;

	switch (type) {
		// --- CASO 1: RESPUESTA ABIERTA ---
		case "open_answer":
			return (
				<div className="flex items-start gap-2.5 p-3.5 bg-muted/40 border border-dashed rounded-lg">
					<MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
					<p className="text-sm text-foreground italic whitespace-pre-wrap">
						{textResponse || (
							<span className="text-muted-foreground not-italic">
								No respondida.
							</span>
						)}
					</p>
				</div>
			);

		// --- CASO 2: CALIFICACIÓN / RATING ---
		case "rating":
			return (
				<div className="flex items-center gap-3 p-3 bg-muted/30 border rounded-lg max-w-xs">
					<BarChart3 className="h-4 w-4 text-primary" />
					<span className="text-sm text-muted-foreground">
						Puntuación otorgada:
					</span>
					<span className="text-lg font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
						{textResponse ?? "-"}
					</span>
				</div>
			);

		// --- CASO 3: ORDENAMIENTO / RANKING ---
		case "ranking":
			return (
				<div className="space-y-2">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
						<ArrowUpDown className="h-3 w-3" />
						<span>Tu orden de preferencia:</span>
					</div>
					<div className="grid gap-2">
						{selectedAnswers.map((ans, idx: number) => (
							<div
								key={ans.answerId}
								className="flex items-center gap-3 p-2.5 bg-background border rounded-lg text-sm font-medium"
							>
								<span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
									{idx + 1}
								</span>
								<span className="text-foreground">{ans.answerText}</span>
							</div>
						))}
					</div>
				</div>
			);

		// --- CASO 4 & 5: SELECCIÓN SIMPLE Y MÚLTIPLE ---
		case "single_choice":
		case "multiple_choice":
			return (
				<div className="grid gap-2">
					{selectedAnswers.map((ans) => {
						// Determinamos el estado de evaluación (si aplica)
						const hasEvaluation = ans.isCorrect !== null;
						const isCorrectAnswer = ans.isCorrect === true;

						return (
							<div
								key={ans.answerId}
								className={cn(
									"flex items-center justify-between p-3 border rounded-lg text-sm transition-colors",
									hasEvaluation
										? isCorrectAnswer
											? "bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-300"
											: "bg-destructive/5 border-destructive/10 text-destructive"
										: "bg-muted/40 border-muted text-foreground",
								)}
							>
								<span className="font-medium">{ans.answerText}</span>

								{/* Feedback visual con iconos de éxito/error */}
								{hasEvaluation && (
									<div className="flex items-center gap-1.5 text-xs font-semibold shrink-0 ml-4">
										{isCorrectAnswer ? (
											<>
												<CheckCircle2 className="h-4 w-4 text-emerald-500" />
												<span className="hidden sm:inline text-emerald-600 dark:text-emerald-400">
													Correcta
												</span>
											</>
										) : (
											<>
												<XCircle className="h-4 w-4 text-destructive" />
												<span className="hidden sm:inline text-destructive">
													Incorrecta
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

		// --- CASO DEFECTO ---
		default:
			return (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<HelpCircle className="h-4 w-4" />
					<span>Tipo de respuesta desconocido.</span>
				</div>
			);
	}
}

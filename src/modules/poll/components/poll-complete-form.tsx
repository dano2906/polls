import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { submitPollAnswers } from "@/answers/actions/result";
import FormField, { FieldType } from "@/common/components/partials/form-field";
import { RankingField } from "@/common/components/partials/ranking-field";
import type { getPollDetails } from "@/poll/actions/poll";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { LoadingSwap } from "@/ui/loading-swap";
import { createDynamicResponseSchema, ensureMetadata } from "../lib/utils";

interface Props {
	pollData: Awaited<ReturnType<typeof getPollDetails>>;
	slug: string;
}

const PollCompleteForm = ({ pollData, slug }: Props) => {
	const [isFinished, setIsFinished] = useState(false);

	const defaultValues = pollData.questions.reduce(
		(acc: Record<string, any>, pq) => {
			if (pq.type === "multiple_choice") acc[pq.id] = [];
			else if (pq.type === "point_distribution") acc[pq.id] = {};
			else acc[pq.id] = "";
			return acc;
		},
		{},
	);
	// Construimos el esquema de Zod en base a las preguntas reales recibidas
	const dynamicFormSchema = createDynamicResponseSchema(pollData.questions);

	const form = useForm({
		defaultValues,
		validators: {
			onChange: dynamicFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				if (pollData.questions.length === 0) {
					throw new Error("Poll has no questions");
				}

				const cleanAnswers = Object.keys(value).reduce(
					(acc, key) => {
						const val = value[key];

						if (val === null || val === undefined) return acc;

						if (typeof val === "string" && val.trim() === "") return acc;

						if (Array.isArray(val)) {
							const activeChoices = val.filter(
								(id) => typeof id === "string" && id.trim() !== "",
							);
							if (activeChoices.length > 0) {
								acc[key] = activeChoices;
							}
							return acc;
						}

						if (typeof val === "object" && !Array.isArray(val)) {
							const cleanedObject = Object.fromEntries(
								Object.entries(val).map(([k, v]) => [
									k,
									v === "" ? 0 : Number(v),
								]),
							);
							acc[key] = cleanedObject;
							return acc;
						}

						acc[key] = val;
						return acc;
					},
					{} as Record<string, any>,
				); // Usamos 'any' o un tipo más amplio para aceptar el objeto de puntos

				// 2. Llamamos a la server action
				await submitPollAnswers({
					data: {
						pollId: pollData.questions[0].pollId,
						answers: cleanAnswers,
					},
				});

				// 3. Manejamos el éxito
				setIsFinished(true);
				toast.success("Tus respuestas fueron validadas y guardadas con éxito.");
			} catch (error) {
				console.error("Error al enviar la encuesta:", error);
				toast.error(
					"Hubo un problema al enviar tus respuestas. Inténtalo de nuevo.",
				);
			}
		},
	});

	if (isFinished) {
		return (
			<div className="p-8 text-center w-full">
				<h2 className="text-2xl font-bold text-success">¡Encuesta enviada!</h2>
				<p className="mt-2 text-foreground">
					Tus respuestas fueron validadas y guardadas con éxito.
				</p>
				<Link
					to="/p/$slug/result"
					params={{ slug }}
					className="mt-2 text-foreground underline"
				>
					Ver respuestas
				</Link>
			</div>
		);
	}

	return (
		<div className="w-full p-6 bg-background">
			<h2 className="text-3xl font-bold">{pollData.name}</h2>
			{pollData.description && (
				<p className="text-foreground mt-2 mb-6">{pollData.description}</p>
			)}

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				{pollData.questions.map((pq, index: number) => {
					const q = pq;

					const metadata = ensureMetadata(q.metadata);

					return (
						<ol key={q.id} className="p-3 rounded-xs bg-muted/50 space-y-3">
							<h6 className="text-lg font-medium text-muted-foreground">
								{index + 1}. {q.questionText}
								{q.isRequired && (
									<span className="text-destructive ml-1">*</span>
								)}
							</h6>
							<form.Field name={q.id}>
								{(field) => {
									switch (q.type) {
										case "open_answer":
											return (
												<li className="space-y-2 list-none">
													<FormField
														field={field}
														field_type={FieldType.TEXTAREA}
														label={q.questionText}
													/>
												</li>
											);
										case "single_choice":
											return (
												<li className="space-y-2 list-none">
													<FormField
														field={field}
														field_type={FieldType.RADIO}
														label="" // Question text already shown in h6 above
														options={q.answers.map((ans) => ({
															value: ans.id,
															label: ans.answerText,
														}))}
													/>
												</li>
											);
										case "multiple_choice": {
											const selectedCount =
												(field.state.value as string[])?.length || 0;
											const max = q.maxSelections ?? 0;
											const hasMaxLimit = max > 1;
											return (
												<li className="space-y-2 list-none">
													{hasMaxLimit && (
														<div className="flex items-center gap-2 mb-2">
															<Badge
																variant={
																	selectedCount >= max
																		? "destructive"
																		: "secondary"
																}
																className="font-normal"
															>
																{selectedCount} de {max} seleccionadas
																{selectedCount >= max && (
																	<span className="italic">
																		¡Límite alcanzado!
																	</span>
																)}
															</Badge>
														</div>
													)}

													{q.answers.map((ans) => {
														return (
															<FormField
																key={ans.id}
																field={field}
																field_type={FieldType.CHECKBOX}
																label={ans.answerText}
																disabled={
																	selectedCount >= max &&
																	hasMaxLimit &&
																	!(
																		(field.state.value as string[]) || []
																	).includes(ans.id)
																}
																overrideBindings={(f) => {
																	const currentArr =
																		(f.state.value as string[]) || [];
																	return {
																		value: currentArr.includes(ans.id),
																		onChange: () => {
																			const isChecked = currentArr.includes(
																				ans.id,
																			);

																			if (
																				!isChecked &&
																				hasMaxLimit &&
																				currentArr.length >= max
																			)
																				return;

																			const nextArr = isChecked
																				? currentArr.filter(
																						(id) => id !== ans.id,
																					)
																				: [...currentArr, ans.id];
																			f.handleChange(nextArr);
																		},
																	};
																}}
															/>
														);
													})}
												</li>
											);
										}
										case "point_distribution": {
											const limit = metadata?.distributionAmount ?? 100;
											const currentPoints =
												(field.state.value as Record<string, number>) || {};

											// Calculamos la suma total actual
											const total = Object.values(currentPoints).reduce(
												(sum, val) => sum + (Number(val) || 0),
												0,
											);

											return (
												<div className="space-y-4">
													<Badge
														className={`rounded-md text-sm font-medium ${total > limit ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}
													>
														{total} / {limit} puntos
													</Badge>

													<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
														{q.answers.map((ans) => (
															<FormField
																key={ans.id}
																field={field}
																field_type={FieldType.INPUT_NUMBER}
																label={ans.answerText}
																minLimit={0}
																maxLimit={
																	(Number(currentPoints[ans.id]) || 0) +
																	(limit - total)
																}
																overrideBindings={(f) => ({
																	// 1. Usar '??' en lugar de '||' y devolver "" por defecto.
																	// Esto permite que el input inicie vacío o se pueda borrar completamente.
																	value: currentPoints[ans.id] ?? "",

																	onChange: (e: any) => {
																		// 2. Prevenir errores si e.target no existe
																		// (algunas librerías de UI pasan el valor directamente en vez del evento)
																		const rawValue = e?.target
																			? e.target.value
																			: e;

																		// 3. Si el usuario borró todo, guardamos un string vacío temporalmente
																		if (rawValue === "") {
																			f.handleChange({
																				...currentPoints,
																				[ans.id]: "",
																			});
																			return;
																		}

																		// 4. Parsear el número. Si escriben letras o símbolos no válidos, ignoramos.
																		const parsedVal = parseInt(rawValue, 10);
																		if (Number.isNaN(parsedVal)) return;

																		// 5. Aplicar el límite inferior (0)
																		const finalVal = Math.max(0, parsedVal);

																		f.handleChange({
																			...currentPoints,
																			[ans.id]: finalVal,
																		});
																	},
																})}
															/>
														))}
													</div>
												</div>
											);
										}
										case "ranking":
											return (
												<div className="space-y-2">
													<p className="text-xs text-muted-foreground mb-3 italic">
														Arrastra las opcione para ordenarlas según tu
														preferencia.
													</p>
													<RankingField field={field} answers={q.answers} />
												</div>
											);
										case "rating": {
											return (
												<FormField
													field={field}
													field_type={FieldType.SLIDER}
													label=""
													minRating={metadata.minRating}
													maxRating={metadata.maxRating}
												/>
											);
										}
										case "date_single":
											return (
												<li className="space-y-2 list-none">
													<FormField
														field={field}
														field_type={FieldType.DATE_SINGLE}
														label=""
														minDate={metadata.minDate}
														maxDate={metadata.maxDate}
													/>
												</li>
											);
										case "date_range":
											return (
												<li className="space-y-2 list-none">
													<FormField
														field={field}
														field_type={FieldType.DATE_RANGE}
														label=""
														minDate={metadata.minDate}
														maxDate={metadata.maxDate}
													/>
												</li>
											);
										default:
											return (
												<li className="list-none">
													Tipo de pregunta no soportado
												</li>
											);
									}
								}}
							</form.Field>
						</ol>
					);
				})}

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => {
						return (
							<Button
								type="submit"
								disabled={!canSubmit || isSubmitting}
								className="w-full"
							>
								<LoadingSwap
									isLoading={isSubmitting}
									className="flex items-center gap-2"
								>
									<Save />
									{isSubmitting ? "Enviando respuestas..." : "Enviar Encuesta"}
								</LoadingSwap>
							</Button>
						);
					}}
				</form.Subscribe>
			</form>
		</div>
	);
};

export default PollCompleteForm;

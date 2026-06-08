import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { submitPollAnswers } from "@/answers/actions/result";
import FormField, { FieldType } from "@/common/components/partials/form-field";
import { RankingField } from "@/common/components/partials/ranking-field";
import type { getPollDetails } from "@/poll/actions/poll";
import type { QuestionMetadata } from "@/question/shared/types";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { LoadingSwap } from "@/ui/loading-swap";
import { createDynamicResponseSchema } from "../lib/utils";

interface Props {
	pollData: Awaited<ReturnType<typeof getPollDetails>>;
	slug: string;
}

const PollCompleteForm = ({ pollData, slug }: Props) => {
	const [isFinished, setIsFinished] = useState(false);
	// Inicializamos los valores por defecto del formulario según el tipo de pregunta
	const defaultValues = pollData.questions.reduce(
		(acc: Record<string, Array<unknown> | string>, pq) => {
			acc[pq.id] = pq.type === "multiple_choice" ? [] : "";
			return acc;
		},
		{},
	);

	// Construimos el esquema de Zod en base a las preguntas reales recibidas
	const dynamicFormSchema = createDynamicResponseSchema(pollData.questions);
	const completePollMutation = useMutation({
		mutationKey: ["complete", slug],
		mutationFn: async (values: Record<string, Array<string> | string>) => {
			if (pollData.questions.length === 0) {
				throw new Error("Poll has no questions");
			}
			return submitPollAnswers({
				data: {
					pollId: pollData.questions[0].pollId,
					answers: values,
				},
			});
		},
		onSuccess: async () => {
			setIsFinished(true);
			toast.success("Tus respuestas fueron validadas y guardadas con éxito.");
		},
	});
	const form = useForm({
		defaultValues,
		validators: {
			onChange: dynamicFormSchema,
		},
		onSubmit: async ({ value }) => {
			const cleanAnswers = Object.fromEntries(
				Object.entries(value).filter(([_, value]) => {
					if (typeof value === "string" && value.trim() === "") {
						return false;
					}
					if (Array.isArray(value)) {
						const activeChoices = value.filter(
							(id) => typeof id === "string" && id.trim() !== "",
						);
						return activeChoices.length > 0;
					}

					// 3. Si es null o undefined, lo descartamos
					if (value === null || value === undefined) {
						return false;
					}

					return true;
				}),
			) as Record<string, string | string[]>;
			return await completePollMutation.mutateAsync(cleanAnswers);
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
					let metadata: QuestionMetadata = {};
					if (q.metadata) {
						try {
							metadata =
								typeof q.metadata === "string"
									? JSON.parse(q.metadata)
									: q.metadata;
						} catch (e) {
							console.error("Error parseando metadata en el render:", e);
						}
					}
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

													{/* Tu mapa de checkboxes que ya tenías */}
													{q.answers.map((ans) => {
														return (
															<FormField
																key={ans.id}
																field={field}
																field_type={FieldType.CHECKBOX}
																label={ans.answerText}
																// Si quieres deshabilitar los que no están marcados cuando llega al tope:
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

																			// Validación extra: No dejar agregar más si ya llegó al máximo
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
											const metadata = q.metadata || {};

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

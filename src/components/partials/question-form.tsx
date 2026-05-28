/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Download, Plus, Save, Trash } from "lucide-react";
import { toast } from "sonner";
import type z from "zod";
import { createQuestions, saveQuestionsBatch } from "#/actions/question";
import { ExportFormat, type NewQuestion } from "#/shared/types";
import { questionsBatchSchema } from "#/shared/validation";
import { Button } from "../ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardTitle,
} from "../ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FieldSet } from "../ui/field";
import { LoadingSwap } from "../ui/loading-swap";
import { Slider } from "../ui/slider";
import ExportMenuButton from "./export-menu-button";
import FormField, { FieldType } from "./form-field";
import GenerateQuestionsButton from "./generate-questions-button";

interface Props {
	slug: string | null;
	pollDescription?: string | null;
	initialData?: NewQuestion[];
}

type QuestionBatchInput = z.infer<typeof questionsBatchSchema>;

const QuestionForm = ({ slug, initialData, pollDescription }: Props) => {
	const isEditing = !!initialData;
	const router = useRouter();
	const questionMutation = useMutation({
		mutationKey: [isEditing ? "update" : "create", "question"],
		mutationFn: async (values: QuestionBatchInput) => {
			if (isEditing) {
				return saveQuestionsBatch({ data: values });
			}
			return await createQuestions({ data: values });
		},
		onSuccess: async () => {
			await router.invalidate();
			toast.success(
				isEditing
					? "Se han editado las preguntas y las respuestas correctamente."
					: "Se han guardado las preguntas y las respuestas correctamente.",
			);
		},
		onError: () => toast.error("Hubo un error al guardar."),
	});

	const form = useForm({
		defaultValues: {
			slug,
			questions:
				initialData && initialData.length > 0
					? initialData.map((q) => {
							const base = {
								id: q.id,
								questionText: q.questionText ?? "",
								isRequired: q.isRequired ?? true,
							};

							if (q.type === "open_answer" || q.type === "rating") {
								return {
									...base,
									type: q.type,
									hasCorrectAnswers: false as const,
									maxSelections: 1 as const,
									answers: [] as [],
									...(q.type === "rating"
										? {
												minValue: q.minValue ?? 1,
												maxValue: q.maxValue ?? 5,
											}
										: {}),
								};
							}

							return {
								...base,
								type: q.type,
								hasCorrectAnswers: q.hasCorrectAnswers ?? false,
								maxSelections: q.maxSelections ?? 1,
								answers:
									q.answers?.map((a) => ({
										id: a.id,
										answerText: a.answerText ?? "",
										isCorrect: a.isCorrect ?? false,
									})) || [],
							};
						})
					: [
							{
								type: "single_choice" as const,
								questionText: "",
								hasCorrectAnswers: false,
								isRequired: true,
								maxSelections: 1,
								answers: [{ answerText: "", isCorrect: false }],
							},
						],
		} as QuestionBatchInput,
		validators: {
			onChange: questionsBatchSchema,
		},
		onSubmit: async ({ value }) => {
			const cleanedValues = {
				...value,
				questions: value.questions.map((q) => {
					if (q.type === "open_answer" || q.type === "rating") {
						return {
							...q,
							type: q.type,
							answers: [] as [],
							hasCorrectAnswers: false as const,
							maxSelections: 1 as const,
						};
					}
					if (q.type !== "multiple_choice") {
						return {
							...q,
							type: q.type,
							maxSelections: 1 as const,
						};
					}
					return {
						...q,
						type: q.type,
					};
				}) as QuestionBatchInput["questions"],
			};

			await questionMutation.mutateAsync(cleanedValues);
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className={
				!slug && !isEditing ? "opacity-70 cursor-not-allowed" : "opacity-100"
			}
		>
			<form.Subscribe
				selector={(state) => [
					state.canSubmit,
					state.isSubmitting,
					state.errors,
				]}
			>
				{([canSubmit, _isSubmitting, _errors]) => (
					<FieldSet disabled={!slug && !isEditing} className="space-y-4">
						<form.Field name="questions" mode="array">
							{(field) => (
								<div className="space-y-4">
									{field.state.value.map((_, i) => (
										<Card
											key={`${i}`}
											className="p-4 border border-dashed shadow-sm relative"
										>
											<CardTitle className="text-xl font-sg font-medium mb-4">
												Pregunta {i + 1}
											</CardTitle>
											<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
												{/* TEXTO DE LA PREGUNTA */}
												<form.Field name={`questions[${i}].questionText`}>
													{(subField) => (
														<FormField
															field={subField}
															field_type={FieldType.INPUT_TEXT}
															label="Texto de la pregunta"
															required
															input_classes="col-span-2"
														/>
													)}
												</form.Field>

												{/* SELECTOR DE TIPO DE PREGUNTA */}
												<form.Field name={`questions[${i}].type`}>
													{(typeField) => (
														<>
															<FormField
																field={typeField}
																field_type={FieldType.SELECT}
																label="Tipo de pregunta"
																required
																options={[
																	{
																		label: "Selección simple",
																		value: "single_choice",
																	},
																	{
																		label: "Selección múltiple",
																		value: "multiple_choice",
																	},
																	{
																		label: "Respuesta abierta",
																		value: "open_answer",
																	},
																	{
																		label: "Ordenamiento / Ranking",
																		value: "ranking",
																	},
																	{
																		label:
																			"Escala de valoración / Calificación",
																		value: "rating",
																	},
																]}
															/>

															{/* CONFIGURACIONES DINÁMICAS DEPENDIENDO DEL TIPO */}

															{/* Cantidad máxima: Solo visible si es selección múltiple */}
															{typeField.state.value === "multiple_choice" && (
																<form.Field
																	name={`questions[${i}].maxSelections`}
																>
																	{(configSubField) => (
																		<FormField
																			field={configSubField}
																			field_type={FieldType.INPUT_NUMBER}
																			label="Cantidad máxima de respuestas seleccionables"
																			input_classes="col-span-1"
																		/>
																	)}
																</form.Field>
															)}

															{/* ¿Contiene respuesta correcta?: Solo aplica a selección */}
															{["single_choice", "multiple_choice"].includes(
																typeField.state.value,
															) && (
																<form.Field
																	name={`questions[${i}].hasCorrectAnswers`}
																>
																	{(subField) => (
																		<FormField
																			field={subField}
																			field_type={FieldType.CHECKBOX}
																			label="¿Contiene alguna respuesta correcta?"
																		/>
																	)}
																</form.Field>
															)}

															{/* Obligatoriedad: Común para todos */}
															<form.Field name={`questions[${i}].isRequired`}>
																{(configSubField) => (
																	<FormField
																		field={configSubField}
																		field_type={FieldType.CHECKBOX}
																		label="¿Es una pregunta obligatoria?"
																		input_classes="col-span-1"
																	/>
																)}
															</form.Field>

															{/* CASO 1: SECTOR DE CALIFICACIÓN (RATING) -> SLIDER DE RANGO */}
															{typeField.state.value === "rating" && (
																<div className="w-full col-span-2 p-4 border border-border border-dashed rounded-md bg-muted/20 space-y-3 mt-2">
																	<div className="text-sm font-medium text-muted-foreground">
																		Configuración del rango de puntuación
																	</div>

																	<form.Field name={`questions[${i}].minValue`}>
																		{(minField) => (
																			<form.Field
																				name={`questions[${i}].maxValue`}
																			>
																				{(maxField) => {
																					const currentMin =
																						minField.state.value ?? 1;
																					const currentMax =
																						maxField.state.value ?? 5;

																					return (
																						<div className="space-y-4 pt-2">
																							<div className="flex justify-between text-xs font-semibold text-foreground px-1">
																								<span>
																									Mínimo: {currentMin}
																								</span>
																								<span>
																									Máximo: {currentMax}
																								</span>
																							</div>
																							<Slider
																								defaultValue={[
																									currentMin,
																									currentMax,
																								]}
																								min={0}
																								max={10}
																								step={1}
																								minStepsBetweenThumbs={1}
																								onValueChange={(values) => {
																									if (values.length === 2) {
																										minField.setValue(
																											values[0],
																										);
																										maxField.setValue(
																											values[1],
																										);
																									}
																								}}
																							/>
																							<p className="text-[11px] text-muted-foreground italic">
																								El usuario interactuará con una
																								escala del {currentMin} al{" "}
																								{currentMax}.
																							</p>
																						</div>
																					);
																				}}
																			</form.Field>
																		)}
																	</form.Field>
																</div>
															)}

															{/* CASO 2: SECCIÓN DE RESPUESTAS DINÁMICA (Solo para tipos que requieran opciones) */}
															{[
																"single_choice",
																"multiple_choice",
																"ranking",
															].includes(typeField.state.value) && (
																<form.Field
																	name={`questions[${i}].answers`}
																	mode="array"
																>
																	{(answersField) => (
																		<div className="w-full col-span-2 p-2 border border-border border-dashed grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
																			<div className="col-span-2 text-sm font-medium text-muted-foreground mb-1">
																				{typeField.state.value === "ranking"
																					? "Opciones a ordenar (El usuario las arrastrará para ordenarlas)"
																					: "Opciones de respuesta"}
																			</div>

																			{answersField.state.meta.errors.length >
																				0 && (
																				<div className="col-span-2 p-2 bg-destructive/10 text-destructive text-xs rounded font-semibold">
																					{answersField.state.meta.errors
																						.map((err) => err?.message)
																						.join(", ")}
																				</div>
																			)}

																			{answersField.state.value?.map(
																				(_, ai) => (
																					<div
																						key={`${i}-${ai}`}
																						className="w-full grid grid-cols-1 gap-3 items-center bg-primary-foreground/15 p-4 rounded shadow relative group"
																					>
																						<CardTitle className="text-sm font-sg font-medium col-span-1 text-muted-foreground">
																							Opción {ai + 1}
																						</CardTitle>

																						<form.Field
																							name={`questions[${i}].answers[${ai}].answerText`}
																						>
																							{(answerSubField) => (
																								<FormField
																									field={answerSubField}
																									field_type={
																										FieldType.INPUT_TEXT
																									}
																									label="Texto de la opción"
																									required
																								/>
																							)}
																						</form.Field>

																						{/* Checkbox de 'Correcta' solo si aplica y está activo */}
																						{[
																							"single_choice",
																							"multiple_choice",
																						].includes(typeField.state.value) &&
																							form.getFieldValue(
																								`questions[${i}].hasCorrectAnswers`,
																							) && (
																								<form.Field
																									name={`questions[${i}].answers[${ai}].isCorrect`}
																								>
																									{(answerSubField) => (
																										<FormField
																											field={answerSubField}
																											field_type={
																												FieldType.CHECKBOX
																											}
																											label="¿Es respuesta correcta?"
																										/>
																									)}
																								</form.Field>
																							)}

																						<div className="w-full flex items-center justify-end col-span-1 mt-2">
																							<Button
																								type="button"
																								variant="destructive"
																								size="sm"
																								onClick={() =>
																									answersField.removeValue(ai)
																								}
																								disabled={
																									answersField.state.value
																										.length <= 1 ||
																									questionMutation.isPending
																								}
																							>
																								<Trash className="h-4 w-4" />
																							</Button>
																						</div>
																					</div>
																				),
																			)}

																			<div className="w-full flex items-center justify-end gap-2 col-span-2 mt-2">
																				<Button
																					type="button"
																					variant="outline"
																					size="sm"
																					disabled={questionMutation.isPending}
																					onClick={() =>
																						answersField.pushValue({
																							id: null,
																							answerText: "",
																							isCorrect: false,
																						})
																					}
																				>
																					<Plus className="h-4 w-4" />
																				</Button>
																			</div>
																		</div>
																	)}
																</form.Field>
															)}
														</>
													)}
												</form.Field>
											</CardContent>

											<CardFooter className="col-span-2 flex items-center justify-end gap-2">
												<CardAction>
													<Button
														variant={"destructive"}
														type="button"
														onClick={() => field.removeValue(i)}
														disabled={
															field.state.value.length <= 1 ||
															questionMutation.isPending
														}
													>
														<Trash className="h-4 w-4" />
													</Button>
												</CardAction>
											</CardFooter>
										</Card>
									))}

									{/* ACCIONES DEL FORMULARIO GENERAL */}
									<div className="w-full flex items-center justify-end gap-2 pt-4">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="secondary">
													<Download />
													Exportar
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent>
												<DropdownMenuGroup>
													{Object.values(ExportFormat).map((f) => {
														return (
															<DropdownMenuItem key={f} asChild>
																<ExportMenuButton
																	format={f}
																	slug={slug as string}
																/>
															</DropdownMenuItem>
														);
													})}
												</DropdownMenuGroup>
											</DropdownMenuContent>
										</DropdownMenu>
										<GenerateQuestionsButton
											pollDescription={pollDescription}
											addQuestion={field.pushValue}
										/>
										<Button
											type="button"
											variant={"secondary"}
											disabled={questionMutation.isPending}
											onClick={() =>
												field.pushValue({
													type: "single_choice",
													questionText: "",
													hasCorrectAnswers: false,
													isRequired: false,
													maxSelections: 1,
													answers: [],
												})
											}
										>
											<Plus className="h-4 w-4 mr-2" />
											Agregar pregunta
										</Button>
										<Button
											type="submit"
											variant={"default"}
											disabled={
												!canSubmit ||
												questionMutation.isPending ||
												field.state.value.length === 0
											}
										>
											<LoadingSwap
												isLoading={questionMutation.isPending}
												className="flex items-center gap-2"
											>
												<Save className="h-4 w-4 mr-2" />
												{isEditing ? "Actualizar cambios" : "Guardar preguntas"}
											</LoadingSwap>
										</Button>
									</div>
								</div>
							)}
						</form.Field>
					</FieldSet>
				)}
			</form.Subscribe>
		</form>
	);
};

export default QuestionForm;

/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Download, Plus, Save, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type z from "zod";
import { deleteImagesFromCloudinary } from "@/common/actions/cloudinary";
import FormField, { FieldType } from "@/common/components/partials/form-field";
import ImageUploader from "@/common/components/partials/form-image-uploader";
import { uploadToCloudinary } from "@/common/lib/utils";
import { ExportFormat } from "@/common/shared/types";
import type { getPollDetails } from "@/poll/actions/poll";
import ExportMenuButton from "@/poll/components/export-menu-button";
import {
	createQuestions,
	saveQuestionsBatch,
} from "@/question/actions/question";
import { questionsBatchSchema } from "@/question/lib/validation";
import type { QuestionMetadata } from "@/question/shared/types";
import { Button } from "@/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardTitle,
} from "@/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { FieldSet } from "@/ui/field";
import { LoadingSwap } from "@/ui/loading-swap";
import { Slider } from "@/ui/slider";
import GenerateQuestionsButton from "./generate-questions-button";

interface Props {
	slug: string | null;
	pollDescription?: string | null;
	initialData?: Awaited<ReturnType<typeof getPollDetails>>["questions"];
}

type QuestionBatchInput = z.infer<typeof questionsBatchSchema>;

const OPTION_TYPES = [
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
		label: "Escala de valoración / Calificación",
		value: "rating",
	},
	{
		label: "Fecha simple",
		value: "date_single",
	},
	{
		label: "Fecha rango",
		value: "date_range",
	},
];

const QuestionForm = ({ slug, initialData, pollDescription }: Props) => {
	const isEditing = !!initialData;
	const router = useRouter();
	const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
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
							let meta: QuestionMetadata = {};
							if (q.metadata) {
								try {
									meta =
										typeof q.metadata === "string"
											? JSON.parse(q.metadata)
											: q.metadata;
								} catch (e) {
									console.error("Error parseando metadata de la pregunta:", e);
								}
							}
							const base = {
								id: q.id,
								questionText: q.questionText ?? "",
								isRequired: q.isRequired ?? true,
								imageUrl: q.imageUrl ?? null,
								imagePublicId: q.imagePublicId ?? null,
							};

							if (
								q.type === "open_answer" ||
								q.type === "rating" ||
								q.type === "date_single" ||
								q.type === "date_range"
							) {
								return {
									...base,
									type: q.type,
									hasCorrectAnswers: false as const,
									maxSelections: 1 as const,
									answers: [] as [],
									...(q.type === "rating"
										? {
												minValue: meta.minRating ?? 1,
												maxValue: meta.maxRating ?? 5,
											}
										: {}),
									...(q.type === "date_single" || q.type === "date_range"
										? {
												minDate: meta.minDate ?? null,
												maxDate: meta.maxDate ?? null,
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
										imageUrl: a.imageUrl ?? null,
										imagePublicId: a.imagePublicId ?? null,
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
								imageUrl: null,
								imagePublicId: null,
								answers: [{ answerText: "", isCorrect: false }],
							},
						],
		} as QuestionBatchInput,
		validators: {
			onChange: questionsBatchSchema,
		},
		onSubmit: async ({ value }) => {
			toast.loading("Guardando cambios y procesando imágenes...", {
				id: "save-questions",
			});
			try {
				// 1. Subir imágenes nuevas de preguntas Y respuestas
				const cleanedQuestions = await Promise.all(
					value.questions.map(async (q: any) => {
						let imageUrl = q.imageUrl ?? null;
						let imagePublicId = q.imagePublicId ?? null;

						// Subir imagen de la PREGUNTA si existe archivo local
						if (q._localFile instanceof File) {
							try {
								const uploaded = await uploadToCloudinary(q._localFile);
								imageUrl = uploaded.url;
								imagePublicId = uploaded.publicId;
							} catch {
								throw new Error("Error al subir una nueva imagen de pregunta.");
							}
						}

						const baseCleaned = {
							id: q.id || undefined,
							questionText: q.questionText,
							isRequired: !!q.isRequired,
							imageUrl,
							imagePublicId,
						};

						if (q.type === "open_answer") {
							return {
								...baseCleaned,
								type: "open_answer" as const,
								hasCorrectAnswers: false as const,
								maxSelections: 1 as const,
								answers: [] as [],
							};
						}

						if (q.type === "rating") {
							return {
								...baseCleaned,
								type: "rating" as const,
								hasCorrectAnswers: false as const,
								maxSelections: 1 as const,
								answers: [] as [],
								minValue: Number(q.minValue ?? 1),
								maxValue: Number(q.maxValue ?? 5),
							};
						}

						if (q.type === "date_single" || q.type === "date_range") {
							return {
								...baseCleaned,
								type: q.type,
								hasCorrectAnswers: false as const,
								maxSelections: 1 as const,
								answers: [] as [],
								minDate: q.minDate || null,
								maxDate: q.maxDate || null,
							};
						}

						// 🆕 Procesar las imágenes de las RESPUESTAS en paralelo
						const cleanedAnswers = await Promise.all(
							(q.answers || []).map(async (a: any) => {
								let ansImageUrl = a.imageUrl ?? null;
								let ansImagePublicId = a.imagePublicId ?? null;

								// Subir imagen de la RESPUESTA si existe archivo local
								if (a._localFile instanceof File) {
									try {
										const uploaded = await uploadToCloudinary(a._localFile);
										ansImageUrl = uploaded.url;
										ansImagePublicId = uploaded.publicId;
									} catch {
										throw new Error("Error al subir una imagen de respuesta.");
									}
								}

								return {
									id: a.id || undefined,
									answerText: a.answerText ?? "",
									isCorrect: !!a.isCorrect,
									imageUrl: ansImageUrl,
									imagePublicId: ansImagePublicId,
								};
							}),
						);

						return {
							...baseCleaned,
							type: q.type,
							hasCorrectAnswers: q.hasCorrectAnswers ?? false,
							maxSelections:
								q.type === "multiple_choice" ? Number(q.maxSelections ?? 1) : 1,
							answers: cleanedAnswers,
						};
					}),
				);

				const cleanedValues = {
					slug: value.slug,
					questions: cleanedQuestions,
				};

				// 2. Guardar en Base de Datos
				await questionMutation.mutateAsync(cleanedValues);

				// 3. Limpieza física en Cloudinary (Borra tanto de preguntas como de respuestas acumuladas)
				if (imagesToDelete.length > 0) {
					await deleteImagesFromCloudinary({
						data: {
							publicIds: imagesToDelete,
						},
					});
					setImagesToDelete([]);
				}

				toast.dismiss("save-questions");
			} catch (error: any) {
				toast.dismiss("save-questions");
				toast.error(error.message || "Hubo un fallo al procesar los archivos.");
			}
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
												<form.Field name={`questions[${i}]._localFile` as any}>
													{(subField) => (
														<div className="w-full col-span-2">
															<ImageUploader
																currentImageUrl={form.getFieldValue(
																	`questions[${i}].imageUrl`,
																)}
																currentPublicId={form.getFieldValue(
																	`questions[${i}].imagePublicId`,
																)}
																onFileSelected={(file) =>
																	subField.handleChange(file as any)
																}
																onImageRemoved={() => {
																	const pid = form.getFieldValue(
																		`questions[${i}].imagePublicId`,
																	);
																	if (pid) {
																		// Encolamos el publicId para borrarlo de Cloudinary al hacer submit exitoso
																		setImagesToDelete((prev) => [...prev, pid]);
																	}

																	// Limpiamos los campos correspondientes dentro del estado del formulario
																	form.setFieldValue(
																		`questions[${i}].imageUrl`,
																		null,
																	);
																	form.setFieldValue(
																		`questions[${i}].imagePublicId`,
																		null,
																	);
																}}
															/>
														</div>
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
																options={OPTION_TYPES}
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

															{["date_single", "date_range"].includes(
																typeField.state.value,
															) && (
																<div className="grid grid-cols-2 gap-4 col-span-2">
																	<form.Field name={`questions[${i}].minDate`}>
																		{(configSubField) => (
																			<FormField
																				field={configSubField}
																				field_type={
																					FieldType.DATE_SINGLE || "date"
																				}
																				label="Fecha mínima permitida (Opcional)"
																				input_classes="w-full"
																			/>
																		)}
																	</form.Field>

																	<form.Field name={`questions[${i}].maxDate`}>
																		{(configSubField) => (
																			<FormField
																				field={configSubField}
																				field_type={
																					FieldType.DATE_SINGLE || "date"
																				}
																				label="Fecha máxima permitida (Opcional)"
																				input_classes="w-full"
																			/>
																		)}
																	</form.Field>
																</div>
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
																						<form.Field
																							name={
																								`questions[${i}].answers[${ai}]._localFile` as any
																							}
																						>
																							{(subField) => (
																								<div className="w-full">
																									<ImageUploader
																										currentImageUrl={form.getFieldValue(
																											`questions[${i}].answers[${ai}].imageUrl`,
																										)}
																										currentPublicId={form.getFieldValue(
																											`questions[${i}].answers[${ai}].imagePublicId`,
																										)}
																										onFileSelected={(file) =>
																											subField.handleChange(
																												file as any,
																											)
																										}
																										onImageRemoved={() => {
																											const pid =
																												form.getFieldValue(
																													`questions[${i}].answers[${ai}].imagePublicId`,
																												);
																											if (pid) {
																												// Encolamos el publicId para borrarlo al hacer submit exitoso
																												setImagesToDelete(
																													(prev) => [
																														...prev,
																														pid,
																													],
																												);
																											}

																											// Limpiamos los campos en el estado del formulario de manera unificada
																											form.setFieldValue(
																												`questions[${i}].answers[${ai}].imageUrl`,
																												null,
																											);
																											form.setFieldValue(
																												`questions[${i}].answers[${ai}].imagePublicId`,
																												null,
																											);
																										}}
																									/>
																								</div>
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

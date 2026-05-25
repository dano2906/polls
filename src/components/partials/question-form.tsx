/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
import { useForm } from "@tanstack/react-form-start";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Plus, Save, Trash } from "lucide-react";
import { toast } from "sonner";
import { createQuestions, saveQuestionsBatch } from "#/actions/question";
import type { NewQuestion, NewQuestionBatch } from "#/shared/types";
import { questionsBatchSchema } from "#/shared/validation";
import { Button } from "../ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardTitle,
} from "../ui/card";
import { FieldSet } from "../ui/field";
import { LoadingSwap } from "../ui/loading-swap";
import FormField, { FieldType } from "./form-field";
import GenerateQuestionsButton from "./generate-questions-button";

interface Props {
	slug: string | null;
	pollDescription?: string | null;
	initialData?: NewQuestion[];
}

const QuestionForm = ({ slug, initialData, pollDescription }: Props) => {
	const isEditing = !!initialData;
	const router = useRouter();
	const questionMutation = useMutation({
		mutationKey: [isEditing ? "update" : "create", "question"],
		mutationFn: async (values: NewQuestionBatch) => {
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
			questions: initialData?.map((q) => ({
				...q,
				hasCorrectAnswers: q.hasCorrectAnswers ?? false,
				answers: q.answers.map((a) => ({
					id: a.id,
					answerText: a.answerText,
					isCorrect: a.isCorrect,
				})),
			})) || [
				{
					type: "single_choice" as const,
					questionText: "",
					hasCorrectAnswers: false,
					isRequired: false,
					maxSelections: 1,
					answers: [{ answerText: "", isCorrect: false }],
				},
			],
			slug,
		} as NewQuestionBatch,
		validators: {
			onSubmit: questionsBatchSchema,
		},
		onSubmit: async ({ value }) => {
			await questionMutation.mutateAsync(value);
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
				// biome-ignore lint/correctness/noChildrenProp: <explanation>
				children={([canSubmit]) => (
					<FieldSet disabled={!slug && !isEditing} className="space-y-4">
						<form.Field name="questions" mode="array">
							{(field) => (
								<div className="space-y-4">
									{field.state.value.map((_, i) => (
										<Card
											key={`${i}`}
											className="p-4 border border-dashed shadow-sm relative"
										>
											<CardTitle className="text-xl font-sg font-medium">
												Pregunta {i + 1}
											</CardTitle>
											<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

												<form.Field name={`questions[${i}].type`}>
													{(subField) => (
														<FormField
															field={subField}
															field_type={FieldType.SELECT}
															label="Tipo de pregunta"
															required
															options={[
																{
																	label: "Respuesta simple",
																	value: "single_choice",
																},
																{
																	label: "Respuesta múltiple",
																	value: "multiple_choice",
																},
															]}
														/>
													)}
												</form.Field>

												<form.Field name={`questions[${i}].maxSelections`}>
													{(configSubField) => (
														<FormField
															field={configSubField}
															field_type={FieldType.INPUT_NUMBER}
															label="Cantidad máxima de respuestas seleccionables"
															input_classes="col-span-1"
														/>
													)}
												</form.Field>
												<form.Field name={`questions[${i}].hasCorrectAnswers`}>
													{(subField) => (
														<FormField
															field={subField}
															field_type={FieldType.CHECKBOX}
															label="¿Contiene alguna respuesta correcta?"
														/>
													)}
												</form.Field>
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

												<form.Field
													name={`questions[${i}].answers`}
													mode="array"
												>
													{(answersField) => (
														<div className="w-full col-span-2 p-2 border border-border border-dashed grid grid-cols-1 md:grid-cols-2 gap-2">
															{answersField.state.value.map((_, ai) => (
																<div
																	key={`${i}-${ai}`}
																	className="w-full grid grid-cols-1 gap-4 items-center bg-primary-foreground/15 p-4 rounded shadow"
																>
																	<CardTitle className="text-xl font-sg font-medium col-span-1">
																		Respuesta {ai + 1}
																	</CardTitle>
																	<form.Field
																		name={`questions[${i}].answers[${ai}].answerText`}
																	>
																		{(answerSubField) => (
																			<FormField
																				field={answerSubField}
																				field_type={FieldType.INPUT_TEXT}
																				label="Texto de la respuesta"
																				required
																			/>
																		)}
																	</form.Field>
																	<form.Field
																		name={`questions[${i}].answers[${ai}].isCorrect`}
																	>
																		{(answerSubField) => (
																			<FormField
																				field={answerSubField}
																				field_type={FieldType.CHECKBOX}
																				label="¿Es una respuesta correcta?"
																			/>
																		)}
																	</form.Field>
																	<div className="w-full flex items-center justify-end gap-2 col-span-1">
																		<Button
																			type="button"
																			variant="destructive"
																			onClick={() =>
																				answersField.removeValue(ai)
																			}
																			className="w-fit"
																			disabled={
																				answersField.state.value.length <= 1 ||
																				questionMutation.isPending
																			}
																		>
																			<Trash />
																			Eliminar respuesta
																		</Button>
																	</div>
																</div>
															))}

															<div className="w-full flex items-center justify-end gap-2 col-span-2">
																<Button
																	type="button"
																	variant="outline"
																	disabled={questionMutation.isPending}
																	onClick={() =>
																		answersField.pushValue({
																			id: null,
																			answerText: "",
																			isCorrect: false,
																		})
																	}
																>
																	<Plus /> Agregar respuesta
																</Button>
															</div>
														</div>
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
														<Trash /> Eliminar pregunta
													</Button>
												</CardAction>
											</CardFooter>
										</Card>
									))}
									<div className="w-full flex items-center justify-end gap-2">
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
													answers: [
														{
															answerText: "",
															isCorrect: false,
														},
													],
												})
											}
										>
											<Plus />
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
												<Save />
												{isEditing ? "Actualizar cambios" : "Guardar preguntas"}
											</LoadingSwap>
										</Button>
									</div>
								</div>
							)}
						</form.Field>
					</FieldSet>
				)}
			/>
		</form>
	);
};

export default QuestionForm;

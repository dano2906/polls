/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
import { useForm } from "@tanstack/react-form-start";
import { useMutation } from "@tanstack/react-query";
import { Plus, Save, Trash } from "lucide-react";
import { toast } from "sonner";
import { createQuestions } from "#/actions/question";
import type { NewQuestionBatch } from "#/shared/types";
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

interface Props {
	pollId: string;
}

const CreateQuestionForm = ({ pollId }: Props) => {
	const defaultValues: NewQuestionBatch = {
		questions: [
			{
				type: "single_choice",
				questionText: "",
				hasCorrectAnswer: false,
				isRequired: false,
				maxSelections: 1,
				answers: [
					{
						answerText: "",
						isCorrect: false,
					},
				],
			},
		],
		pollId,
	};
	const createQuestionsMutation = useMutation({
		mutationKey: ["create", "question"],
		mutationFn: async (values: NewQuestionBatch) =>
			await createQuestions({ data: values }),
		onSuccess: () => {
			toast.success(
				"Se han guardado las preguntas y las respuestas correctamente.",
			);
		},
	});
	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: questionsBatchSchema,
		},
		onSubmit: async ({ value }) => {
			await createQuestionsMutation.mutateAsync(value);
		},
	});
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			className={!pollId ? "opacity-70 cursor-not-allowed" : "opacity-100"}
		>
			<form.Subscribe
				selector={(state) => [
					state.canSubmit,
					state.isSubmitting,
					state.errors,
				]}
				// biome-ignore lint/correctness/noChildrenProp: <explanation>
				children={([canSubmit]) => (
					<FieldSet disabled={!pollId} className="space-y-4">
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
															requried
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
															requried
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
												<form.Field name={`questions[${i}].hasCorrectAnswer`}>
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
																				requried
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
																				answersField.state.value.length <= 1
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
																	onClick={() =>
																		answersField.pushValue({
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
														disabled={field.state.value.length <= 1}
													>
														<Trash /> Eliminar pregunta
													</Button>
												</CardAction>
											</CardFooter>
										</Card>
									))}
									<div className="w-full flex items-center justify-end gap-2">
										<Button
											type="button"
											variant={"secondary"}
											onClick={() =>
												field.pushValue({
													type: "single_choice",
													questionText: "",
													hasCorrectAnswer: false,
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
											onClick={() => form.handleSubmit()}
											disabled={!canSubmit}
										>
											<LoadingSwap
												isLoading={createQuestionsMutation.isPending}
												className="flex items-center gap-2"
											>
												<Save />
												Guardar preguntas y respuestas
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

export default CreateQuestionForm;

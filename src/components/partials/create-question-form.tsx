/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
import { useForm } from "@tanstack/react-form-start";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash } from "lucide-react";
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
import { LoadingSwap } from "../ui/loading-swap";
import FormField, { FieldType } from "./form-field";

interface Props {
	pollId: string | null;
}

const CreateQuestionForm = ({ pollId }: Props) => {
	const defaultValues: NewQuestionBatch = {
		questions: [
			{
				type: "single_choice",
				text: "",
				hasCorrectAnswer: false,
				config: { isRequired: true, maxSelections: 1 },
			},
		],
	};
	const createQuestionsMutation = useMutation({
		mutationKey: ["create", "question"],
		mutationFn: async (values: NewQuestionBatch) =>
			await createQuestions({ data: values }),
	});
	const form = useForm({
		defaultValues,
		validators: {
			onChange: questionsBatchSchema,
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
		>
			<form.Subscribe
				selector={(state) => [
					state.canSubmit,
					state.isSubmitting,
					state.errors,
				]}
				// biome-ignore lint/correctness/noChildrenProp: <explanation>
				children={([canSubmit]) => (
					<fieldset className="space-y-4">
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
												<form.Field name={`questions[${i}].text`}>
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

												<form.Field
													name={`questions[${i}].config.maxSelections`}
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
												<form.Field name={`questions[${i}].hasCorrectAnswer`}>
													{(subField) => (
														<FormField
															field={subField}
															field_type={FieldType.CHECKBOX}
															label="¿Contiene alguna respuesta correcta?"
														/>
													)}
												</form.Field>
												<form.Field name={`questions[${i}].config.isRequired`}>
													{(configSubField) => (
														<FormField
															field={configSubField}
															field_type={FieldType.CHECKBOX}
															label="¿Es una pregunta obligatoria?"
															input_classes="col-span-1"
														/>
													)}
												</form.Field>
											</CardContent>

											<CardFooter className="col-span-2 flex items-center justify-end">
												<CardAction>
													<Button
														variant={"destructive"}
														type="button"
														onClick={() => field.removeValue(i)}
														disabled={field.state.value.length <= 1}
													>
														<Trash /> Eliminar
													</Button>
												</CardAction>
											</CardFooter>
										</Card>
									))}
									<div className="w-full flex justify-end">
										<Button
											type="button"
											variant={"secondary"}
											onClick={() =>
												field.pushValue({
													type: "single_choice",
													text: "",
													hasCorrectAnswer: false,
													config: {
														isRequired: false,
														maxSelections: 0,
													},
												})
											}
										>
											<Plus />
											Agregar pregunta
										</Button>
									</div>
								</div>
							)}
						</form.Field>
						<div className="w-full flex items-center justify-end gap-2">
							<Button
								type="submit"
								variant={"default"}
								onClick={() => form.handleSubmit()}
								disabled={!canSubmit}
							>
								<LoadingSwap isLoading={createQuestionsMutation.isPending}>
									Crear pregunta
								</LoadingSwap>
							</Button>
						</div>
					</fieldset>
				)}
			/>
		</form>
	);
};

export default CreateQuestionForm;

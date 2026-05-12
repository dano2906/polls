import { useForm } from "@tanstack/react-form-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { createPoll } from "#/actions/poll";
import type { NewPollInput } from "#/shared/types.d.ts";
import { createPollInput } from "#/shared/validation.ts";
import { Button } from "../ui/button";
import { LoadingSwap } from "../ui/loading-swap";
import FormField, { FieldType } from "./form-field";

interface Props {
	userId: string;
	onCreatePoll: Dispatch<SetStateAction<string | null>>;
}

const CreatePollForm = ({ userId, onCreatePoll }: Props) => {
	const qc = useQueryClient();
	const defaultPollValues: NewPollInput = {
		name: "",
		slug: undefined,
		description: "",
		startDate: new Date(),
		endDate: undefined,
		status: "draft",
		userId,
	};
	const createPollMutation = useMutation({
		mutationKey: ["create", "poll"],
		mutationFn: async (values: NewPollInput) => createPoll({ data: values }),
		onSuccess: async (data) => {
			onCreatePoll(data?.id as string);
			toast.success("Se ha guardado la encuesta correctamente.");
			await qc.invalidateQueries({
				queryKey: ["list", "poll", userId],
			});
		},
	});
	const form = useForm({
		defaultValues: defaultPollValues,
		validators: {
			onChange: createPollInput,
		},
		onSubmit: async ({ value }) => {
			await createPollMutation.mutateAsync(value);
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			className="grid grid-cols-2 gap-3"
		>
			<form.Field name="name">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.INPUT_TEXT}
						label="Nombre de la encuesta"
						placeholder="My first poll"
						requried
					/>
				)}
			</form.Field>
			<form.Field name="slug">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.INPUT_TEXT}
						label="Slug"
						placeholder="P14C3!"
					/>
				)}
			</form.Field>
			<form.Field name="startDate">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.SIMPLE_DATE}
						label="Fecha de inicio"
						requried
					/>
				)}
			</form.Field>
			<form.Field name="endDate">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.SIMPLE_DATE}
						label="Fecha de fin"
					/>
				)}
			</form.Field>
			<form.Field name="description">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.TEXTAREA}
						label="Descripción"
						input_classes={"col-span-2"}
					/>
				)}
			</form.Field>
			<form.Subscribe
				selector={(state) => [
					state.canSubmit,
					state.isSubmitting,
					state.errors,
				]}
				// biome-ignore lint/correctness/noChildrenProp: <explanation>
				children={([canSubmit]) => (
					<div className="w-full flex items-center justify-end gap-2 col-span-2">
						<Button
							type="submit"
							variant={"default"}
							onClick={() => form.handleSubmit()}
							disabled={!canSubmit}
						>
							<LoadingSwap isLoading={createPollMutation.isPending}>
								Crear
							</LoadingSwap>
						</Button>
					</div>
				)}
			/>
		</form>
	);
};

export default CreatePollForm;

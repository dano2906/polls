import { useForm } from "@tanstack/react-form-start";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Save } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { createPoll, updatePoll } from "#/actions/poll";
import type { NewPollInput, Poll } from "#/shared/types";
import { createPollInput, editPollInput } from "#/shared/validation.ts";
import { Button } from "../ui/button";
import { LoadingSwap } from "../ui/loading-swap";
import { ChangePollStatus } from "./change-poll-status";
import FormField, { FieldType } from "./form-field";

interface Props {
	userId: string;
	initialData?: Pick<
		Poll,
		"name" | "slug" | "description" | "endDate" | "startDate" | "status"
	>;
	onCreatePoll?: Dispatch<SetStateAction<string | null>>;
}

const PollForm = ({ userId, onCreatePoll, initialData }: Props) => {
	const router = useRouter();
	const isEditing = !!initialData;
	const createPollMutation = useMutation({
		mutationKey: [
			isEditing ? "update" : "create",
			"poll",
			isEditing && initialData.slug,
		],
		mutationFn: async (values: NewPollInput) => {
			if (isEditing) {
				return updatePoll({
					data: {
						slug: values.slug,
						values,
					},
				});
			}
			return createPoll({ data: values });
		},
		onSuccess: async (data) => {
			if (onCreatePoll && !isEditing) {
				onCreatePoll((data as { slug: string }).slug);
			}
			router.invalidate();
			toast.success(isEditing ? "Encuesta actualizada" : "Encuesta creada");
		},
	});
	const form = useForm({
		defaultValues: {
			name: initialData?.name ?? "",
			slug: initialData?.slug ?? undefined,
			description: initialData?.description ?? "",
			startDate: initialData?.startDate ?? new Date(),
			endDate: initialData?.endDate ?? undefined,
			status: initialData?.status ?? "draft",
			userId,
		},
		validators: {
			onChange: isEditing ? editPollInput : createPollInput,
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
						disabled={isEditing}
						input_classes={isEditing && "cursor-not-allowed"}
					/>
				)}
			</form.Field>
			<form.Field name="startDate">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.SIMPLE_DATE}
						label="Fecha de inicio"
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
						{isEditing && initialData.status && initialData.slug && (
							<ChangePollStatus
								status={initialData.status}
								slug={initialData.slug}
							/>
						)}
						<Button
							type="submit"
							variant={"default"}
							onClick={() => form.handleSubmit()}
							disabled={!canSubmit}
						>
							<LoadingSwap
								isLoading={createPollMutation.isPending}
								className="flex items-center gap-2"
							>
								<Save />
								{isEditing ? "Guardar cambios" : "Crear encuesta"}
							</LoadingSwap>
						</Button>
					</div>
				)}
			/>
		</form>
	);
};

export default PollForm;

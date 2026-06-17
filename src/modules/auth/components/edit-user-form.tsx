import { useForm } from "@tanstack/react-form-start";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { UserWithRole } from "better-auth/plugins";
import { toast } from "sonner";
import AvatarUploadField from "@/common/components/partials/avatar-upload-field";
import FormField, { FieldType } from "@/common/components/partials/form-field";
import { Button } from "@/common/components/ui/button";
import { LoadingSwap } from "@/common/components/ui/loading-swap";
import { cn, uploadToCloudinary } from "@/common/lib/utils";
import { editUser } from "../actions/user";
import { ROLE_OPTIONS } from "../lib/constants";
import { editUserSchema } from "../lib/validation";
import type { EditUser } from "../shared/types";

interface EditUserFormProps {
	user: UserWithRole;
	isolated?: boolean;
}

const EditUserForm = ({ user, isolated = true }: EditUserFormProps) => {
	const qc = useQueryClient();
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			name: user.name,
			email: user.email,
			role: user.role,
			avatar: user.image || "",
		} as EditUser,
		validators: {
			onChange: editUserSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				toast.loading("Actualizando usuario...", {
					id: "edit-user",
				});

				const { avatar: avatarValue, ...restOfValues } = value;

				let finalAvatarUrl: string | undefined = user.image || undefined;

				const isNewFileSelected = avatarValue && avatarValue instanceof File;
				const isImageCleared = avatarValue === null || avatarValue === "";

				if (isNewFileSelected) {
					const cloudinaryResult = await uploadToCloudinary(avatarValue);
					finalAvatarUrl = cloudinaryResult.url;
				} else if (isImageCleared) {
					finalAvatarUrl = undefined;
				}
				console.log(finalAvatarUrl);
				const result = await editUser({
					data: {
						id: user.id,
						user: {
							...restOfValues,
							avatar: finalAvatarUrl,
						},
					},
				});

				if (result.success) {
					toast.success("El usuario se ha actualizado con éxito.");

					await qc.invalidateQueries({
						queryKey: ["user"],
						exact: false,
					});

					await navigate({
						to: "/user",
						search: {
							limit: 10,
							offset: 0,
							sortDirection: "desc",
						},
					});
				}
			} catch (error) {
				if (error instanceof Error) toast.error(error.message);
			} finally {
				toast.dismiss("edit-user");
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
			className={cn(
				"w-full grid grid-cols-1 lg:grid-cols-2 gap-4",
				isolated && "max-w-md lg:max-w-2xl mx-auto ",
			)}
		>
			{isolated && (
				<div className="w-full col-span-1 lg:col-span-2">
					<form.Field name="avatar">
						{(field) => (
							<AvatarUploadField
								field={field}
								email={user.email}
								initialAvatarUrl={user.image}
							/>
						)}
					</form.Field>
				</div>
			)}
			<form.Field name="name">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.INPUT_TEXT}
						label="Nombre del usuario"
						placeholder="John Doe"
					/>
				)}
			</form.Field>

			<form.Field name="email">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.EMAIL}
						label="Correo electrónico"
						placeholder="johndoe@gmail.com"
					/>
				)}
			</form.Field>

			<form.Field name="role">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.SELECT}
						label="Role"
						options={[...ROLE_OPTIONS] as { value: string; label: string }[]}
					/>
				)}
			</form.Field>

			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
				// biome-ignore lint/correctness/noChildrenProp: <explanation>
				children={([canSubmit, isSubmitting]) => (
					<div
						className={cn(
							"w-full flex flex-col justify-center items-center gap-4 col-span-1 lg:col-span-2",
						)}
					>
						<Button
							type="submit"
							variant={"default"}
							disabled={!canSubmit}
							className="w-60 mx-auto"
						>
							<LoadingSwap
								isLoading={isSubmitting as boolean}
								className="flex items-center gap-2"
							>
								Guardar cambios
							</LoadingSwap>
						</Button>
					</div>
				)}
			/>
		</form>
	);
};

export default EditUserForm;

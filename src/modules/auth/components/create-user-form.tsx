import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import AvatarUploadField from "@/common/components/partials/avatar-upload-field";
import FormField, { FieldType } from "@/common/components/partials/form-field";
import { Button } from "@/common/components/ui/button";
import { LoadingSwap } from "@/common/components/ui/loading-swap";
import { uploadToCloudinary } from "@/common/lib/utils";
import { createUser } from "../actions/user";
import { ROLE_OPTIONS } from "../lib/constants";
import { userQKs } from "../lib/query";
import { createUserSchema } from "../lib/validation";
import type { CreateUser } from "../shared/types";

const CreateUserForm = () => {
	const qc = useQueryClient();
	const navigate = useNavigate();
	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			role: "user",
			avatar: "",
		} as CreateUser,
		validators: {
			onChange: createUserSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				toast.loading("Creando usuario...", {
					id: "create-user",
				});
				let fileUrl: any;
				if (value.avatar && value.avatar instanceof File) {
					const cloudinaryResult = await uploadToCloudinary(value.avatar);
					fileUrl = cloudinaryResult.url;
				}
				const result = await createUser({
					data: {
						...value,
						avatar: fileUrl ?? undefined,
					},
				});
				if (result.success) {
					toast.success("El usuario se ha creado con éxito.");
					await qc.invalidateQueries({
						queryKey: userQKs.lists(),
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
				toast.dismiss("create-user");
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
			className="w-full max-w-md lg:max-w-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4"
		>
			<form.Field name="avatar">
				{(field) => (
					<div className="w-full col-span-1 lg:col-span-2">
						<AvatarUploadField field={field} />
					</div>
				)}
			</form.Field>
			<form.Field name="name">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.INPUT_TEXT}
						label="Nombre del usuario"
						placeholder="John Doe"
						required
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
						required
					/>
				)}
			</form.Field>
			<form.Field name="password">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.PASSWORD}
						label="Contraseña"
						placeholder="aBCd98**"
						required
					/>
				)}
			</form.Field>
			<form.Field name="role">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.SELECT}
						label="Role"
						required
						options={[...ROLE_OPTIONS] as { value: string; label: string }[]}
					/>
				)}
			</form.Field>
			<form.Subscribe
				selector={(state) => [
					state.canSubmit,
					state.isSubmitting,
					state.errors,
				]}
			>
				{([canSubmit, isSubmitting]) => (
					<div className="w-full flex flex-col items-end justify-center gap-4 col-span-1 lg:col-span-2">
						<Button type="submit" variant={"default"} disabled={!canSubmit}>
							<LoadingSwap
								isLoading={isSubmitting as boolean}
								className="flex items-center gap-2"
							>
								Crear usuario
							</LoadingSwap>
						</Button>
					</div>
				)}
			</form.Subscribe>
		</form>
	);
};

export default CreateUserForm;

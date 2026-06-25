import { useForm } from "@tanstack/react-form-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "better-auth";
import { toast } from "sonner";
import FormField, { FieldType } from "@/common/components/partials/form-field";
import { Button } from "@/common/components/ui/button";
import { LoadingSwap } from "@/common/components/ui/loading-swap";
import { updateProfile } from "../actions/user";
import ChangePasswordInput from "./change-password-input";

const UserProfileForm = ({ user }: { user: User }) => {
	const qc = useQueryClient();
	const router = useRouter();
	const profileMutation = useMutation({
		mutationFn: async (values: { name: string }) => {
			return updateProfile({ data: values });
		},
		onSuccess: async () => {
			toast.success("Perfil actualizado");
			await router.invalidate();
			await qc.invalidateQueries({ queryKey: ["user"] });
		},
		onError: (error) => toast.error(error.message),
	});

	const form = useForm({
		defaultValues: {
			name: user?.name ?? "",
			email: user?.email,
		},
		onSubmit: async ({ value }) => {
			profileMutation.mutate(value);
		},
	});
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="grid grid-cols-1 md:grid-cols-2 gap-4"
		>
			<form.Field name="name">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.INPUT_TEXT}
						label="Nombre"
						placeholder="Tu nombre"
					/>
				)}
			</form.Field>
			<form.Field name="email">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.EMAIL}
						label="Correo electrónico"
						placeholder="prueba@example.com"
						disabled
					/>
				)}
			</form.Field>
			<ChangePasswordInput id={user.id} />
			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
			>
				{([canSubmit]) => (
					<div className="col-span-1 md:col-span-2 flex justify-end">
						<Button
							type="submit"
							variant="default"
							disabled={!canSubmit || profileMutation.isPending}
						>
							<LoadingSwap
								isLoading={profileMutation.isPending}
								className="flex items-center gap-2"
							>
								Guardar cambios
							</LoadingSwap>
						</Button>
					</div>
				)}
			</form.Subscribe>
		</form>
	);
};

export default UserProfileForm;

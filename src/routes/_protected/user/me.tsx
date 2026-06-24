import { useForm } from "@tanstack/react-form-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { updateProfile } from "@/auth/actions/user";
import ChangePasswordInput from "@/auth/components/change-password-input";
import ChangeUserAvatar from "@/auth/components/change-user-avatar";
import FormField, { FieldType } from "@/common/components/partials/form-field";
import PageHeading from "@/common/components/partials/page-heading";
import { Button } from "@/common/components/ui/button";
import { LoadingSwap } from "@/common/components/ui/loading-swap";

export const Route = createFileRoute("/_protected/user/me")({
	component: RouteComponent,
});

function RouteComponent() {
	const { auth } = Route.useRouteContext();
	const router = useRouter();
	const qc = useQueryClient();

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
			name: auth?.user?.name ?? "",
			email: auth?.user?.email,
		},
		onSubmit: async ({ value }) => {
			profileMutation.mutate(value);
		},
	});

	return (
		<section className="container mx-auto flex flex-col items-start justify-center gap-8 py-10">
			<PageHeading>Mi perfil</PageHeading>

			<div className="w-full space-y-8">
				<div className="flex justify-center">
					<ChangeUserAvatar
						avatarUrl={auth?.user.image}
						email={auth?.user.email}
						id={auth?.user.id}
					/>
				</div>

				<div className="space-y-4">
					<PageHeading>Editar datos</PageHeading>
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
						<ChangePasswordInput id={auth?.user.id} />
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
				</div>
			</div>
		</section>
	);
}

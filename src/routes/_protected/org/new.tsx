import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ensureSession } from "@/auth/actions/auth";
import FormField, { FieldType } from "@/common/components/partials/form-field";
import PageHeading from "@/common/components/partials/page-heading";
import { createOrganizationAction } from "@/organization/actions/organization";
import { Button } from "@/ui/button";

export const Route = createFileRoute("/_protected/org/new")({
	beforeLoad: async () => {
		const session = await ensureSession();
		if (session?.user.role !== "admin") {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			name: "",
			slug: "",
		},
		onSubmit: async ({ value }) => {
			const session = await ensureSession();
			await createOrganizationAction({
				data: { ...value, userId: session.user.id },
			});
			navigate({ to: "/org" });
		},
	});

	return (
		<div className="container mx-auto py-10 space-y-4 max-w-lg">
			<PageHeading>Crear organización</PageHeading>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field name="name">
					{(field) => (
						<FormField
							field={field}
							field_type={FieldType.INPUT_TEXT}
							label="Nombre"
						/>
					)}
				</form.Field>
				<form.Field
					name="slug"
					validators={{
						onChange: ({ value }) =>
							!/^[a-z0-9-]+$/.test(value)
								? "Solo minúsculas, números y guiones"
								: undefined,
					}}
				>
					{(field) => (
						<FormField
							field={field}
							field_type={FieldType.INPUT_TEXT}
							label="Slug"
							placeholder="mi-organizacion"
						/>
					)}
				</form.Field>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<div className="flex justify-end">
							<Button type="submit" disabled={!canSubmit}>
								{isSubmitting ? "Creando..." : "Crear organización"}
							</Button>
						</div>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}

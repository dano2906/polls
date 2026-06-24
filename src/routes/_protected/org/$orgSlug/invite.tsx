import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ensureSession } from "@/auth/actions/auth";
import FormField, { FieldType } from "@/common/components/partials/form-field";
import PageHeading from "@/common/components/partials/page-heading";
import {
	getOrganizationBySlug,
	inviteMemberAction,
} from "@/organization/actions/organization";
import { Button } from "@/ui/button";

export const Route = createFileRoute("/_protected/org/$orgSlug/invite")({
	beforeLoad: async () => {
		await ensureSession();
	},
	loader: async ({ params }) => {
		const org = await getOrganizationBySlug({ data: { slug: params.orgSlug } });
		return { org };
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const { org } = Route.useLoaderData();

	const form = useForm({
		defaultValues: {
			email: "",
			role: "member",
		},
		onSubmit: async ({ value }) => {
			await inviteMemberAction({
				data: {
					organizationId: org.id,
					email: value.email,
					role: value.role,
				},
			});
			navigate({
				to: "/org/$orgSlug/members",
				params: { orgSlug: org.slug },
			});
		},
	});

	return (
		<div className="container mx-auto py-10 space-y-4 max-w-lg">
			<PageHeading>Invitar miembro</PageHeading>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field
					name="email"
					validators={{
						onChange: ({ value }) =>
							!value.includes("@") ? "Email inválido" : undefined,
					}}
				>
					{(field) => (
						<FormField
							field={field}
							field_type={FieldType.EMAIL}
							label="Email"
							placeholder="usuario@ejemplo.com"
						/>
					)}
				</form.Field>
				<form.Field name="role">
					{(field) => (
						<FormField
							field={field}
							field_type={FieldType.SELECT}
							label="Rol"
							options={[
								{ value: "member", label: "Miembro" },
								{ value: "admin", label: "Admin" },
							]}
						/>
					)}
				</form.Field>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<div className="flex justify-end">
							<Button type="submit" disabled={!canSubmit}>
								{isSubmitting ? "Enviando..." : "Enviar invitación"}
							</Button>
						</div>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}

import { createFileRoute, redirect } from "@tanstack/react-router";
import { ensureSession } from "@/auth/actions/auth";
import CreateUserForm from "@/auth/components/create-user-form";
import PageHeading from "@/common/components/partials/page-heading";

export const Route = createFileRoute("/_protected/user/new")({
	beforeLoad: async () => {
		const session = await ensureSession();
		if (session?.user.role !== "admin") {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="container mx-auto py-10 space-y-4">
			<PageHeading>Crear usuario</PageHeading>
			<CreateUserForm />
		</div>
	);
}

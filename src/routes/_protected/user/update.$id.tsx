import { createFileRoute, redirect } from "@tanstack/react-router";
import { ensureSession } from "@/auth/actions/auth";
import { getUser } from "@/auth/actions/user";
import EditUserForm from "@/auth/components/edit-user-form";
import PageHeading from "@/common/components/partials/page-heading";

export const Route = createFileRoute("/_protected/user/update/$id")({
	beforeLoad: async () => {
		const session = await ensureSession();
		if (session?.user.role !== "admin") {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: RouteComponent,
	loader: async (ctx) => await getUser({ data: { id: ctx.params.id } }),
});

function RouteComponent() {
	const user = Route.useLoaderData();
	return (
		<div className="container mx-auto py-10 space-y-4">
			<PageHeading>Editar usuario</PageHeading>
			<EditUserForm user={user} />
		</div>
	);
}

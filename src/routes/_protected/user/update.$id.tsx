import { createFileRoute } from "@tanstack/react-router";
import { getUser } from "@/auth/actions/user";
import EditUserForm from "@/auth/components/edit-user-form";
import PageHeading from "@/common/components/partials/page-heading";

export const Route = createFileRoute("/_protected/user/update/$id")({
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

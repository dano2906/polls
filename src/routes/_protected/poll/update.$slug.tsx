import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { getPollDetails } from "#/actions/poll";
import PageHeading from "#/components/partials/page-heading";
import PollForm from "#/components/partials/poll-form";

export const Route = createFileRoute("/_protected/poll/update/$slug")({
	component: RouteComponent,
	loader: async (ctx) => {
		const { slug } = ctx.params;
		return await getPollDetails({ data: { slug } });
	},
});

function RouteComponent() {
	const { user } = useRouteContext({ from: "/_protected" });
	const { slug } = Route.useParams();
	const { questions, ...initialData } = Route.useLoaderData();
	return (
		<div className="p-2 block space-y-4">
			<PageHeading>Detalles de la encuesta {slug.toUpperCase()}</PageHeading>
			<PollForm
				userId={user.id}
				initialData={{
					...initialData,
					slug,
				}}
			/>
		</div>
	);
}

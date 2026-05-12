import { createFileRoute } from "@tanstack/react-router";
import { getPollDetails } from "#/actions/poll";

export const Route = createFileRoute("/_protected/poll/update/$slug")({
	component: RouteComponent,
	loader: async (ctx) => {
		const { slug } = ctx.params;
		return await getPollDetails({ data: { slug } });
	},
});

function RouteComponent() {
	const data = Route.useLoaderData();
	return (
		<div>
			<pre
				style={{
					padding: "1rem",
					borderRadius: "8px",
					overflowX: "auto",
				}}
			>
				{JSON.stringify(data, null, 2)}
			</pre>
		</div>
	);
}

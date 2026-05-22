import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { getPollDetails } from "#/actions/poll";
import PollCompleteForm from "#/components/partials/poll-complete-form";

export const Route = createFileRoute("/_landing/p/$slug/")({
	component: RouteComponent,
	beforeLoad: async ({ context, location }) => {
		try {
			if (!context.auth?.session) {
				throw redirect({
					to: "/",
					search: { from: location.pathname },
				});
			}
		} catch (error) {
			if (isRedirect(error)) throw error;
			throw redirect({
				to: "/",
				search: { redirect: location.href },
			});
		}
	},
	loader: async ({ params }) => {
		return await getPollDetails({
			data: {
				slug: params.slug,
			},
		});
	},
});

function RouteComponent() {
	const data = Route.useLoaderData();
	const { slug } = Route.useParams();
	return (
		<div>
			<PollCompleteForm pollData={data} slug={slug} />
		</div>
	);
}

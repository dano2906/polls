import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { getPollDetails, validatePollAccess } from "@/poll/actions/poll";
import PollCompleteForm from "@/poll/components/poll-complete-form";

export const Route = createFileRoute("/_landing/p/$slug/")({
	component: RouteComponent,
	beforeLoad: async ({ context, params }) => {
		try {
			if (!context.auth?.session) {
				throw redirect({
					to: "/",
				});
			}
			const access = await validatePollAccess({
				data: {
					slug: params.slug,
					userId: context.auth.user.id,
				},
			});
			if (!access.allowed) {
				if (access.reason === "ALREADY_SUBMITTED") {
					throw redirect({
						to: "/p/$slug/result",
						params: { slug: params.slug },
					});
				}

				throw redirect({
					to: "/",
					search: { error: access.message },
				});
			}
		} catch (error) {
			if (isRedirect(error)) throw error;
			throw redirect({
				to: "/",
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
	return <PollCompleteForm pollData={data} slug={slug} />;
}

import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import QuestionResponseForm from "@/answers/components/questions-response-form";
import { getPollDetails, validatePollAccess } from "@/poll/actions/poll";

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
	return <QuestionResponseForm pollData={data} slug={slug} />;
}

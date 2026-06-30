import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import QuestionResponseForm from "@/answers/components/questions-response-form";
import { validatePollAccess } from "@/poll/actions/poll";
import { pollDetailsOptions } from "@/poll/lib/query";

export const Route = createFileRoute("/_landing/p/$slug/")({
	component: RouteComponent,
	beforeLoad: async ({ context, params }) => {
		if (!context.auth) {
			throw redirect({ to: "/" });
		}
		try {
			await validatePollAccess({
				data: {
					slug: params.slug,
					userId: context.auth.user.id,
				},
			});
		} catch (error) {
			if (isRedirect(error)) throw error;
			throw redirect({
				to: "/",
			});
		}
	},
	loader: ({ context, params }) => {
		context.queryClient.ensureQueryData(pollDetailsOptions(params.slug));
	},
});

function RouteComponent() {
	const { slug } = Route.useParams();
	const { data } = useSuspenseQuery(pollDetailsOptions(slug));
	return <QuestionResponseForm pollData={data} slug={slug} />;
}

import {
	createFileRoute,
	redirect,
	useRouteContext,
} from "@tanstack/react-router";
import { getPollDetails } from "#/actions/poll";
import { checkUserSubmissionFn } from "#/actions/user";
import PageHeading from "#/components/partials/page-heading";
import PollForm from "#/components/partials/poll-form";
import QuestionForm from "#/components/partials/question-form";
import type { NewQuestion } from "#/shared/types";

export const Route = createFileRoute("/_protected/poll/update/$slug")({
	component: RouteComponent,
	beforeLoad: async ({ params }) => {
		const { hasResponded } = await checkUserSubmissionFn({ data: params.slug });

		if (hasResponded) {
			throw redirect({
				to: "/",
				replace: true,
			});
		}
	},
	loader: async (ctx) => {
		const { slug } = ctx.params;
		return await getPollDetails({ data: { slug } });
	},
});

function RouteComponent() {
	const { auth } = useRouteContext({ from: "/_protected" });
	const { slug } = Route.useParams();
	const { questions, ...initialData } = Route.useLoaderData();
	return (
		<div className="p-2 block space-y-4">
			<PageHeading>Detalles de la encuesta {slug.toUpperCase()}</PageHeading>
			<PollForm
				userId={auth?.user.id as string}
				initialData={{
					...initialData,
					slug,
				}}
			/>
			<QuestionForm
				initialData={questions as NewQuestion[]}
				pollId={questions && questions.length > 0 ? questions[0].pollId : null}
				pollDescription={initialData.description}
			/>
		</div>
	);
}

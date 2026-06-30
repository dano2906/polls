import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import PageHeading from "@/common/components/partials/page-heading";
import { getPollDetails } from "@/poll/actions/poll";
import PollForm from "@/poll/components/poll-form";
import QuestionForm from "@/question/components/question-form";

export const Route = createFileRoute("/_protected/poll/$slug/update")({
	component: RouteComponent,
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
				userId={auth.user.id}
				initialData={{
					...initialData,
					password: null,
					slug,
				}}
			/>
			<QuestionForm
				initialData={questions}
				slug={slug}
				pollDescription={initialData.description}
			/>
		</div>
	);
}

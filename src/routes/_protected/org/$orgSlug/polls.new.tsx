import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import PageHeading from "@/common/components/partials/page-heading";
import { getOrganizationBySlug } from "@/organization/actions/organization";
import PollForm from "@/poll/components/poll-form";
import QuestionForm from "@/question/components/question-form";

export const Route = createFileRoute("/_protected/org/$orgSlug/polls/new")({
	loader: async ({ params }) => {
		const org = await getOrganizationBySlug({ data: { slug: params.orgSlug } });
		return { org };
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { auth } = Route.useRouteContext();
	const { org } = Route.useLoaderData();
	const [slug, setSlug] = useState<string | null>(null);

	return (
		<div className="p-2 block space-y-4">
			<PageHeading>Crear encuesta en {org.name}</PageHeading>
			<PollForm
				userId={auth.user.id}
				organizationId={org.id}
				onCreatePoll={setSlug}
			/>
			<QuestionForm slug={slug} />
		</div>
	);
}

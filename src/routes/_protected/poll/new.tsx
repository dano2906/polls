import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import PageHeading from "#/components/partials/page-heading.tsx";
import PollForm from "#/components/partials/poll-form";
import QuestionForm from "#/components/partials/question-form";

export const Route = createFileRoute("/_protected/poll/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const { auth } = useRouteContext({ from: "/_protected" });
	const [slug, setSlug] = useState<string | null>(null);
	return (
		<div className="p-2 block space-y-4">
			<PageHeading>Crear encuesta</PageHeading>
			<PollForm userId={auth?.user.id as string} onCreatePoll={setSlug} />
			<QuestionForm slug={slug} />
		</div>
	);
}

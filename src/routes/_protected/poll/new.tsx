import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import CreatePollForm from "#/components/partials/create-poll-form.tsx";
import CreateQuestionForm from "#/components/partials/create-question-form.tsx";
import PageHeading from "#/components/partials/page-heading.tsx";

export const Route = createFileRoute("/_protected/poll/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const { user: session } = useRouteContext({ from: "/_protected" });
	const [pollId, setPollId] = useState(null);
	return (
		<div className="p-2 block space-y-4">
			<PageHeading>Crear encuesta</PageHeading>
			<CreatePollForm userId={session.user.id} onCreatePoll={setPollId} />
			<CreateQuestionForm pollId={pollId} />
		</div>
	);
}

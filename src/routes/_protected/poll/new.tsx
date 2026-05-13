import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import CreateQuestionForm from "#/components/partials/create-question-form.tsx";
import PageHeading from "#/components/partials/page-heading.tsx";
import PollForm from "#/components/partials/poll-form";

export const Route = createFileRoute("/_protected/poll/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const { user } = useRouteContext({ from: "/_protected" });
	const [pollId, setPollId] = useState<string | null>(null);
	return (
		<div className="p-2 block space-y-4">
			<PageHeading>Crear encuesta</PageHeading>
			<PollForm userId={user.id} onCreatePoll={setPollId} />
			<CreateQuestionForm pollId={pollId} />
		</div>
	);
}

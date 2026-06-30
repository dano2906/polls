import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import PageHeading from "@/common/components/partials/page-heading";
import PollForm from "@/poll/components/poll-form";
import QuestionForm from "@/question/components/question-form";

export const Route = createFileRoute("/_protected/poll/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const { auth } = useRouteContext({ from: "/_protected" });
	const [slug, setSlug] = useState<string | null>(null);
	return (
		<div className="p-2 block space-y-4">
			<PageHeading>Crear encuesta</PageHeading>
			<PollForm userId={auth.user.id} onCreatePoll={setSlug} />
			<QuestionForm slug={slug} />
		</div>
	);
}

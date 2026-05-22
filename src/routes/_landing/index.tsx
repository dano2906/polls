import { createFileRoute } from "@tanstack/react-router";
import ListPublishedPolls from "#/components/partials/list-published-polls";

export const Route = createFileRoute("/_landing/")({ component: Home });

function Home() {
	return (
		<div className="p-8 bg-background text-foreground space-y-8">
			<ListPublishedPolls />
		</div>
	);
}

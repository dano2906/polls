import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/poll/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_protected/poll/new"!</div>;
}

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_landing/p/$slug/result")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_landing/p/$slug/result"!</div>;
}

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/poll/$slug/result")({
	component: RouteComponent,
});

function RouteComponent() {
	const { slug } = Route.useParams();
	return <div>Hello "/_protected/poll/$slug/result"! {slug}</div>;
}


import { ListUserPolls } from "#/components/partials/list-user-polls";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main>
			<ListUserPolls />
		</main>
	)
}

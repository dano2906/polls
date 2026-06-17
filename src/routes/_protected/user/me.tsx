import { createFileRoute } from "@tanstack/react-router";
import PageHeading from "@/common/components/partials/page-heading";

export const Route = createFileRoute("/_protected/user/me")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="container mx-auto py-10 space-y-4">
			<PageHeading>Mi perfil</PageHeading>
		</div>
	);
}

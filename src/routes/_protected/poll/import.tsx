import { createFileRoute } from "@tanstack/react-router";
import PageHeading from "@/common/components/partials/page-heading";
import { ImportPollZone } from "@/poll/components/import-poll-zone";

export const Route = createFileRoute("/_protected/poll/import")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="p-2 block space-y-4">
			<PageHeading>Importar encuesta</PageHeading>
			<ImportPollZone />
		</div>
	);
}

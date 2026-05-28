import { createFileRoute } from "@tanstack/react-router";
import { ImportPollZone } from "#/components/partials/import-poll-zone";
import PageHeading from "#/components/partials/page-heading";

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

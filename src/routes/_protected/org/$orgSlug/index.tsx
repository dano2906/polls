import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, FilePlus } from "lucide-react";
import { ensureSession } from "@/auth/actions/auth";
import PageHeading from "@/common/components/partials/page-heading";
import { getOrganizationBySlug } from "@/organization/actions/organization";
import ListOrgMembers from "@/organization/components/members-table";
import { orgMembersOptions, orgPollsOptions } from "@/organization/lib/query";
import PollCardDashboardList from "@/poll/components/poll-card-dashboard-list";
import { buttonVariants } from "@/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/ui/empty";

export const Route = createFileRoute("/_protected/org/$orgSlug/")({
	beforeLoad: async () => {
		await ensureSession();
	},
	component: RouteComponent,
	loader: async ({ context, params }) => {
		const org = await getOrganizationBySlug({ data: { slug: params.orgSlug } });
		context.queryClient.ensureQueryData(
			orgPollsOptions({ organizationId: org.id, q: "", status: "all" }),
		);
		context.queryClient.ensureQueryData(orgMembersOptions(org.id));
		return { org };
	},
});

function RouteComponent() {
	const { org } = Route.useLoaderData();
	const { data: polls } = useSuspenseQuery(
		orgPollsOptions({ organizationId: org.id, q: "", status: "all" }),
	);
	const { data: membersData } = useSuspenseQuery(orgMembersOptions(org.id));

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4 text-muted-foreground pb-2 border-b">
				<Building2 className="size-5" />
				<PageHeading>{org.name}</PageHeading>
				<div className="flex-1" />
			</div>

			<div className="flex items-center justify-between">
				<PageHeading>Encuestas</PageHeading>
				<Link
					to="/org/$orgSlug/polls/new"
					params={{ orgSlug: org.slug }}
					className={buttonVariants({ variant: "default", size: "sm" })}
				>
					<FilePlus />
					Nueva encuesta
				</Link>
			</div>

			{!polls || polls.length === 0 ? (
				<Empty>
					<EmptyTitle>Sin encuestas</EmptyTitle>
					<EmptyDescription>
						Esta organización aún no tiene encuestas.
					</EmptyDescription>
				</Empty>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{polls.map((p) => (
						<PollCardDashboardList key={p.id} poll={p} />
					))}
				</div>
			)}

			<div className="flex items-center justify-between">
				<PageHeading>Miembros</PageHeading>
			</div>

			{!membersData || membersData.members.length === 0 ? (
				<Empty>
					<EmptyTitle>Sin miembros</EmptyTitle>
					<EmptyDescription>
						Esta organización aún no tiene miembros.
					</EmptyDescription>
				</Empty>
			) : (
				<ListOrgMembers members={membersData.members} slug={org.slug} />
			)}
		</div>
	);
}

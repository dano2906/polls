import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, FilePlus, Users } from "lucide-react";
import { ensureSession } from "@/auth/actions/auth";
import { getOrganizationBySlug } from "@/organization/actions/organization";
import { orgPollsOptions } from "@/organization/lib/query";
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
		return { org };
	},
});

function RouteComponent() {
	const { org } = Route.useLoaderData();
	const { data: polls } = useSuspenseQuery(
		orgPollsOptions({ organizationId: org.id, q: "", status: "all" }),
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4 text-muted-foreground pb-2 border-b">
				<Building2 className="size-5" />
				<span className="text-lg font-semibold text-foreground">
					{org.name}
				</span>
				<div className="flex-1" />
				<Link
					to="/org/$orgSlug/members"
					params={{ orgSlug: org.slug }}
					className={buttonVariants({ variant: "outline", size: "sm" })}
				>
					<Users />
					Miembros
				</Link>
			</div>

			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">Encuestas</h2>
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
		</div>
	);
}

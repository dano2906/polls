import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { ensureSession } from "@/auth/actions/auth";
import PageHeading from "@/common/components/partials/page-heading";
import OrgCardDashboardList from "@/organization/components/org-card-dashboard-list";
import { listOrganizationsOptions } from "@/organization/lib/query";
import { buttonVariants } from "@/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/ui/empty";

export const Route = createFileRoute("/_protected/org/")({
	beforeLoad: async () => {
		const session = await ensureSession();
		if (session?.user.role !== "admin") {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: RouteComponent,
	loader: ({ context }) => {
		context.queryClient.ensureQueryData(listOrganizationsOptions());
	},
});

function RouteComponent() {
	const { data } = useSuspenseQuery(listOrganizationsOptions());

	return (
		<div className="container mx-auto py-10 space-y-4">
			<div className="flex items-center justify-between">
				<PageHeading>Organizaciones</PageHeading>
				<Link to="/org/new" className={buttonVariants({ variant: "default" })}>
					<Plus />
					Crear organización
				</Link>
			</div>

			{!data || data.length === 0 ? (
				<Empty>
					<EmptyTitle>No hay organizaciones</EmptyTitle>
					<EmptyDescription>
						Crea la primera organización para empezar.
					</EmptyDescription>
				</Empty>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{data.map((org) => (
						<OrgCardDashboardList key={org.id} org={org} />
					))}
				</div>
			)}
		</div>
	);
}

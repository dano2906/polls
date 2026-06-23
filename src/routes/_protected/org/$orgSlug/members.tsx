import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus, Shield, User } from "lucide-react";
import { ensureSession } from "@/auth/actions/auth";
import PageHeading from "@/common/components/partials/page-heading";
import {
	getOrganizationBySlug,
	removeMemberAction,
} from "@/organization/actions/organization";
import { orgMembersOptions } from "@/organization/lib/query";
import { Badge } from "@/ui/badge";
import { Button, buttonVariants } from "@/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/ui/empty";

export const Route = createFileRoute("/_protected/org/$orgSlug/members")({
	beforeLoad: async () => {
		await ensureSession();
	},
	component: RouteComponent,
	loader: async ({ context, params }) => {
		const org = await getOrganizationBySlug({ data: { slug: params.orgSlug } });
		context.queryClient.ensureQueryData(orgMembersOptions(org.id));
		return { org };
	},
});

function RouteComponent() {
	const router = useRouter();
	const { org } = Route.useLoaderData();
	const { data } = useSuspenseQuery(orgMembersOptions(org.id));

	const members = data.members ?? [];

	async function handleRemove(memberId: string) {
		await removeMemberAction({
			data: { organizationId: org.id, memberIdOrEmail: memberId },
		});
		router.invalidate();
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<PageHeading>Miembros de {org.name}</PageHeading>
				<Link
					to="/org/$orgSlug/invite"
					params={{ orgSlug: org.slug }}
					className={buttonVariants({ variant: "default", size: "sm" })}
				>
					<Plus />
					Invitar
				</Link>
			</div>

			{members.length === 0 ? (
				<Empty>
					<EmptyTitle>Sin miembros</EmptyTitle>
					<EmptyDescription>
						Esta organización no tiene miembros.
					</EmptyDescription>
				</Empty>
			) : (
				<div className="space-y-2">
					{members.map((member) => (
						<Card key={member.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<User className="size-5 text-muted-foreground" />
										<div>
											<CardTitle className="text-base">
												{member.user?.name || member.user?.email}
											</CardTitle>
											<CardDescription>{member.user?.email}</CardDescription>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge
											variant={
												member.role === "owner"
													? "default"
													: member.role === "admin"
														? "secondary"
														: "outline"
											}
										>
											{member.role === "owner" && (
												<Shield className="size-3 mr-1" />
											)}
											{member.role}
										</Badge>
										{member.role !== "owner" && (
											<Button
												variant="destructive"
												size="sm"
												onClick={() => handleRemove(member.id)}
											>
												Eliminar
											</Button>
										)}
									</div>
								</div>
							</CardHeader>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

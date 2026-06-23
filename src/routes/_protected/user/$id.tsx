import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ensureSession } from "@/auth/actions/auth";
import BanUserInput from "@/auth/components/ban-user-input";
import ChangePasswordInput from "@/auth/components/change-password-input";
import ChangeUserAvatar from "@/auth/components/change-user-avatar";
import EditUserForm from "@/auth/components/edit-user-form";
import ListUserSessions from "@/auth/components/list-user-sessions";
import RemoveUserButton from "@/auth/components/remove-user-button";
import RevokeSessionsButton from "@/auth/components/revoke-sessions-button";
import { getUserOptions, getUserSessionsOptions } from "@/auth/lib/query";
import PageHeading from "@/common/components/partials/page-heading";

export const Route = createFileRoute("/_protected/user/$id")({
	beforeLoad: async () => {
		const session = await ensureSession();
		if (session?.user.role !== "admin") {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: RouteComponent,
	loader: ({ context, params }) => {
		context.queryClient.ensureQueryData(getUserOptions(params.id));
		context.queryClient.ensureQueryData(getUserSessionsOptions(params.id));
	},
});

function RouteComponent() {
	const { id } = Route.useParams();
	const { data } = useQuery(getUserOptions(id));
	return (
		<section className="container mx-auto flex flex-col items-start justify-center gap-6">
			<ChangeUserAvatar avatarUrl={data?.image} email={data?.email} id={id} />
			<PageHeading>Acciones</PageHeading>
			<div className="w-full flex flex-wrap items-center justify-start gap-1">
				<BanUserInput id={id} />
				<ChangePasswordInput id={id} />
				<RevokeSessionsButton mode="all" id={id} buttonVariant="secondary" />
				<div className="max-w-fit">
					<RemoveUserButton id={id} buttonVariant="destructive" />
				</div>
			</div>
			<PageHeading>Editar datos</PageHeading>
			<EditUserForm user={data} isolated={false} />
			<PageHeading>Sesiones</PageHeading>
			<ListUserSessions id={id} />
		</section>
	);
}

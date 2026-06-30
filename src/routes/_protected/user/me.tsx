import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ChangeUserAvatar from "@/auth/components/change-user-avatar";
import ListUserAnsweredPolls from "@/auth/components/list-user-answered-polls";
import UserProfileForm from "@/auth/components/user-profile-form";
import { getUserAnsweredPollsOptions } from "@/auth/lib/query";
import PageHeading from "@/common/components/partials/page-heading";

export const Route = createFileRoute("/_protected/user/me")({
	component: RouteComponent,
	loader: ({ context }) => {
		context.queryClient.ensureQueryData(
			getUserAnsweredPollsOptions(context.auth.user.id),
		);
	},
});

function RouteComponent() {
	const { auth } = Route.useRouteContext();
	const { data: polls } = useSuspenseQuery(
		getUserAnsweredPollsOptions(auth.user.id),
	);

	return (
		<section className="container mx-auto flex flex-col items-start justify-center gap-8 py-10">
			<PageHeading className="text-primary">Mi perfil</PageHeading>

			<div className="w-full space-y-8">
				<div className="flex justify-center">
					<ChangeUserAvatar
						avatarUrl={auth.user.image}
						email={auth.user.email}
						id={auth.user.id}
					/>
				</div>

				<div className="space-y-4">
					<PageHeading>Editar datos</PageHeading>
					<UserProfileForm user={auth.user} />
				</div>

				<div className="space-y-4">
					<PageHeading>Encuestas contestadas</PageHeading>
					<ListUserAnsweredPolls polls={polls} />
				</div>
			</div>
		</section>
	);
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ChangeUserAvatar from "@/auth/components/change-user-avatar";
import ListUserSessions from "@/auth/components/list-user-sessions";
import { getUserOptions, getUserSessionsOptions } from "@/auth/lib/query";

export const Route = createFileRoute("/_protected/user/$id")({
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
		<section className="container mx-auto flex flex-col items-center justify-center gap-4">
			<ChangeUserAvatar
				avatarUrl={data?.data?.image}
				email={data?.data?.email}
				id={id}
			/>
			<ListUserSessions id={id} />
		</section>
	);
}

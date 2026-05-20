import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { getUserPolls } from "#/actions/poll";
import { ListUserPolls } from "#/components/partials/list-user-polls";

export const Route = createFileRoute("/_protected/dashboard")({
	component: RouteComponent,
	loader: ({ context }) => ({
		userPollsPromise: getUserPolls({
			data: { userId: context?.auth?.user.id as string },
		}),
	}),
});

function RouteComponent() {
	const { userPollsPromise } = Route.useLoaderData();
	return (
		<div>
			<Suspense fallback={"Loading..."}>
				<ListUserPolls dataPromise={userPollsPromise} />
			</Suspense>
		</div>
	);
}

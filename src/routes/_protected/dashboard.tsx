import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { getUserPolls } from "#/actions/poll";
import { ListUserPolls } from "#/components/partials/list-user-polls";
import { PollFilterBar } from "#/components/partials/poll-filter-bar";
import { Spinner } from "#/components/ui/spinner";
import { pollsSearchFiltershSchema } from "#/shared/validation";

export const Route = createFileRoute("/_protected/dashboard")({
	validateSearch: pollsSearchFiltershSchema,
	loaderDeps: ({ search }) => ({
		q: search.q,
		status: search.status,
	}),
	component: RouteComponent,
	loader: ({ context, deps }) => ({
		userPollsPromise: getUserPolls({
			data: {
				userId: context?.auth?.user.id as string,
				q: deps.q ?? "",
				status: deps.status,
			},
		}),
	}),
});

function RouteComponent() {
	const { userPollsPromise } = Route.useLoaderData();

	return (
		<div className="space-y-8 p-8 bg-background text-foreground">
			<PollFilterBar from="/_protected/dashboard" showStateSelector />
			<div>
				<Suspense
					fallback={
						<div className="flex h-auto w-full items-center justify-center">
							<Spinner />
						</div>
					}
				>
					<ListUserPolls dataPromise={userPollsPromise} />
				</Suspense>
			</div>
		</div>
	);
}

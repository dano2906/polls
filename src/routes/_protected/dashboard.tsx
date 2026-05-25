import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";
import { getCompactUserPolls, getListedUserPolls } from "#/actions/poll";
import { CompactUserPolls } from "#/components/partials/compact-user-polls";
import { ListUserPolls } from "#/components/partials/list-user-polls";
import { PollFilterBar } from "#/components/partials/poll-filter-bar";
import { Spinner } from "#/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { pollsSearchFiltershSchema } from "#/shared/validation";

export const Route = createFileRoute("/_protected/dashboard")({
	validateSearch: pollsSearchFiltershSchema,
	loaderDeps: ({ search }) => ({
		q: search.q,
		status: search.status,
	}),
	component: RouteComponent,
	loader: ({ context, deps }) => ({
		compactUserPollsPromise: getCompactUserPolls({
			data: {
				userId: context?.auth?.user.id as string,
				q: deps.q ?? "",
				status: deps.status,
			},
		}),
		listUserPollsPromise: getListedUserPolls({
			data: {
				userId: context?.auth?.user.id as string,
				q: deps.q ?? "",
				status: deps.status,
			},
		}),
	}),
});

function RouteComponent() {
	const { listUserPollsPromise, compactUserPollsPromise } =
		Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const handleTabChange = (newView: "compact" | "list") => {
		navigate({
			search: (prev) => ({
				...prev,
				view: newView,
			}),
		});
	};

	return (
		<div className="space-y-2 p-8 bg-background text-foreground">
			<h2 className="text-4xl font-sgc font-semibold text-primary tracking-wider pb-3">
				Mis encuestas
			</h2>
			<Tabs
				defaultValue={search.view}
				value={search.view || "compact"}
				onValueChange={(e) => handleTabChange(e as "compact" | "list")}
			>
				<TabsList className="gap-2">
					<PollFilterBar from="/_protected/dashboard" showStateSelector />
					<TabsTrigger value="list">Listado</TabsTrigger>
					<TabsTrigger value="compact">Compacto</TabsTrigger>
				</TabsList>
				<TabsContent value="list">
					<Suspense
						fallback={
							<div className="flex h-auto w-full items-center justify-center">
								<Spinner />
							</div>
						}
					>
						<ListUserPolls dataPromise={listUserPollsPromise} />
					</Suspense>
				</TabsContent>
				<TabsContent value="compact">
					<Suspense
						fallback={
							<div className="flex h-auto w-full items-center justify-center">
								<Spinner />
							</div>
						}
					>
						<CompactUserPolls dataPromise={compactUserPollsPromise} />
					</Suspense>
				</TabsContent>
			</Tabs>
		</div>
	);
}

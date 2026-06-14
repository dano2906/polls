import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FilePlus } from "lucide-react";
import { cn } from "@/common/lib/utils";
import { CompactUserPolls } from "@/poll/components/compact-user-polls";
import { ListUserPolls } from "@/poll/components/list-user-polls";
import { PollFilterBar } from "@/poll/components/poll-filter-bar";
import { compactPollsOptions, listPollsOptions } from "@/poll/lib/query";
import { pollsSearchFiltershSchema } from "@/poll/lib/validation";
import { buttonVariants } from "@/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

export const Route = createFileRoute("/_protected/dashboard")({
	validateSearch: pollsSearchFiltershSchema,
	loaderDeps: ({ search }) => ({
		q: search.q,
		status: search.status,
	}),
	component: RouteComponent,
	loader: ({ context, deps }) => {
		context.queryClient.ensureQueryData(
			compactPollsOptions({
				q: deps.q,
				status: deps.status,
				userId: context.auth.user.id,
			}),
		);
		context.queryClient.ensureQueryData(
			listPollsOptions({
				q: deps.q,
				status: deps.status,
				userId: context.auth.user.id,
			}),
		);
	},
});

function RouteComponent() {
	const search = Route.useSearch();
	const context = Route.useRouteContext();
	const navigate = useNavigate({ from: Route.fullPath });
	const { data: compactData } = useSuspenseQuery(
		compactPollsOptions({
			q: search.q,
			status: search.status,
			userId: context.auth.user.id,
		}),
	);
	const { data: listData } = useSuspenseQuery(
		listPollsOptions({
			q: search.q,
			status: search.status,
			userId: context.auth.user.id,
		}),
	);

	const handleTabChange = (newView: "compact" | "list") => {
		navigate({
			search: (prev) => ({
				...prev,
				view: newView,
			}),
		});
	};

	return (
		<div className="space-y-2 p-2 bg-background text-foreground">
			<h2 className="text-4xl font-sgc font-semibold text-primary tracking-wider pb-3">
				Mis encuestas
			</h2>
			<Tabs
				defaultValue={search.view || "compact"}
				value={search.view || "compact"}
				onValueChange={(e) => handleTabChange(e as "compact" | "list")}
			>
				<TabsList className="gap-2">
					<PollFilterBar showStateSelector />
					<TabsTrigger value="list">Listado</TabsTrigger>
					<TabsTrigger value="compact">Compacto</TabsTrigger>
					<Link
						to="/poll/new"
						className={cn(
							buttonVariants({
								variant: "outline",
								size: "sm",
							}),
							"h-[30px]",
						)}
					>
						<FilePlus />
						Crear encuesta
					</Link>
				</TabsList>
				<TabsContent value="list">
					<ListUserPolls polls={listData} />
				</TabsContent>
				<TabsContent value="compact">
					<CompactUserPolls polls={compactData} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FilePlus } from "lucide-react";
import { cn } from "@/common/lib/utils";
import { CompactUserPolls } from "@/poll/components/compact-user-polls";
import { FlatUserPolls } from "@/poll/components/flat-user-polls";
import { PollFilterBar } from "@/poll/components/poll-filter-bar";
import { compactPollsOptions, flatPollsOptions } from "@/poll/lib/query";
import { pollsSearchFiltershSchema } from "@/poll/lib/validation";
import { buttonVariants } from "@/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

export const Route = createFileRoute("/_protected/dashboard")({
	validateSearch: pollsSearchFiltershSchema,
	loaderDeps: ({ search }) => ({
		q: search.q,
		status: search.status,
		view: search.view,
	}),
	component: RouteComponent,
	loader: ({ context, deps }) => {
		const userId = context.auth.user.id;
		if (deps.view === "list") {
			context.queryClient.ensureQueryData(
				flatPollsOptions({ q: deps.q, status: deps.status, userId }),
			);
		} else {
			context.queryClient.ensureQueryData(
				compactPollsOptions({ q: deps.q, status: deps.status, userId }),
			);
		}
	},
});

function RouteComponent() {
	const search = Route.useSearch();
	const context = Route.useRouteContext();
	const navigate = useNavigate({ from: Route.fullPath });
	const userId = context.auth.user.id;
	const { data: compactData } = useSuspenseQuery(
		compactPollsOptions({
			q: search.q,
			status: search.status,
			userId,
		}),
	);
	const { data: listData } = useSuspenseQuery(
		flatPollsOptions({
			q: search.q,
			status: search.status,
			userId,
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
					<PollFilterBar showStateSelector from="/_protected/dashboard" />
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
					<FlatUserPolls polls={listData} />
				</TabsContent>
				<TabsContent value="compact">
					<CompactUserPolls polls={compactData} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

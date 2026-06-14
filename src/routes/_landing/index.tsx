import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import ListPublishedPolls from "@/poll/components/list-published-polls";
import { PollFilterBar } from "@/poll/components/poll-filter-bar";
import { landingPollsOptions } from "@/poll/lib/query";
import { pollsSearchFiltershSchema } from "@/poll/lib/validation";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/ui/empty";

export const Route = createFileRoute("/_landing/")({
	validateSearch: pollsSearchFiltershSchema,
	component: Home,
	loaderDeps: ({ search }) => ({
		q: search.q,
	}),
	loader: ({ context, deps }) => {
		context.queryClient.ensureQueryData(
			landingPollsOptions({
				q: deps.q,
				status: "published",
			}),
		);
	},
});

function Home() {
	const search = Route.useSearch();
	const router = useRouter();

	const { data } = useSuspenseQuery(
		landingPollsOptions({
			q: search.q,
			status: "published",
		}),
	);

	useEffect(() => {
		if (search.error) {
			toast.error(search.error);
			router.navigate({
				to: "/",
				search: (prev) => ({ ...prev, error: undefined }),
			});
		}
	}, [search.error, router]);

	return (
		<div className="w-full space-y-8 bg-background p-8 text-foreground">
			<PollFilterBar from={"/_landing/"} />

			{data && data.length > 0 ? (
				<ListPublishedPolls data={data} />
			) : (
				<Empty className="border border-dashed max-w-lg mx-auto">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<RefreshCcw />
						</EmptyMedia>
						<EmptyTitle>
							No se encuentran resultados que coincidan con los filtros.
						</EmptyTitle>
						<EmptyDescription>
							Modifique los filtros e inténtelo nuevamente.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</div>
	);
}

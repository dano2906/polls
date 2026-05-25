import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { getPublishedPolls } from "#/actions/poll";
import ListPublishedPolls from "#/components/partials/list-published-polls";
import { PollFilterBar } from "#/components/partials/poll-filter-bar";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "#/components/ui/empty";
import { Spinner } from "#/components/ui/spinner";
import { pollsSearchFiltershSchema } from "#/shared/validation";

export const Route = createFileRoute("/_landing/")({
	validateSearch: pollsSearchFiltershSchema,
	component: Home,
});

function Home() {
	const search = Route.useSearch();
	const router = useRouter();

	const { data, status } = useQuery({
		queryKey: ["polls", { q: search.q, status: "published" }],
		queryFn: () =>
			getPublishedPolls({ data: { q: search.q ?? "", status: "published" } }),
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		if (search.error) {
			toast.error(search.error);
			router.navigate({
				to: "/",
				search: (prev) => ({ ...prev, error: undefined }),
			});
		}
	}, [search.error, router]);

	if (!data && status === "pending") {
		return (
			<div className="flex h-auto w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (data && data.length === 0) {
		return (
			<Empty className="border border-dashed">
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
		);
	}

	return (
		<div className="w-full space-y-8 bg-background p-8 text-foreground">
			<PollFilterBar from={"/_landing/"} />

			{data && <ListPublishedPolls data={data} />}
		</div>
	);
}

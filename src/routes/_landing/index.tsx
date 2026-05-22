import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import ListPublishedPolls from "#/components/partials/list-published-polls";

interface Search {
	error?: string;
}

export const Route = createFileRoute("/_landing/")({ component: Home });

function Home() {
	const search = Route.useSearch() as Search;
	const router = useRouter();
	useEffect(() => {
		if (search.error) {
			toast.error(search.error);
			router.navigate({
				to: "/",
			});
		}
	}, [search, router]);

	return (
		<div className="p-8 bg-background text-foreground space-y-8">
			<ListPublishedPolls />
		</div>
	);
}

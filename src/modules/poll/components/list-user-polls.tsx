import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import type { getListedUserPolls } from "@/poll/actions/poll";
import { buttonVariants } from "@/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/ui/empty";
import PollCardDashboardList from "./poll-card-dashboard-list";

interface Props {
	polls: Awaited<ReturnType<typeof getListedUserPolls>>;
}

export const ListUserPolls = memo(function ListUserPolls({ polls }: Props) {
	if (polls.length === 0) {
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
					<EmptyContent>
						<Link
							to="/poll/new"
							className={buttonVariants({
								variant: "secondary",
							})}
						>
							Crear encuesta
						</Link>
					</EmptyContent>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 group">
			{polls.map((poll) => {
				return <PollCardDashboardList poll={poll} key={poll.slug} />;
			})}
		</ul>
	);
});

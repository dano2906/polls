import { Link } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import { use } from "react";
import type { getCompactUserPolls } from "@/poll/actions/poll";
import { buttonVariants } from "@/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/ui/empty";
import { Skeleton } from "@/ui/skeleton";
import PollCardDashboardCompact from "./poll-card-dashboard-compact";

interface Props {
	dataPromise: ReturnType<typeof getCompactUserPolls>;
}

export const CompactUserPolls = ({ dataPromise }: Props) => {
	const polls = use(dataPromise);

	if (!polls) {
		return (
			<ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
				{Array.from({ length: 6 }, (_, index) => index + 1).map((el) => {
					return <Skeleton key={el} className="h-32 w-full" />;
				})}
			</ul>
		);
	}

	if (Object.keys(polls).length === 0) {
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
		<div className="w-full space-y-3 grid grid-cols-1 md:grid-cols-2 gap-3">
			{Object.entries(polls).map(([id, group]) => {
				return <PollCardDashboardCompact key={id} pollGroup={group} />;
			})}
		</div>
	);
};

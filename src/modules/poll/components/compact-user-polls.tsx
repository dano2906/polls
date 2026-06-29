import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
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
import PollCardDashboardCompact from "./poll-card-dashboard-compact";

interface Props {
	polls: Awaited<ReturnType<typeof getCompactUserPolls>>;
}

export const CompactUserPolls = memo(function CompactUserPolls({ polls }: Props) {
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
						<div className="flex items-center justify-center gap-3">
							<Link
								to="/poll/new"
								className={buttonVariants({
									variant: "secondary",
								})}
							>
								Crear encuesta
							</Link>
							<Link
								to="/poll/import"
								className={buttonVariants({
									variant: "secondary",
								})}
							>
								Importar encuesta
							</Link>
						</div>
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
});

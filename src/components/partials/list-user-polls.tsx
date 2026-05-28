import { Link } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import { use } from "react";
import type { getListedUserPolls } from "#/actions/poll";
import { buttonVariants } from "../ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "../ui/empty";
import { Skeleton } from "../ui/skeleton";
import PollCardDashboardList from "./poll-card-dashboard-list";

interface Props {
	dataPromise: ReturnType<typeof getListedUserPolls>;
}

export const ListUserPolls = ({ dataPromise }: Props) => {
	const polls = use(dataPromise);

	if (!polls) {
		return (
			<ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
				{Array.from({ length: 6 }, (_, index) => index + 1).map((el) => {
					return <Skeleton key={el} />;
				})}
			</ul>
		);
	}

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
};

import { Link } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import { use } from "react";
import type { getUserPolls } from "#/actions/poll";
import { Button, buttonVariants } from "../ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "../ui/empty";
import { Skeleton } from "../ui/skeleton";
import PollCardDashoard from "./poll-card-dashboard";

interface Props {
	dataPromise: ReturnType<typeof getUserPolls>;
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
		<>
			<h2 className="text-4xl font-sgc font-semibold text-primary tracking-wider pb-3">
				Mis encuestas
			</h2>
			<ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 group">
				{polls.map((poll) => {
					return <PollCardDashoard poll={poll} key={poll.slug} />;
				})}
			</ul>
		</>
	);
};

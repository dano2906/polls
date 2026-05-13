import { use } from "react";
import type { getUserPolls } from "#/actions/poll";
import { Skeleton } from "../ui/skeleton";
import PollCard from "./poll-card";

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

	return (
		<>
			<h2 className="text-4xl font-sgc font-semibold text-primary tracking-wider pb-3">
				Mis encuestas
			</h2>
			<ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 group">
				{polls.map((poll) => {
					return <PollCard poll={poll} key={poll.slug} />;
				})}
			</ul>
		</>
	);
};

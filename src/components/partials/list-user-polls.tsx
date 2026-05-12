import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { getUserPolls } from "#/actions/poll";
import { Skeleton } from "../ui/skeleton";
import PollCard from "./poll-card";

export const ListUserPolls = () => {
	const { user: session } = useRouteContext({ from: "/_protected" });
	const { data: polls, isPending } = useQuery({
		queryKey: ["list", "poll", session.user.id],
		queryFn: async () =>
			await getUserPolls({
				data: {
					userId: session.user.id,
				},
			}),
	});

	if (isPending || !polls) {
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

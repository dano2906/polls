import { useQuery } from "@tanstack/react-query";
import { getPublishedPolls } from "#/actions/poll";
import PollCardLanding from "./poll-card-landing";

const ListPublishedPolls = () => {
	const publishedPollsQuery = useQuery({
		queryKey: ["published", "polls"],
		queryFn: getPublishedPolls,
	});
	return (
		<ol className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-2">
			{publishedPollsQuery.data?.map((poll) => (
				<PollCardLanding poll={poll} key={poll.slug} />
			))}
		</ol>
	);
};

export default ListPublishedPolls;

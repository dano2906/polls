import type { getPublishedPolls } from "#/actions/poll";
import PollCardLanding from "./poll-card-landing";

interface Props {
	data: Awaited<ReturnType<typeof getPublishedPolls>>;
}

const ListPublishedPolls = ({ data }: Props) => {
	return (
		<ol className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-2">
			{data?.map((poll) => (
				<PollCardLanding poll={poll} key={poll.slug} />
			))}
		</ol>
	);
};

export default ListPublishedPolls;

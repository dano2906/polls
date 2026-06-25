import { DataTable } from "@/common/components/partials/data-table";
import type { getUserAnsweredPolls } from "../actions/user";
import { listUserAnsweredPolls } from "./columns";

interface Props {
	polls: Awaited<ReturnType<typeof getUserAnsweredPolls>>;
}

const ListUserAnsweredPolls = ({ polls }: Props) => {
	return (
		<DataTable
			columns={listUserAnsweredPolls}
			data={polls ?? []}
			filteringColumns={["name", "description"]}
			mode="client"
		/>
	);
};

export default ListUserAnsweredPolls;

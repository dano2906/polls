import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/common/components/partials/data-table";
import { getUserSessionsOptions } from "../lib/query";
import { listUserSessionsColumns } from "./columns";

const ListUserSessions = ({ id }: { id: string }) => {
	const { data, isLoading } = useQuery(getUserSessionsOptions(id));
	return (
		<DataTable
			columns={listUserSessionsColumns}
			data={data?.sessions ?? []}
			filteringColumns={["ipAddress"]}
			isLoading={isLoading}
			mode="client"
		/>
	);
};

export default ListUserSessions;

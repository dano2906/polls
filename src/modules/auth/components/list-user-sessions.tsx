import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/common/components/partials/data-table";
import PageHeading from "@/common/components/partials/page-heading";
import { getUserSessionsOptions } from "../lib/query";
import { listUserSessionsColumns } from "./columns";
import RevokeSessionsButton from "./revoke-sessions-button";

const ListUserSessions = ({ id }: { id: string }) => {
	const { data, isLoading } = useQuery(getUserSessionsOptions(id));
	return (
		<section className="w-full space-y-4">
			<PageHeading>Sesiones</PageHeading>
			<div className="flex flex-wrap items-center justify-start">
				<RevokeSessionsButton mode="all" id={id} buttonVariant="secondary" />
			</div>
			<DataTable
				columns={listUserSessionsColumns}
				data={data?.sessions ?? []}
				filteringColumns={["ipAddress"]}
				isLoading={isLoading}
				mode="client"
			/>
		</section>
	);
};

export default ListUserSessions;

import { DataTable } from "@/common/components/partials/data-table";
import type { listOrgMembersAction } from "../actions/organization";
import { listMembersColumns } from "./columns";
import MembersTableActions from "./members-table-actions";

const ListOrgMembers = ({
	members,
	slug,
}: {
	members: Awaited<ReturnType<typeof listOrgMembersAction>>["members"];
	slug: string;
}) => {
	return (
		<DataTable
			columns={listMembersColumns}
			data={members ?? []}
			filteringColumns={["role"]}
			mode="client"
		>
			<MembersTableActions slug={slug} />
		</DataTable>
	);
};

export default ListOrgMembers;

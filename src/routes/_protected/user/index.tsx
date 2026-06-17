import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { listUsersColumns } from "@/auth/components/columns";
import UserTableActions from "@/auth/components/user-table-actions";
import { listUserOptions } from "@/auth/lib/query";
import { DataTable } from "@/common/components/partials/data-table";
import PageHeading from "@/common/components/partials/page-heading";
import { filtersSchema } from "@/common/lib/validation";

export const Route = createFileRoute("/_protected/user/")({
	component: RouteComponent,
	validateSearch: filtersSchema,
	loaderDeps: ({ search }) => ({
		...search,
	}),
	loader: ({ context, deps }) => {
		context.queryClient.ensureQueryData(
			listUserOptions({
				limit: deps.limit,
				offset: deps.offset,
				searchField: deps.searchField as "email" | "name" | undefined,
				searchValue: deps.searchValue,
				sortBy: deps.sortBy as "email" | "name" | undefined,
				sortDirection: deps.sortDirection,
			}),
		);
	},
});

function RouteComponent() {
	const search = Route.useSearch();
	const { data, isLoading } = useSuspenseQuery(
		listUserOptions({
			...search,
			searchField: search.searchField as "email" | "name" | undefined,
			searchValue:
				search.searchValue && search.searchValue.length > 0
					? search.searchValue
					: undefined,
			sortBy: search.sortBy as "email" | "name" | undefined,
			sortDirection: search.sortDirection,
		}),
	);
	return (
		<div className="container mx-auto py-10 space-y-4">
			<PageHeading>Ususrios</PageHeading>
			<DataTable
				columns={listUsersColumns}
				data={data?.data?.users ?? []}
				filteringColumns={["email", "name"]}
				total={data?.data?.total ?? 0}
				isLoading={isLoading}
				mode="server"
			>
				<UserTableActions />
			</DataTable>
		</div>
	);
}

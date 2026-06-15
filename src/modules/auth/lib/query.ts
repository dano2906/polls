import { queryOptions } from "@tanstack/react-query";
import { authClient } from "./auth-client";

export const listUserOptions = (filters: {
	limit: number;
	offset: number;
	sortBy?: "name" | "email";
	searchField?: "name" | "email";
	searchValue?: string;
	sortDirection?: "asc" | "desc";
}) =>
	queryOptions({
		queryKey: ["user", "list", filters],
		queryFn: () =>
			authClient.admin.listUsers({
				query: { ...filters },
			}),
	});

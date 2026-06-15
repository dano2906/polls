import { queryOptions } from "@tanstack/react-query";
import { listUserSessions } from "../actions/user";
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

export const getUserOptions = (id: string) =>
	queryOptions({
		queryKey: ["user", "details", id],
		queryFn: async () =>
			await authClient.admin.getUser({
				query: {
					id,
				},
			}),
	});

export const getUserSessionsOptions = (id: string) =>
	queryOptions({
		queryKey: ["user", "sessions", id],
		queryFn: async () => listUserSessions({ data: { id } }),
	});

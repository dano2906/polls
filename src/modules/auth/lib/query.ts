import { queryOptions } from "@tanstack/react-query";
import {
	getUser,
	getUserAnsweredPolls,
	listUserSessions,
} from "../actions/user";
import { authClient } from "./auth-client";

export const userQKs = {
	all: ["users"] as const,
	session: ["session"] as const,
	lists: () => [...userQKs.all, "list"] as const,
	list: (filters?: Record<string, any>) =>
		[...userQKs.lists(), { filters }] as const,
	details: () => [...userQKs.all, "detail"] as const,
	detail: (id: string | number) => [...userQKs.details(), id] as const,
	sessions: (id: string | number) =>
		[...userQKs.list(), ...userQKs.session, id] as const,
	poll: (id: string | number) => [...userQKs.list(), "poll", id] as const,
};

export const userMKs = {
	ban: (id: string | number) => [...userQKs.all, "ban", id],
	unban: (id: string | number) => [...userQKs.all, "unban", id],
	changePass: (id: string | number) => [...userQKs.all, "change-password", id],
	changeAvatar: (id: string | number) => [...userQKs.all, "change-avatar", id],
	remove: (id: string | number) => [...userQKs.all, "remove", id],
	revokeSessions: (id: string | number) => [
		...userQKs.all,
		...userQKs.session,
		"revoke",
		id,
	],
	updateProfile: (id: string | number) => [
		...userQKs.all,
		"update-profile",
		id,
	],
};

export const listUserOptions = (filters: {
	limit: number;
	offset: number;
	sortBy?: "name" | "email";
	searchField?: "name" | "email";
	searchValue?: string;
	sortDirection?: "asc" | "desc";
}) =>
	queryOptions({
		queryKey: userQKs.list(filters),
		queryFn: () =>
			authClient.admin.listUsers({
				query: { ...filters },
			}),
	});

export const getUserOptions = (id: string) =>
	queryOptions({
		queryKey: userQKs.detail(id),
		queryFn: () => getUser({ data: { id } }),
	});

export const getUserSessionsOptions = (id: string) =>
	queryOptions({
		queryKey: userQKs.sessions(id),
		queryFn: async () => listUserSessions({ data: { id } }),
	});

export const getUserAnsweredPollsOptions = (id: string) =>
	queryOptions({
		queryKey: userQKs.poll(id),
		queryFn: () => getUserAnsweredPolls({ data: { userId: id } }),
	});

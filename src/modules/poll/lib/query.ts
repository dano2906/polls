import { queryOptions } from "@tanstack/react-query";
import type { ExportFormat } from "@/common/shared/types";
import {
	getCompactUserPolls,
	getListedUserPolls,
	getPollDetails,
	getPublishedPolls,
	getUserPollResults,
} from "../actions/poll";
import type { PollStatus } from "../shared/types";

export const pollQKs = {
	all: ["polls"] as const,
	environment: (env: "landing" | "dashboard") =>
		env === "dashboard" ? ["dashboad"] : ["landing"],
	lists: () => [...pollQKs.all, "list"],
	landingList: (filters?: Record<string, any>) => [
		...pollQKs.lists(),
		...pollQKs.environment("landing"),
		{ filters },
	],
	compactList: (filters?: Record<string, any>) => [
		...pollQKs.lists(),
		...pollQKs.environment("dashboard"),
		"compact",
		{ filters },
	],
	flatList: (filters?: Record<string, any>) => [
		...pollQKs.lists(),
		...pollQKs.environment("dashboard"),
		"flat",
		{ filters },
	],
	details: () => [...pollQKs.all, "details"],
	detail: (slug: string) => [...pollQKs.details(), slug],
	result: ({ slug, userId }: { slug: string; userId: string }) => [
		...pollQKs.all,
		"result",
		slug,
		userId,
	],
};

export const pollMKs = {
	changeStatus: (slug: string) => [pollQKs.all, "change-status", slug],
	remove: (slug: string) => [pollQKs.all, "remove", slug],
	export: ({ slug, format }: { slug: string; format: ExportFormat }) => [
		pollQKs.all,
		"export",
		slug,
		format,
	],
	import: () => [...pollQKs.all, "import"],
	fork: (slug: string) => [pollQKs.all, "fork", slug],
};

export const landingPollsOptions = ({
	q = "",
	status = "published",
}: {
	q: string;
	status: PollStatus;
}) =>
	queryOptions({
		queryKey: pollQKs.landingList({ q, status }),
		queryFn: () => getPublishedPolls({ data: { q, status } }),
		staleTime: 60 * 1000,
	});

export const compactPollsOptions = ({
	q = "",
	status = "draft",
	userId,
}: {
	q: string;
	status: PollStatus | "all";
	userId: string;
}) =>
	queryOptions({
		queryKey: pollQKs.compactList({ q, status, userId }),
		queryFn: () =>
			getCompactUserPolls({
				data: {
					userId,
					q,
					status,
				},
			}),
		staleTime: 30 * 1000,
	});

export const flatPollsOptions = ({
	q = "",
	status = "draft",
	userId,
}: {
	q: string;
	status: PollStatus | "all";
	userId: string;
}) =>
	queryOptions({
		queryKey: pollQKs.flatList({ q, status, userId }),
		queryFn: () =>
			getListedUserPolls({
				data: {
					userId,
					q,
					status,
				},
			}),
		staleTime: 30 * 1000,
	});

export const pollDetailsOptions = (slug: string) =>
	queryOptions({
		queryKey: pollQKs.detail(slug),
		queryFn: () =>
			getPollDetails({
				data: {
					slug,
				},
			}),
		staleTime: 10 * 1000,
	});

export const pollResultOptions = ({
	slug,
	userId,
}: {
	slug: string;
	userId: string;
}) =>
	queryOptions({
		queryKey: pollQKs.result({ slug, userId }),
		queryFn: () =>
			getUserPollResults({
				data: {
					slug,
					userId,
				},
			}),
		staleTime: 30 * 1000,
	});

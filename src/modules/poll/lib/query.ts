import { queryOptions } from "@tanstack/react-query";
import {
	getCompactUserPolls,
	getListedUserPolls,
	getPollDetails,
	getPublishedPolls,
	getUserPollResults,
} from "../actions/poll";
import type { PollStatus } from "../shared/types";

export const landingPollsOptions = ({
	q = "",
	status = "published",
}: {
	q: string;
	status: PollStatus;
}) =>
	queryOptions({
		queryKey: ["poll", "landing", "published", { q, status }],
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
		queryKey: ["poll", "dashboard", "compact", { q, status }],
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

export const listPollsOptions = ({
	q = "",
	status = "draft",
	userId,
}: {
	q: string;
	status: PollStatus | "all";
	userId: string;
}) =>
	queryOptions({
		queryKey: ["poll", "dashboard", "list", { q, status }],
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
		queryKey: ["poll", "details", slug],
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
		queryKey: ["poll", "result", slug, userId],
		queryFn: () =>
			getUserPollResults({
				data: {
					slug,
					userId,
				},
			}),
		staleTime: 30 * 1000,
	});

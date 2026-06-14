import { queryOptions } from "@tanstack/react-query";
import {
	getCompactUserPolls,
	getListedUserPolls,
	getPublishedPolls,
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
	});

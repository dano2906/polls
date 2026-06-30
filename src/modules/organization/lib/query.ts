import { queryOptions } from "@tanstack/react-query";
import {
	getFullOrganization,
	getOrganizationBySlug,
	getOrganizationPolls,
	listOrganizations,
	listOrgMembersAction,
} from "../actions/organization";

export const organizationQKs = {
	all: ["organizations"] as const,
	lists: () => [...organizationQKs.all, "list"],
	list: (filters?: Record<string, any>) => [
		...organizationQKs.lists(),
		{ filters },
	],
	details: () => [...organizationQKs.all, "detail"] as const,
	bySlug: (slug: string) =>
		[...organizationQKs.details(), "slug", slug] as const,
	byId: (id: string | number) =>
		[...organizationQKs.details(), "full", id] as const,
	members: () => [...organizationQKs.all, "members"],
	member: (id: string | number) => [...organizationQKs.members(), id] as const,
	polls: (filters?: Record<string, any>) => [
		...organizationQKs.list(filters),
		"polls",
	],
};

export const listOrganizationsOptions = () =>
	queryOptions({
		queryKey: organizationQKs.list(),
		queryFn: () => listOrganizations(),
	});

export const organizationBySlugOptions = (slug: string) =>
	queryOptions({
		queryKey: organizationQKs.bySlug(slug),
		queryFn: () => getOrganizationBySlug({ data: { slug } }),
	});

export const fullOrganizationOptions = (organizationId: string) =>
	queryOptions({
		queryKey: organizationQKs.byId(organizationId),
		queryFn: () => getFullOrganization({ data: { organizationId } }),
	});

export const orgMembersOptions = (organizationId: string) =>
	queryOptions({
		queryKey: organizationQKs.member(organizationId),
		queryFn: () => listOrgMembersAction({ data: { organizationId } }),
	});

export const orgPollsOptions = ({
	organizationId,
	q = "",
	status = "all",
}: {
	organizationId: string;
	q: string;
	status: string;
}) =>
	queryOptions({
		queryKey: organizationQKs.polls({ organizationId, q, status }),
		queryFn: () =>
			getOrganizationPolls({
				data: { organizationId, q, status },
			}),
	});

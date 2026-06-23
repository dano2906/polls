import { queryOptions } from "@tanstack/react-query";
import {
	getFullOrganization,
	getOrganizationBySlug,
	getOrganizationPolls,
	listOrganizations,
	listOrgMembersAction,
} from "../actions/organization";

export const listOrganizationsOptions = () =>
	queryOptions({
		queryKey: ["organization", "list"],
		queryFn: () => listOrganizations(),
	});

export const organizationBySlugOptions = (slug: string) =>
	queryOptions({
		queryKey: ["organization", "slug", slug],
		queryFn: () => getOrganizationBySlug({ data: { slug } }),
	});

export const fullOrganizationOptions = (organizationId: string) =>
	queryOptions({
		queryKey: ["organization", "full", organizationId],
		queryFn: () => getFullOrganization({ data: { organizationId } }),
	});

export const orgMembersOptions = (organizationId: string) =>
	queryOptions({
		queryKey: ["organization", "members", organizationId],
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
		queryKey: ["organization", "polls", organizationId, { q, status }],
		queryFn: () =>
			getOrganizationPolls({
				data: { organizationId, q, status },
			}),
	});

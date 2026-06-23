import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, asc, eq, like, or } from "drizzle-orm";
import { auth } from "@/auth/lib/auth";
import { db } from "@/common/db";
import { organization, poll } from "@/common/db/schema";
import { pollsSearchFilterWithOrgSchema } from "@/poll/lib/validation";

export const listOrganizations = createServerFn({ method: "GET" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const data = await auth.api.listOrganizations({ headers });
		return data ?? [];
	},
);

export const getFullOrganization = createServerFn({ method: "GET" })
	.validator((data: { organizationId: string }) => data)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		return await auth.api.getFullOrganization({
			query: { organizationId: data.organizationId },
			headers,
		});
	});

export const createOrganizationAction = createServerFn({ method: "POST" })
	.validator((data: { name: string; slug: string; userId: string }) => data)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		return await auth.api.createOrganization({
			body: {
				name: data.name,
				slug: data.slug,
				userId: data.userId,
			},
			headers,
		});
	});

export const updateOrganizationAction = createServerFn({ method: "POST" })
	.validator(
		(data: { organizationId: string; name?: string; slug?: string }) => data,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		return await auth.api.updateOrganization({
			body: {
				data: {
					name: data.name,
					slug: data.slug,
				},
				organizationId: data.organizationId,
			},
			headers,
		});
	});

export const deleteOrganizationAction = createServerFn({ method: "POST" })
	.validator((data: { organizationId: string }) => data)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		return await auth.api.deleteOrganization({
			body: { organizationId: data.organizationId },
			headers,
		});
	});

export const listOrgMembersAction = createServerFn({ method: "GET" })
	.validator((data: { organizationId: string }) => data)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		return await auth.api.listMembers({
			query: { organizationId: data.organizationId },
			headers,
		});
	});

export const inviteMemberAction = createServerFn({ method: "POST" })
	.validator(
		(data: { organizationId: string; email: string; role: string }) => data,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const user = await db.query.user.findFirst({
			where: (user, { eq }) => eq(user.email, data.email),
			columns: {
				id: true,
			},
		});
		if (!user) {
			throw notFound();
		}
		return await auth.api.addMember({
			body: {
				organizationId: data.organizationId,
				userId: user.id,
				role: data.role as "member" | "admin",
			},
			headers,
		});
	});

export const removeMemberAction = createServerFn({ method: "POST" })
	.validator(
		(data: { organizationId: string; memberIdOrEmail: string }) => data,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		return await auth.api.removeMember({
			body: {
				organizationId: data.organizationId,
				memberIdOrEmail: data.memberIdOrEmail,
			},
			headers,
		});
	});

export const updateMemberRoleAction = createServerFn({ method: "POST" })
	.validator(
		(data: { organizationId: string; memberId: string; role: string }) => data,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		return await auth.api.updateMemberRole({
			body: {
				organizationId: data.organizationId,
				memberId: data.memberId,
				role: data.role,
			},
			headers,
		});
	});

export const getOrganizationBySlug = createServerFn({ method: "GET" })
	.validator((data: { slug: string }) => data)
	.handler(async ({ data }) => {
		const org = await db.query.organization.findFirst({
			where: eq(organization.slug, data.slug),
		});

		if (!org) throw notFound();

		return {
			...org,
		};
	});

export const getOrganizationPolls = createServerFn({ method: "GET" })
	.validator(pollsSearchFilterWithOrgSchema)
	.handler(async ({ data }) => {
		const { organizationId, q, status } = data;

		const conditions = [];
		conditions.push(eq(poll.organizationId, organizationId));

		if (status && status !== "all") {
			conditions.push(eq(poll.status, status));
		}

		if (q && q.trim() !== "") {
			const searchTerm = `%${q.trim()}%`;
			conditions.push(
				or(like(poll.name, searchTerm), like(poll.description, searchTerm)),
			);
		}

		const res = await db
			.select()
			.from(poll)
			.where(and(...conditions))
			.orderBy(asc(poll.startDate));

		return res ?? [];
	});

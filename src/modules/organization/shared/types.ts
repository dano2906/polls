import type { z } from "zod";
import type {
	createOrganizationSchema,
	INVITATION_STATUSES,
	MEMBER_ROLES,
	selectInvitationSchema,
	selectOrganizationRoleSchema,
	selectOrganizationSchema,
	selectTeamSchema,
} from "../lib/validation";

export type CreateOrganization = z.infer<typeof createOrganizationSchema>;
export type Organization = z.infer<typeof selectOrganizationSchema>;
export type Member = {
	id: string;
	organizationId: string;
	role: MemberRole;
	createdAt: Date;
	userId: string;
	user: {
		id: string;
		email: string;
		name: string;
		image?: string | null;
	};
};
export type Invitation = z.infer<typeof selectInvitationSchema>;
export type OrganizationRole = z.infer<typeof selectOrganizationRoleSchema>;
export type Team = z.infer<typeof selectTeamSchema>;
export type MemberRole = (typeof MEMBER_ROLES)[number];
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
	invitation,
	member,
	organization,
	organizationRole,
	team,
} from "@/common/db/schema";

export const selectOrganizationSchema = createSelectSchema(organization);
export const selectMemberSchema = createSelectSchema(member);
export const selectInvitationSchema = createSelectSchema(invitation);
export const selectOrganizationRoleSchema = createSelectSchema(organizationRole);
export const selectTeamSchema = createSelectSchema(team);

export const MEMBER_ROLES = ["admin", "member", "owner"] as const;
export const memberRoleSchema = z.enum(MEMBER_ROLES);

export const INVITATION_STATUSES = [
	"pending",
	"accepted",
	"rejected",
	"cancelled",
] as const;
export const invitationStatusSchema = z.enum(INVITATION_STATUSES);

export const createOrganizationSchema = z.object({
	name: z
		.string()
		.min(2, "El nombre debe tener al menos 2 caracteres")
		.max(100, "El nombre debe tener máximo 100 caracteres"),
	slug: z
		.string()
		.min(3, "El slug debe tener al menos 3 caracteres")
		.max(50, "El slug debe tener máximo 50 caracteres")
		.regex(
			/^[a-z0-9-]+$/,
			"El slug solo puede contener letras minúsculas, números y guiones",
		),
});

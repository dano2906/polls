import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
	...defaultStatements,
	polls: ["create", "share", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
	polls: ["create", "update"],
	...adminAc.statements,
});
export const user = ac.newRole({
	polls: ["create"],
});

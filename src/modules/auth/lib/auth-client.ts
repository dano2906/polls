import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin, user } from "./permissions";

export const authClient = createAuthClient({
	baseURL: process.env.BETTER_AUTH_URL,
	plugins: [
		adminClient({
			ac,
			roles: {
				admin,
				user,
			},
		}),
		organizationClient(),
	],
});

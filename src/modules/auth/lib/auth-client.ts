import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin, user } from "./permissions";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_PUBLIC_APP_URL,
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

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin, organization } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/common/db";
import * as schemas from "@/common/db/schema";
import { ac, admin, user } from "./permissions";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: schemas.user,
			account: schemas.account,
			verification: schemas.verification,
			session: schemas.session,
			organization: schemas.organization,
			member: schemas.member,
			invitation: schemas.invitation,
			organizationRole: schemas.organizationRole,
			team: schemas.team,
			teamMember: schemas.teamMember,
		},
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
	},
	rateLimit: {
		enabled: true,
		window: 10,
		max: 100,
		customRules: {
			"/api/auth/sign-in/email": { window: 60, max: 5 },
			"/api/auth/sign-up/email": { window: 60, max: 3 },
		},
	},
	plugins: [
		adminPlugin({
			ac,
			roles: {
				admin,
				user,
			},
		}),
		organization({
			allowUserToCreateOrganization: true,
			creatorRole: "owner",
			invitationExpiresIn: 60 * 60 * 27 * 7,
		}),
		tanstackStartCookies(),
	],
	experimental: { joins: true },
	baseURL: process.env.BETTER_AUTH_URL as string,
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
	},
});

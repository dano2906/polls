import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import * as schemas from "@/common/db/schema";
import { db } from "../../common/db";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: schemas.user,
			account: schemas.account,
			verification: schemas.verification,
			session: schemas.session,
		},
	}),
	plugins: [tanstackStartCookies()],
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

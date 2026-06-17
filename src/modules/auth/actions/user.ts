import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "../lib/auth";
import { revokeSessionSchema, updateAvatarSchema } from "../lib/validation";
import { getSession } from "./auth";

export const updateAvatarAction = createServerFn({ method: "POST" })
	.validator(updateAvatarSchema)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		await auth.api.adminUpdateUser({
			body: {
				userId: data.id,
				data: { image: data.url },
			},
			headers,
		});

		return { success: true };
	});

export const listUserSessions = createServerFn({ method: "POST" })
	.validator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const { sessions } = await auth.api.listUserSessions({
			body: {
				userId: data.id,
			},
			headers,
		});

		return { sessions };
	});

export const revokeUserSession = createServerFn({ method: "POST" })
	.validator(revokeSessionSchema)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await getSession();

		let success = false;
		let shouldRedirect = false;

		if (data.mode === "single") {
			const response = await auth.api.revokeUserSession({
				body: { sessionToken: data.token },
				headers,
			});
			success = response.success;
			shouldRedirect = success && session?.session.token === data.token;
		} else {
			const response = await auth.api.revokeUserSessions({
				body: { userId: data.id },
				headers,
			});
			success = response.success;
			shouldRedirect = success && session?.session.userId === data.id;
		}

		if (shouldRedirect) {
			throw redirect({ to: "/" });
		}

		return { success };
	});

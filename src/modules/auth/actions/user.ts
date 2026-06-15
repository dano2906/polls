import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "../lib/auth";
import { updateAvatarSchema } from "../lib/validation";

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

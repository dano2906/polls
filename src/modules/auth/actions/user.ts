import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import z from "zod";
import { passwordSchema } from "@/common/lib/validation";
import { auth } from "../lib/auth";
import {
	banUserSchema,
	createUserSchema,
	editUserSchema,
	revokeSessionSchema,
	updateAvatarSchema,
} from "../lib/validation";
import { getSession } from "./auth";

export const updateAvatarAction = createServerFn({ method: "POST" })
	.validator(updateAvatarSchema)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user) throw new Error("UNAUTHORIZED");
		if (session.user.role !== "admin" && session.user.id !== data.id) {
			throw new Error("FORBIDDEN");
		}

		const headers = getRequestHeaders();
		if (session.user.role === "admin") {
			await auth.api.adminUpdateUser({
				body: {
					userId: data.id,
					data: { image: data.url },
				},
				headers,
			});
		} else {
			await auth.api.updateUser({
				body: { image: data.url },
				headers,
			});
		}

		return { success: true };
	});

export const listUserSessions = createServerFn({ method: "POST" })
	.validator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user) throw new Error("UNAUTHORIZED");
		if (session.user.role !== "admin") throw new Error("FORBIDDEN");

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

		if (!session?.user) throw new Error("UNAUTHORIZED");

		let success = false;
		let shouldRedirect = false;

		if (data.mode === "single") {
			const response = await auth.api.revokeUserSession({
				body: { sessionToken: data.token },
				headers,
			});
			success = response.success;
			shouldRedirect = success && session.session.token === data.token;
		} else {
			if (session.user.role !== "admin" && session.user.id !== data.id) {
				throw new Error("FORBIDDEN");
			}
			const response = await auth.api.revokeUserSessions({
				body: { userId: data.id },
				headers,
			});
			success = response.success;
			shouldRedirect = success && session.session.userId === data.id;
		}

		if (shouldRedirect) {
			throw redirect({ to: "/" });
		}

		return { success };
	});

export const banUser = createServerFn({ method: "POST" })
	.validator(banUserSchema)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user) throw new Error("UNAUTHORIZED");
		if (session.user.role !== "admin") throw new Error("FORBIDDEN");

		const headers = getRequestHeaders();
		await auth.api.banUser({
			body: {
				userId: data.id,
				banReason: data.banReason,
				banExpiresIn: 60 * 60 * 24 * data.banExpiresIn,
			},
			headers,
		});
		return {
			success: true,
		};
	});

export const unbanUser = createServerFn({ method: "POST" })
	.validator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user) throw new Error("UNAUTHORIZED");
		if (session.user.role !== "admin") throw new Error("FORBIDDEN");

		const headers = getRequestHeaders();
		await auth.api.unbanUser({
			body: {
				userId: data.id,
			},
			headers,
		});
		return {
			success: true,
		};
	});

export const createUser = createServerFn({ method: "POST" })
	.validator(createUserSchema)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user) throw new Error("UNAUTHORIZED");
		if (session.user.role !== "admin") throw new Error("FORBIDDEN");

		await auth.api.createUser({
			body: {
				...data,
				data: {
					image: data.avatar,
				},
			},
		});
		return {
			success: true,
		};
	});

export const removeUser = createServerFn({ method: "POST" })
	.validator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user) throw new Error("UNAUTHORIZED");
		if (session.user.role !== "admin") throw new Error("FORBIDDEN");
		if (session.user.id === data.id) {
			throw new Error("No se puede eliminar tu propia cuenta");
		}

		const headers = getRequestHeaders();
		await auth.api.removeUser({
			body: {
				userId: data.id,
			},
			headers,
		});
		return {
			success: true,
		};
	});

export const getUser = createServerFn({ method: "GET" })
	.validator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user) throw new Error("UNAUTHORIZED");
		if (session.user.role !== "admin" && session.user.id !== data.id) {
			throw new Error("FORBIDDEN");
		}

		const headers = getRequestHeaders();
		return await auth.api.getUser({
			query: {
				id: data.id,
			},
			headers,
		});
	});

export const editUser = createServerFn({ method: "POST" })
	.validator((data: { id: string; user: any }) => ({
		id: data.id,
		user: editUserSchema.parse(data.user),
	}))
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user) throw new Error("UNAUTHORIZED");
		if (session.user.role !== "admin") throw new Error("FORBIDDEN");

		const headers = getRequestHeaders();
		await auth.api.adminUpdateUser({
			body: {
				userId: data.id,
				data: {
					...data.user,
					image: data.user.avatar,
				},
			},
			headers,
		});
		return {
			success: true,
		};
	});

export const changeUserPassword = createServerFn({ method: "POST" })
	.validator((data: { id: string; newPassword: string }) => ({
		id: data.id,
		newPassword: passwordSchema.parse(data.newPassword),
	}))
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user) throw new Error("UNAUTHORIZED");
		if (session.user.role !== "admin" && session.user.id !== data.id) {
			throw new Error("FORBIDDEN");
		}

		const headers = getRequestHeaders();
		const { status } = await auth.api.setUserPassword({
			body: {
				newPassword: data.newPassword,
				userId: data.id,
			},
			headers,
		});
		if (!status) {
			throw new Error("Error al cambiar la contraseña");
		}

		if (session.user.id === data.id) {
			throw redirect({ to: "/" });
		}

		return { success: true };
	});

export const updateProfile = createServerFn({ method: "POST" })
	.validator(
		z.object({
			name: z.string().min(1).max(200),
		}),
	)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user) throw new Error("UNAUTHORIZED");

		const headers = getRequestHeaders();
		await auth.api.updateUser({
			body: {
				name: data.name,
			},
			headers,
		});

		return { success: true };
	});

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/common/lib/auth";

export const getSession = createServerFn({ method: "GET" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		return session;
	},
);

export const ensureSession = createServerFn({ method: "GET" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			throw new Error("Unauthorized");
		}

		return session;
	},
);

export const hashPassword = createServerFn({ method: "POST" })
	.validator((data: { password: string }) => data)
	.handler(async ({ data }) => {
		const salt = randomBytes(16).toString("hex");
		const hash = scryptSync(data.password, salt, 64).toString("hex");
		return `${salt}:${hash}`;
	});
export const verifyPassword = createServerFn({ method: "POST" })
	.validator((data: { passwordAttempt: string; storedValue: string }) => data)
	.handler(async ({ data }) => {
		const [salt, storedHash] = data.storedValue.split(":");
		if (!salt || !storedHash) return false;

		// Generamos el hash del intento del usuario usando el mismo salt extraído
		const attemptHash = scryptSync(data.passwordAttempt, salt, 64).toString(
			"hex",
		);

		// Convertimos a buffers para realizar una comparación en tiempo constante (evita ataques de sincronización)
		return timingSafeEqual(
			Buffer.from(storedHash, "hex"),
			Buffer.from(attemptHash, "hex"),
		);
	});

import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { poll } from "#/db/schema.ts";
import { generateRandomCode } from "#/lib/utils.ts";
import { createPollInput } from "#/shared/validation.ts";
import { db } from "../db";

export const createPoll = createServerFn({ method: "POST" })
	.inputValidator((data) => createPollInput.parse(data))
	.handler(async ({ data }) => {
		try {
			const newId = randomUUID();
			const res = await db.insert(poll).values({
				...data,
				id: newId,
				slug:
					data.slug && data.slug.length === 6
						? data.slug
						: generateRandomCode(),
			});
			if (res.rowsAffected > 0) {
				return {
					id: newId,
				};
			}
		} catch (error) {
			console.log("error", error);
		}
	});

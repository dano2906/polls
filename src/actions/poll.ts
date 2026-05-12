import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { poll } from "#/db/schema.ts";
import { generateRandomCode } from "#/lib/utils.ts";
import { createPollInput } from "#/shared/validation.ts";
import { db } from "@/db";

export const getUserPolls = createServerFn({ method: "GET" })
	.inputValidator((data: { userId: string }) => data)
	.handler(async ({ data }) => {
		try {
			const res = await db
				.select({
					name: poll.name,
					description: poll.description,
					slug: poll.slug,
					startDate: poll.startDate,
					endDate: poll.endDate,
					status: poll.status,
					version: poll.version,
				})
				.from(poll)
				.where(eq(poll.userId, data.userId))
				.orderBy(asc(poll.startDate));
			if (!res || res.length === 0) return [];
			return res;
		} catch (error) {
			console.log("error", error);
		}
	});

export const getPollDetails = createServerFn({ method: "GET" })
	.inputValidator((data: { slug: string }) => data)
	.handler(async ({ data }) => {
		return await db.query.poll.findFirst({
			where: (poll, { eq }) => eq(poll.slug, data.slug),
			columns: {
				description: true,
				endDate: true,
				name: true,
				startDate: true,
				status: true,
				version: true,
			},
			with: {
				pollQuestions: {
					columns: {
						order: true,
					},
					with: {
						question: {
							with: {
								answers: true,
							},
						},
					},
				},
			},
		});
	});

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

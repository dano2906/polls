import { randomUUID } from "node:crypto";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { poll } from "#/db/schema.ts";
import { generateRandomCode } from "#/lib/utils.ts";
import {
	createPollInput,
	editPollInput,
	forkPollInput,
} from "#/shared/validation.ts";
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
		const poll = await db.query.poll.findFirst({
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
						pollId: true,
					},
					with: {
						question: {
							with: {
								answers: {
									columns: {
										metadata: false,
									},
								},
							},
						},
					},
				},
			},
		});
		if (!poll) {
			throw notFound();
		}
		const questions = poll.pollQuestions.map((item) => {
			return {
				order: item.order,
				pollId: item.pollId,
				...item.question,
			};
		});
		return {
			name: poll.name,
			description: poll.description,
			startDate: poll.startDate,
			endDate: poll.endDate,
			status: poll.status,
			version: poll.version,
			metadata: undefined,
			questions,
		};
	});

export const createPoll = createServerFn({ method: "POST" })
	.inputValidator(createPollInput)
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

export const forkPoll = createServerFn({ method: "POST" })
	.inputValidator(forkPollInput)
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

export const updatePoll = createServerFn({ method: "POST" })
	.inputValidator(({ slug, values }) => ({
		slug,
		updatedData: editPollInput.parse(values),
	}))
	.handler(async ({ data }) => {
		try {
			if (!data.slug) {
				throw new Error("El slug es necesario para identificar la encuesta");
			}
			const res = await db
				.update(poll)
				.set({
					...data.updatedData,
					updatedAt: new Date(),
				})
				.where(eq(poll.slug, data.slug));

			if (res) {
				return {
					success: true,
					slug: data.slug,
				};
			}
		} catch (error) {
			console.error("Error al actualizar la encuesta:", error);
			throw error;
		}
	});

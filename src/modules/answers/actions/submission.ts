import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/common/db";
import { submission } from "@/common/db/schema";

export const createSubmission = createServerFn({ method: "POST" })
	.validator((data: { pollId: string; userId: string }) => data)
	.handler(async ({ data }) => {
		let currentSubmission = await db.query.submission.findFirst({
			where: (submission, { eq, and }) =>
				and(
					eq(submission.pollId, data.pollId),
					eq(submission.userId, data.userId),
				),
		});

		if (!currentSubmission) {
			currentSubmission = {
				id: randomUUID(),
				pollId: data.pollId,
				userId: data.userId,
				startedAt: new Date(),
				submittedAt: null,
				completedAt: null,
			};

			await db
				.insert(submission)
				.values({
					id: randomUUID(),
					pollId: data.pollId,
					userId: data.userId,
					startedAt: new Date(),
					submittedAt: null,
					completedAt: null,
				})
				.returning();
		}

		return currentSubmission;
	});

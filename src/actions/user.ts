import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { poll, submission } from "#/db/schema";
import { getSession } from "#/lib/auth-functions";

export const checkUserSubmissionFn = createServerFn({ method: "GET" })
	.inputValidator((slug: string) => slug)
	.handler(async ({ data: slug }) => {
		const session = await getSession();

		if (!session?.user) {
			return { hasResponded: false };
		}

		const targetPoll = await db.query.poll.findFirst({
			where: eq(poll.slug, slug),
			columns: {
				id: true,
			},
		});

		if (!targetPoll) {
			return { hasResponded: false };
		}

		const existingSubmission = await db.query.submission.findFirst({
			where: and(
				eq(submission.pollId, targetPoll.id),
				eq(submission.userId, session.user.id),
			),
			columns: {
				id: true,
			},
		});

		return { hasResponded: !!existingSubmission };
	});

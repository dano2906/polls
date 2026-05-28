import { redirect } from "@tanstack/react-router";
import { createClientOnlyFn, createServerFn } from "@tanstack/react-start";
import { db } from "#/db";
import { answer, poll, pollQuestions, question } from "#/db/schema";
import { getSession } from "#/lib/auth-functions";
import { exportPoll } from "#/lib/export";
import { generateRandomCode } from "#/lib/utils";
import { type ExportData, ExportFormat } from "#/shared/types";

export const createPollPublicURL = createClientOnlyFn(async (slug: string) => {
	return await navigator.clipboard.writeText(
		`${import.meta.env.VITE_PUBLIC_APP_URL}/p/${slug}`,
	);
});

export const exportPollFn = createClientOnlyFn(
	async ({
		format = ExportFormat.JSON,
		filename = "Encuesta",
		poll,
	}: {
		format: ExportFormat;
		filename: string;
		poll: ExportData;
	}) => {
		switch (format) {
			case "csv":
				exportPoll.csv(poll, filename);
				break;
			case "json":
				exportPoll.json(poll, filename);
				break;
			case "excel":
				exportPoll.excel(poll, filename);
				break;
			default:
				break;
		}
	},
);

export const importPollAction = createServerFn()
	.inputValidator((val: ExportData) => val)
	.handler(async ({ data }) => {
		const session = await getSession();
		if (!session?.user?.id) {
			throw redirect({ to: "/" });
		}
		return await db.transaction(async (tx) => {
			const [newPoll] = await tx
				.insert(poll)
				.values({
					userId: session.user.id,
					name: data.name,
					description: data.description,
					slug: generateRandomCode(),
					status: "draft",
					startDate: data.startDate ? new Date(data.startDate) : new Date(),
					endDate: data.endDate ? new Date(data.endDate) : null,
				})
				.returning();

			for (const q of data.questions) {
				const [newQuestion] = await tx
					.insert(question)
					.values({
						type: q.type,
						questionText: q.questionText,
						hasCorrectAnswers: q.hasCorrectAnswers,
						maxSelections: q.maxSelections ?? 1,
						isRequired: q.isRequired ?? false,
						metadata: q.metadata,
					})
					.returning();

				await tx.insert(pollQuestions).values({
					pollId: newPoll.id,
					questionId: newQuestion.id,
					order: q.order ?? 0,
				});

				if (q.answers && q.answers.length > 0) {
					const answersToInsert = q.answers.map((ans, idx) => ({
						questionId: newQuestion.id,
						answerText: ans.answerText || "",
						isCorrect: ans.isCorrect ?? false,
						order: idx,
					}));

					await tx.insert(answer).values(answersToInsert);
				}
			}

			return { success: true, slug: newPoll.slug };
		});
	});

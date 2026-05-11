import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.default(false)
		.notNull(),
	image: text("image"),
	role: text("role").$type<"admin" | "user" | "anon">().default("user"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const poll = sqliteTable("poll", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	slug: text("slug").unique(),
	status: text("status", { enum: ["draft", "published", "archived"] }).default(
		"draft",
	),
	version: integer("version").default(1),
	startDate: integer("start_date", { mode: "timestamp" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	endDate: integer("end_date", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
	updatedAt: integer("updated_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
	metadata: text("metadata", { mode: "json" }).$type<{
		theme?: string;
		limitResponses?: number;
	}>(),
});

export const question = sqliteTable("question", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	type: text("type", { enum: ["single_choice", "multiple_choice"] }).notNull(),
	text: text("question_text").notNull(),
	hasCorrectAnswers: integer("has_correct_answers", {
		mode: "boolean",
	}).default(false),
	config: text("config", { mode: "json" }).$type<{
		placeholder?: string;
		maxSelections?: number;
		isRequired?: boolean;
	}>(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
});

export const pollQuestions = sqliteTable("poll_question", {
	pollId: text("poll_id")
		.notNull()
		.references(() => poll.id),
	questionId: text("question_id")
		.notNull()
		.references(() => question.id),
	order: integer("order").default(0),
});

export const answer = sqliteTable("answer", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	questionId: text("question_id")
		.notNull()
		.references(() => question.id),
	text: text("option_text").notNull(),
	isCorrect: integer("is_correct", { mode: "boolean" }).default(false),
	order: integer("order").default(0),
	metadata: text("metadata", { mode: "json" }),
});

export const submission = sqliteTable("submission", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	pollId: text("poll_id")
		.notNull()
		.references(() => poll.id),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	submittedAt: integer("submitted_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
});

export const userAnswer = sqliteTable("user_answer", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	submissionId: text("submission_id")
		.notNull()
		.references(() => submission.id),
	questionId: text("question_id")
		.notNull()
		.references(() => question.id),
	answerId: text("answer_id").references(() => answer.id),
	textResponse: text("text_response"),
});

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const pollRelations = relations(poll, ({ many }) => ({
	pollQuestions: many(pollQuestions),
}));

export const questionRelations = relations(question, ({ many }) => ({
	pollQuestions: many(pollQuestions),
	answers: many(answer),
}));

export const pollQuestionRelations = relations(pollQuestions, ({ one }) => ({
	poll: one(poll, {
		fields: [pollQuestions.pollId],
		references: [poll.id],
	}),
	question: one(question, {
		fields: [pollQuestions.questionId],
		references: [question.id],
	}),
}));

export const answerRelations = relations(answer, ({ one }) => ({
	question: one(question, {
		fields: [answer.questionId],
		references: [question.id],
	}),
}));

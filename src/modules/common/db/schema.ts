import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { UserAnswerValue } from "@/answers/shared/types";
import type { UserRole } from "@/auth/shared/types";
import { QUESTION_TYPES, type QuestionMetadata } from "@/question/shared/types";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.default(false)
		.notNull(),
	image: text("image"),
	banned: integer("banned"),
	banReason: text("ban_reason"),
	banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
	role: text("role").$type<UserRole>().default("user"),
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
		impersonatedBy: text("impersonated_by"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		activeOrganizationId: text("active_organization_id"),
		activeTeamId: text("active_team_id"),
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

export const organization = sqliteTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	logo: text("logo"),
	metadata: text("metadata"),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const member = sqliteTable("member", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	role: text("role").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const invitation = sqliteTable("invitation", {
	id: text("id").primaryKey(),
	email: text("email").notNull(),
	inviterId: text("inviter_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	role: text("role"),
	status: text("status").notNull(),
	teamId: text("team_id"),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});

export const organizationRole = sqliteTable("organization_role", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	role: text("role").notNull(),
	permission: text("permission").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

export const team = sqliteTable("team", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

export const teamMember = sqliteTable("team_member", {
	id: text("id").primaryKey(),
	teamId: text("team_id")
		.notNull()
		.references(() => team.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp_ms" }),
});

export const poll = sqliteTable("poll", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	rootId: text("root_id"),
	name: text("name").notNull(),
	description: text("description"),
	slug: text("slug").unique(),
	status: text("status", { enum: ["draft", "published", "archived"] }).default(
		"draft",
	),
	version: integer("version").default(1),
	timeLimit: integer("time_limit"),
	password: text("password"),
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
	organizationId: text("organization_id").references(() => organization.id, {
		onDelete: "set null",
	}),
	metadata: text("metadata", { mode: "json" }).$type<{
		theme?: string;
		limitResponses?: number;
	}>(),
});

export const question = sqliteTable("question", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	type: text("type", {
		enum: QUESTION_TYPES,
	}).notNull(),
	questionText: text("question_text").notNull(),
	hasCorrectAnswers: integer("has_correct_answers", {
		mode: "boolean",
	}).default(false),
	maxSelections: integer("max_selections").default(1),
	isRequired: integer("is_required", { mode: "boolean" })
		.default(false)
		.notNull(),
	imageUrl: text("image_url"),
	imagePublicId: text("image_public_id"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`CURRENT_TIMESTAMP`,
	),
	metadata: text("metadata", { mode: "json" })
		.$type<QuestionMetadata>()
		.notNull(),
});

export const pollQuestions = sqliteTable("poll_question", {
	pollId: text("poll_id")
		.notNull()
		.references(() => poll.id, { onDelete: "cascade" }),
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
	answerText: text("answer_text").notNull(),
	isCorrect: integer("is_correct", { mode: "boolean" })
		.default(false)
		.notNull(),
	order: integer("order").default(0),
	imageUrl: text("image_url"),
	imagePublicId: text("image_public_id"),
	metadata: text("metadata", { mode: "json" }),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
});

export const submission = sqliteTable(
	"submission",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		pollId: text("poll_id")
			.notNull()
			.references(() => poll.id, { onDelete: "cascade" }),
		userId: text("userId")
			.notNull()
			.references(() => user.id),
		submittedAt: integer("submitted_at", { mode: "timestamp" }).default(
			sql`CURRENT_TIMESTAMP`,
		),
		startedAt: integer("started_at", { mode: "timestamp" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		completedAt: integer("completed_at", { mode: "timestamp" }),
	},
	(table) => [
		uniqueIndex("user_poll_unique_idx").on(table.userId, table.pollId),
	],
);

export const userAnswer = sqliteTable("user_answer", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	submissionId: text("submission_id")
		.notNull()
		.references(() => submission.id, { onDelete: "cascade" }),
	questionId: text("question_id")
		.notNull()
		.references(() => question.id),
	value: text("value", { mode: "json" }).$type<UserAnswerValue>().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	polls: many(poll),
	members: many(member),
	invitations: many(invitation),
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

export const pollRelations = relations(poll, ({ many, one }) => ({
	pollQuestions: many(pollQuestions),
	submission: many(submission),
	user: one(user, {
		fields: [poll.userId],
		references: [user.id],
	}),
	organization: one(organization, {
		fields: [poll.organizationId],
		references: [organization.id],
	}),
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

export const submissionRelations = relations(submission, ({ one }) => ({
	poll: one(poll, {
		fields: [submission.pollId],
		references: [poll.id],
	}),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(member),
	invitations: many(invitation),
	teams: many(team),
}));

export const memberRelations = relations(member, ({ one }) => ({
	user: one(user, {
		fields: [member.userId],
		references: [user.id],
	}),
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id],
	}),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id],
	}),
	inviter: one(user, {
		fields: [invitation.inviterId],
		references: [user.id],
	}),
}));

export const organizationRoleRelations = relations(
	organizationRole,
	({ one }) => ({
		organization: one(organization, {
			fields: [organizationRole.organizationId],
			references: [organization.id],
		}),
	}),
);

export const teamRelations = relations(team, ({ one, many }) => ({
	organization: one(organization, {
		fields: [team.organizationId],
		references: [organization.id],
	}),
	members: many(teamMember),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
	team: one(team, {
		fields: [teamMember.teamId],
		references: [team.id],
	}),
	user: one(user, {
		fields: [teamMember.userId],
		references: [user.id],
	}),
}));

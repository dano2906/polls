import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

config({ path: [".env.local", ".env", ".env.production"] });

const connectionUrl = process.env.TURSO_CONNECTION_URL;
if (!connectionUrl) {
	console.error("TURSO_CONNECTION_URL is not defined");
	process.exit(1);
}

const client = createClient({
	url: connectionUrl,
	authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle({ client, schema: { ...schema } });

const NOW = Date.now();
const DAY = 86400000;
const HOUR = 3600000;

function id() {
	return crypto.randomUUID();
}

async function seed() {
	console.log("Clearing existing data...");

	const tables = [
		"user_answer",
		"submission",
		"answer",
		"poll_question",
		"question",
		"poll",
		"team_member",
		"team",
		"organization_role",
		"invitation",
		"member",
		"organization",
		"verification",
		"account",
		"session",
		"user",
	];

	for (const table of tables) {
		await db.run(`DELETE FROM ${table}`);
	}

	console.log("Seeding users...");

	const users = [
		{ id: id(), name: "Ana García", email: "ana.garcia@example.com", role: "admin" as const },
		{ id: id(), name: "Carlos López", email: "carlos.lopez@example.com", role: "user" as const },
		{ id: id(), name: "María Rodríguez", email: "maria.rodriguez@example.com", role: "user" as const },
		{ id: id(), name: "Juan Martínez", email: "juan.martinez@example.com", role: "user" as const },
		{ id: id(), name: "Laura Sánchez", email: "laura.sanchez@example.com", role: "user" as const },
		{ id: id(), name: "Pedro Ramírez", email: "pedro.ramirez@example.com", role: "user" as const },
		{ id: id(), name: "Sofía Torres", email: "sofia.torres@example.com", role: "user" as const },
		{ id: id(), name: "Diego Vargas", email: "diego.vargas@example.com", role: "user" as const },
		{ id: id(), name: "Valentina Ruiz", email: "valentina.ruiz@example.com", role: "user" as const },
		{ id: id(), name: "Mateo Flores", email: "mateo.flores@example.com", role: "user" as const },
	];

	await db.insert(schema.user).values(
		users.map((u, i) => ({
			...u,
			emailVerified: true,
			image: null,
			banned: null,
			banReason: null,
			banExpires: null,
			createdAt: new Date(NOW - (9 - i) * DAY),
			updatedAt: new Date(NOW - (9 - i) * DAY),
		})),
	);

	console.log("Seeding sessions...");

	await db.insert(schema.session).values(
		users.map((u, i) => ({
			id: id(),
			expiresAt: new Date(NOW + 7 * DAY),
			token: `session_token_${i + 1}`,
			createdAt: new Date(NOW - (9 - i) * DAY),
			updatedAt: new Date(NOW - (9 - i) * DAY),
			ipAddress: `192.168.1.${i + 1}`,
			userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
			userId: u.id,
			activeOrganizationId: null,
			activeTeamId: null,
			impersonatedBy: null,
		})),
	);

	console.log("Seeding accounts...");

	await db.insert(schema.account).values(
		users.map((u, i) => ({
			id: id(),
			accountId: u.id,
			providerId: "email",
			userId: u.id,
			accessToken: null,
			refreshToken: null,
			idToken: null,
			accessTokenExpiresAt: null,
			refreshTokenExpiresAt: null,
			scope: null,
			password: `hashed_password_${i + 1}`,
			createdAt: new Date(NOW - (9 - i) * DAY),
			updatedAt: new Date(NOW - (9 - i) * DAY),
		})),
	);

	console.log("Seeding verifications...");

	await db.insert(schema.verification).values(
		Array.from({ length: 10 }, (_, i) => ({
			id: id(),
			identifier: `verify_${i + 1}@example.com`,
			value: `code_${i + 1}_${id().slice(0, 8)}`,
			expiresAt: new Date(NOW + HOUR),
			createdAt: new Date(NOW),
			updatedAt: new Date(NOW),
		})),
	);

	console.log("Seeding organizations...");

	const orgs = [
		{ id: id(), name: "Tech Corp", slug: "tech-corp" },
		{ id: id(), name: "Marketing Pro", slug: "marketing-pro" },
		{ id: id(), name: "EduLearn Academy", slug: "edulearn-academy" },
		{ id: id(), name: "HealthFirst", slug: "healthfirst" },
		{ id: id(), name: "GreenEnergy", slug: "green-energy" },
		{ id: id(), name: "FinTech Solutions", slug: "fintech-solutions" },
		{ id: id(), name: "Creative Studio", slug: "creative-studio" },
		{ id: id(), name: "DataDriven Inc", slug: "datadriven-inc" },
		{ id: id(), name: "CloudBase", slug: "cloudbase" },
		{ id: id(), name: "DesignLab", slug: "designlab" },
	];

	await db.insert(schema.organization).values(
		orgs.map((o) => ({
			...o,
			logo: null,
			metadata: null,
			createdAt: new Date(NOW - Math.floor(Math.random() * 30) * DAY),
		})),
	);

	console.log("Seeding members...");

	await db.insert(schema.member).values(
		Array.from({ length: 10 }, (_, i) => ({
			id: id(),
			userId: users[i].id,
			organizationId: orgs[i % orgs.length].id,
			role: i < 2 ? "admin" : "member",
			createdAt: new Date(NOW - (9 - i) * DAY),
		})),
	);

	console.log("Seeding invitations...");

	await db.insert(schema.invitation).values(
		Array.from({ length: 10 }, (_, i) => ({
			id: id(),
			email: `invited${i + 1}@example.com`,
			inviterId: users[i % users.length].id,
			organizationId: orgs[i % orgs.length].id,
			role: "member",
			status: i < 5 ? "pending" : "accepted",
			teamId: null,
			createdAt: new Date(NOW - (9 - i) * DAY),
			expiresAt: new Date(NOW + 7 * DAY),
		})),
	);

	console.log("Seeding organization roles...");

	await db.insert(schema.organizationRole).values(
		Array.from({ length: 10 }, (_, i) => ({
			id: id(),
			organizationId: orgs[i % orgs.length].id,
			role: i < 3 ? "admin" : "member",
			permission: i < 3 ? "all" : "read",
			createdAt: new Date(NOW),
			updatedAt: new Date(NOW),
		})),
	);

	console.log("Seeding teams...");

	const teams = Array.from({ length: 10 }, (_, i) => ({
		id: id(),
		name: `Team ${String.fromCharCode(65 + i)}`,
		organizationId: orgs[i % orgs.length].id,
		createdAt: new Date(NOW),
		updatedAt: new Date(NOW),
	}));

	await db.insert(schema.team).values(teams);

	console.log("Seeding team members...");

	await db.insert(schema.teamMember).values(
		Array.from({ length: 10 }, (_, i) => ({
			id: id(),
			teamId: teams[i % teams.length].id,
			userId: users[i % users.length].id,
			createdAt: new Date(NOW),
		})),
	);

	console.log("Seeding polls...");

	const polls = [
		{
			id: id(),
			name: "Customer Satisfaction Survey",
			description: "Help us improve our service",
			slug: "customer-satisfaction",
			status: "published" as const,
		},
		{
			id: id(),
			name: "Employee Engagement Q1",
			description: "Quarterly engagement survey",
			slug: "employee-engagement-q1",
			status: "published" as const,
		},
		{
			id: id(),
			name: "Product Feedback",
			description: "Tell us what you think about our product",
			slug: "product-feedback",
			status: "draft" as const,
		},
		{
			id: id(),
			name: "Event Planning Preferences",
			description: "Help us plan the next company event",
			slug: "event-planning",
			status: "published" as const,
		},
		{
			id: id(),
			name: "Training Needs Assessment",
			description: "What skills would you like to develop?",
			slug: "training-needs",
			status: "draft" as const,
		},
		{
			id: id(),
			name: "Health & Wellness Check",
			description: "Monthly wellness check-in",
			slug: "wellness-check",
			status: "published" as const,
		},
		{
			id: id(),
			name: "Remote Work Preferences",
			description: "Your remote work experience",
			slug: "remote-work-preferences",
			status: "archived" as const,
		},
		{
			id: id(),
			name: "Marketing Campaign Feedback",
			description: "Evaluate our latest campaign",
			slug: "marketing-campaign",
			status: "published" as const,
		},
		{
			id: id(),
			name: "Team Building Activities",
			description: "Vote for the next team building activity",
			slug: "team-building",
			status: "draft" as const,
		},
		{
			id: id(),
			name: "Annual Review 2025",
			description: "Year-end performance review feedback",
			slug: "annual-review-2025",
			status: "published" as const,
		},
	];

	await db.insert(schema.poll).values(
		polls.map((p, i) => ({
			...p,
			userId: users[i % users.length].id,
			rootId: null,
			version: 1,
			timeLimit: null,
			password: null,
			startDate: new Date(NOW - 5 * DAY),
			endDate: new Date(NOW + 5 * DAY),
			createdAt: new Date(NOW - (9 - i) * DAY),
			updatedAt: new Date(NOW - (9 - i) * DAY),
			organizationId: orgs[i % orgs.length].id,
			metadata: null,
		})),
	);

	console.log("Seeding questions...");

	const questions = [
		{ id: id(), type: "single_choice" as const, questionText: "How satisfied are you with our service?", metadata: { type: "single_choice" as const, hasCorrectAnswers: false, maxSelections: 1 } },
		{ id: id(), type: "rating" as const, questionText: "Rate our response time", metadata: { type: "rating" as const, minValue: 1, maxValue: 5 } },
		{ id: id(), type: "open_answer" as const, questionText: "What improvements would you suggest?", metadata: { type: "open_answer" as const } },
		{ id: id(), type: "multiple_choice" as const, questionText: "Which features do you use most?", metadata: { type: "multiple_choice" as const, hasCorrectAnswers: false, maxSelections: 3 } },
		{ id: id(), type: "ranking" as const, questionText: "Rank our departments by performance", metadata: { type: "ranking" as const } },
		{ id: id(), type: "date_single" as const, questionText: "When would you like the event?", metadata: { type: "date_single" as const } },
		{ id: id(), type: "date_range" as const, questionText: "Select your vacation period", metadata: { type: "date_range" as const } },
		{ id: id(), type: "point_distribution" as const, questionText: "Distribute $100 budget across areas", metadata: { type: "point_distribution" as const, distributionAmount: 100 } },
		{ id: id(), type: "geolocation" as const, questionText: "Where is your office located?", metadata: { type: "geolocation" as const } },
		{ id: id(), type: "single_choice" as const, questionText: "How often do you use our platform?", metadata: { type: "single_choice" as const, hasCorrectAnswers: false, maxSelections: 1 } },
		{ id: id(), type: "multiple_choice" as const, questionText: "Which topics interest you?", metadata: { type: "multiple_choice" as const, hasCorrectAnswers: false, maxSelections: 5 } },
		{ id: id(), type: "rating" as const, questionText: "Rate our onboarding process", metadata: { type: "rating" as const, minValue: 1, maxValue: 10 } },
		{ id: id(), type: "open_answer" as const, questionText: "Describe your ideal work environment", metadata: { type: "open_answer" as const } },
		{ id: id(), type: "single_choice" as const, questionText: "Would you recommend us to a colleague?", metadata: { type: "single_choice" as const, hasCorrectAnswers: false, maxSelections: 1 } },
		{ id: id(), type: "ranking" as const, questionText: "Rank these company values", metadata: { type: "ranking" as const } },
		{ id: id(), type: "point_distribution" as const, questionText: "Distribute 50 points to priorities", metadata: { type: "point_distribution" as const, distributionAmount: 50 } },
		{ id: id(), type: "rating" as const, questionText: "Rate our communication clarity", metadata: { type: "rating" as const, minValue: 1, maxValue: 5 } },
		{ id: id(), type: "multiple_choice" as const, questionText: "Which channels do you prefer?", metadata: { type: "multiple_choice" as const, hasCorrectAnswers: false, maxSelections: 3 } },
		{ id: id(), type: "open_answer" as const, questionText: "Any additional comments?", metadata: { type: "open_answer" as const } },
		{ id: id(), type: "single_choice" as const, questionText: "How did you hear about us?", metadata: { type: "single_choice" as const, hasCorrectAnswers: false, maxSelections: 1 } },
	];

	await db.insert(schema.question).values(
		questions.map((q, i) => ({
			...q,
			hasCorrectAnswers: false,
			maxSelections: q.type === "multiple_choice" ? (q.metadata as { maxSelections: number }).maxSelections : 1,
			isRequired: i % 3 === 0,
			imageUrl: null,
			imagePublicId: null,
			createdAt: new Date(NOW - (19 - i) * DAY),
		})),
	);

	console.log("Seeding poll-question links...");

	const pollQuestions = polls.flatMap((p, pi) =>
		questions.slice(pi * 2, pi * 2 + 2).map((q, qi) => ({
			pollId: p.id,
			questionId: q.id,
			order: qi,
		})),
	);

	await db.insert(schema.pollQuestions).values(pollQuestions);

	console.log("Seeding answers...");

	const answerSets: { questionId: string; answerText: string; order: number }[][] = [
		[{ questionId: questions[0].id, answerText: "Very satisfied", order: 0 }, { questionId: questions[0].id, answerText: "Satisfied", order: 1 }, { questionId: questions[0].id, answerText: "Neutral", order: 2 }, { questionId: questions[0].id, answerText: "Dissatisfied", order: 3 }],
		[{ questionId: questions[3].id, answerText: "Dashboard", order: 0 }, { questionId: questions[3].id, answerText: "Reports", order: 1 }, { questionId: questions[3].id, answerText: "User Management", order: 2 }, { questionId: questions[3].id, answerText: "Settings", order: 3 }, { questionId: questions[3].id, answerText: "API", order: 4 }],
		[{ questionId: questions[4].id, answerText: "Engineering", order: 0 }, { questionId: questions[4].id, answerText: "Marketing", order: 1 }, { questionId: questions[4].id, answerText: "Sales", order: 2 }, { questionId: questions[4].id, answerText: "Support", order: 3 }],
		[{ questionId: questions[7].id, answerText: "Infrastructure", order: 0 }, { questionId: questions[7].id, answerText: "R&D", order: 1 }, { questionId: questions[7].id, answerText: "Marketing", order: 2 }, { questionId: questions[7].id, answerText: "Training", order: 3 }],
		[{ questionId: questions[9].id, answerText: "Daily", order: 0 }, { questionId: questions[9].id, answerText: "Weekly", order: 1 }, { questionId: questions[9].id, answerText: "Monthly", order: 2 }, { questionId: questions[9].id, answerText: "Rarely", order: 3 }],
		[{ questionId: questions[10].id, answerText: "Technology", order: 0 }, { questionId: questions[10].id, answerText: "Health", order: 1 }, { questionId: questions[10].id, answerText: "Finance", order: 2 }, { questionId: questions[10].id, answerText: "Education", order: 3 }, { questionId: questions[10].id, answerText: "Environment", order: 4 }],
		[{ questionId: questions[13].id, answerText: "Yes, definitely", order: 0 }, { questionId: questions[13].id, answerText: "Probably yes", order: 1 }, { questionId: questions[13].id, answerText: "Not sure", order: 2 }, { questionId: questions[13].id, answerText: "Probably not", order: 3 }],
		[{ questionId: questions[14].id, answerText: "Innovation", order: 0 }, { questionId: questions[14].id, answerText: "Integrity", order: 1 }, { questionId: questions[14].id, answerText: "Teamwork", order: 2 }, { questionId: questions[14].id, answerText: "Customer Focus", order: 3 }],
		[{ questionId: questions[15].id, answerText: "Performance", order: 0 }, { questionId: questions[15].id, answerText: "Security", order: 1 }, { questionId: questions[15].id, answerText: "UX", order: 2 }, { questionId: questions[15].id, answerText: "Documentation", order: 3 }],
		[{ questionId: questions[17].id, answerText: "Email", order: 0 }, { questionId: questions[17].id, answerText: "Slack", order: 1 }, { questionId: questions[17].id, answerText: "In-app", order: 2 }, { questionId: questions[17].id, answerText: "Phone", order: 3 }],
		[{ questionId: questions[19].id, answerText: "Social Media", order: 0 }, { questionId: questions[19].id, answerText: "Friend Referral", order: 1 }, { questionId: questions[19].id, answerText: "Search Engine", order: 2 }, { questionId: questions[19].id, answerText: "Blog", order: 3 }, { questionId: questions[19].id, answerText: "Conference", order: 4 }],
	];

	const allAnswers = answerSets.flat();

	const answerRows = allAnswers.map((a) => ({
		id: id(),
		questionId: a.questionId,
		answerText: a.answerText,
		isCorrect: false,
		order: a.order,
		imageUrl: null,
		imagePublicId: null,
		metadata: null,
		createdAt: new Date(NOW),
	}));

	await db.insert(schema.answer).values(answerRows);

	console.log("Seeding submissions...");

	const submissionsData = Array.from({ length: 10 }, (_, i) => ({
		submissionId: id(),
		userId: users[i].id,
		pollId: polls[i].id,
	}));

	await db.insert(schema.submission).values(
		submissionsData.map((s, i) => ({
			id: s.submissionId,
			pollId: s.pollId,
			userId: s.userId,
			submittedAt: new Date(NOW - (9 - i) * HOUR),
			startedAt: new Date(NOW - (9 - i) * HOUR - 600000),
			completedAt: new Date(NOW - (9 - i) * HOUR),
		})),
	);

	console.log("Seeding user answers...");

	const userAnswersData: {
		submissionId: string;
		questionId: string;
		value: object;
	}[] = [];

	for (let i = 0; i < 10; i++) {
		const subId = submissionsData[i].submissionId;
		const pollQ = pollQuestions.filter((pq) => pq.pollId === polls[i].id);

		for (const pq of pollQ) {
			const questionObj = questions.find((q) => q.id === pq.questionId)!;

			switch (questionObj.type) {
				case "single_choice": {
					const qAnswers = answerRows.filter((a) => a.questionId === pq.questionId);
					const picked = qAnswers[Math.floor(Math.random() * qAnswers.length)];
					userAnswersData.push({
						submissionId: subId,
						questionId: pq.questionId,
						value: { type: "single_choice", selectedAnswerId: picked.id },
					});
					break;
				}
				case "multiple_choice": {
					const qAnswers = answerRows.filter((a) => a.questionId === pq.questionId);
					const shuffled = [...qAnswers].sort(() => Math.random() - 0.5).slice(0, 2);
					userAnswersData.push({
						submissionId: subId,
						questionId: pq.questionId,
						value: { type: "multiple_choice", selectedAnswerIds: shuffled.map((a) => a.id) },
					});
					break;
				}
				case "open_answer": {
					userAnswersData.push({
						submissionId: subId,
						questionId: pq.questionId,
						value: { type: "open_answer", textResponse: "This is a sample response." },
					});
					break;
				}
				case "rating": {
					userAnswersData.push({
						submissionId: subId,
						questionId: pq.questionId,
						value: { type: "rating", score: Math.floor(Math.random() * 5) + 1 },
					});
					break;
				}
				case "ranking": {
					const qAnswers = answerRows.filter((a) => a.questionId === pq.questionId);
					const shuffled = [...qAnswers].sort(() => Math.random() - 0.5);
					userAnswersData.push({
						submissionId: subId,
						questionId: pq.questionId,
						value: { type: "ranking", orderedAnswerIds: shuffled.map((a) => a.id) },
					});
					break;
				}
				case "date_single": {
					userAnswersData.push({
						submissionId: subId,
						questionId: pq.questionId,
						value: { type: "date_single", date: "2025-06-15" },
					});
					break;
				}
				case "date_range": {
					userAnswersData.push({
						submissionId: subId,
						questionId: pq.questionId,
						value: { type: "date_range", startDate: "2025-07-01", endDate: "2025-07-15" },
					});
					break;
				}
				case "point_distribution": {
					const qAnswers = answerRows.filter((a) => a.questionId === pq.questionId);
					const points: Record<string, number> = {};
					qAnswers.forEach((a, j) => {
						points[a.id] = Math.floor(100 / qAnswers.length) + (j === 0 ? 100 % qAnswers.length : 0);
					});
					userAnswersData.push({
						submissionId: subId,
						questionId: pq.questionId,
						value: { type: "point_distribution", points },
					});
					break;
				}
				case "geolocation": {
					userAnswersData.push({
						submissionId: subId,
						questionId: pq.questionId,
						value: { type: "geolocation", lat: 40.4168, lng: -3.7038 },
					});
					break;
				}
			}
		}
	}

	await db.insert(schema.userAnswer).values(
		userAnswersData.map((ua) => ({
			id: id(),
			submissionId: ua.submissionId,
			questionId: ua.questionId,
			value: ua.value,
		})),
	);

	console.log("Seed complete!");
	console.log(`  Users: ${users.length}`);
	console.log(`  Sessions: 10`);
	console.log(`  Accounts: 10`);
	console.log(`  Verifications: 10`);
	console.log(`  Organizations: ${orgs.length}`);
	console.log(`  Members: 10`);
	console.log(`  Invitations: 10`);
	console.log(`  Organization Roles: 10`);
	console.log(`  Teams: ${teams.length}`);
	console.log(`  Team Members: 10`);
	console.log(`  Polls: ${polls.length}`);
	console.log(`  Questions: ${questions.length}`);
	console.log(`  Poll-Question Links: ${pollQuestions.length}`);
	console.log(`  Answers: ${answerRows.length}`);
	console.log(`  Submissions: ${submissionsData.length}`);
	console.log(`  User Answers: ${userAnswersData.length}`);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});

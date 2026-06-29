import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
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
	if (process.env.NODE_ENV === "production") {
		console.error("No se puede ejecutar el seed en producción");
		process.exit(1);
	}

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
		{
			id: id(),
			name: "Ana García",
			email: "ana.garcia@example.com",
			role: "admin" as const,
		},
		{
			id: id(),
			name: "Carlos López",
			email: "carlos.lopez@example.com",
			role: "user" as const,
		},
		{
			id: id(),
			name: "María Rodríguez",
			email: "maria.rodriguez@example.com",
			role: "user" as const,
		},
		{
			id: id(),
			name: "Juan Martínez",
			email: "juan.martinez@example.com",
			role: "user" as const,
		},
		{
			id: id(),
			name: "Laura Sánchez",
			email: "laura.sanchez@example.com",
			role: "user" as const,
		},
		{
			id: id(),
			name: "Pedro Ramírez",
			email: "pedro.ramirez@example.com",
			role: "user" as const,
		},
		{
			id: id(),
			name: "Sofía Torres",
			email: "sofia.torres@example.com",
			role: "user" as const,
		},
		{
			id: id(),
			name: "Diego Vargas",
			email: "diego.vargas@example.com",
			role: "user" as const,
		},
		{
			id: id(),
			name: "Valentina Ruiz",
			email: "valentina.ruiz@example.com",
			role: "user" as const,
		},
		{
			id: id(),
			name: "Mateo Flores",
			email: "mateo.flores@example.com",
			role: "user" as const,
		},
	];

	const additionalUsers = Array.from({ length: 50 }, (_, i) => ({
		id: id(),
		name: `User ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1} ${["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"][i % 15]}`,
		email: `user${i + 11}@example.com`,
		role: i < 5 ? ("admin" as const) : ("user" as const),
	}));

	const allUsers = [...users, ...additionalUsers];

	await db.insert(schema.user).values(
		allUsers.map((u, i) => ({
			...u,
			emailVerified: true,
			image: null,
			banned: null,
			banReason: null,
			banExpires: null,
			createdAt: new Date(NOW - Math.max(9 - i, 0) * DAY),
			updatedAt: new Date(NOW - Math.max(9 - i, 0) * DAY),
		})),
	);

	console.log("Seeding sessions...");

	await db.insert(schema.session).values(
		allUsers.map((u, i) => ({
			id: id(),
			expiresAt: new Date(NOW + 7 * DAY),
			token: `session_token_${i + 1}`,
			createdAt: new Date(NOW - Math.max(9 - i, 0) * DAY),
			updatedAt: new Date(NOW - Math.max(9 - i, 0) * DAY),
			ipAddress: `192.168.${Math.floor(i / 255) + 1}.${(i % 255) + 1}`,
			userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
			userId: u.id,
			activeOrganizationId: null,
			activeTeamId: null,
			impersonatedBy: null,
		})),
	);

	console.log("Seeding accounts...");

	await db.insert(schema.account).values(
		allUsers.map((u, i) => ({
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
			createdAt: new Date(NOW - Math.max(9 - i, 0) * DAY),
			updatedAt: new Date(NOW - Math.max(9 - i, 0) * DAY),
		})),
	);

	console.log("Seeding verifications...");

	await db.insert(schema.verification).values(
		Array.from({ length: 60 }, (_, i) => ({
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

	const additionalOrgs = Array.from({ length: 50 }, (_, i) => ({
		id: id(),
		name: `Organization ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
		slug: `org-${i + 1}`,
	}));

	const allOrgs = [...orgs, ...additionalOrgs];

	await db.insert(schema.organization).values(
		allOrgs.map((o) => ({
			...o,
			logo: null,
			metadata: null,
			createdAt: new Date(NOW - Math.floor(Math.random() * 60) * DAY),
		})),
	);

	console.log("Seeding members...");

	await db.insert(schema.member).values(
		Array.from({ length: 60 }, (_, i) => ({
			id: id(),
			userId: allUsers[i].id,
			organizationId: allOrgs[i % allOrgs.length].id,
			role: i < 7 ? "admin" : "member",
			createdAt: new Date(NOW - Math.max(9 - i, 0) * DAY),
		})),
	);

	console.log("Seeding invitations...");

	await db.insert(schema.invitation).values(
		Array.from({ length: 60 }, (_, i) => ({
			id: id(),
			email: `invited${i + 1}@example.com`,
			inviterId: allUsers[i % allUsers.length].id,
			organizationId: allOrgs[i % allOrgs.length].id,
			role: "member",
			status: i < 30 ? "pending" : "accepted",
			teamId: null,
			createdAt: new Date(NOW - Math.max(9 - i, 0) * DAY),
			expiresAt: new Date(NOW + 7 * DAY),
		})),
	);

	console.log("Seeding organization roles...");

	await db.insert(schema.organizationRole).values(
		Array.from({ length: 60 }, (_, i) => ({
			id: id(),
			organizationId: allOrgs[i % allOrgs.length].id,
			role: i < 15 ? "admin" : "member",
			permission: i < 15 ? "all" : "read",
			createdAt: new Date(NOW),
			updatedAt: new Date(NOW),
		})),
	);

	console.log("Seeding teams...");

	const teams = Array.from({ length: 60 }, (_, i) => ({
		id: id(),
		name: `Team ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
		organizationId: allOrgs[i % allOrgs.length].id,
		createdAt: new Date(NOW),
		updatedAt: new Date(NOW),
	}));

	await db.insert(schema.team).values(teams);

	console.log("Seeding team members...");

	await db.insert(schema.teamMember).values(
		Array.from({ length: 60 }, (_, i) => ({
			id: id(),
			teamId: teams[i % teams.length].id,
			userId: allUsers[i % allUsers.length].id,
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

	const additionalPolls = Array.from({ length: 50 }, (_, i) => {
		const statuses: Array<"draft" | "published" | "archived"> = ["draft", "published", "archived"];
		return {
			id: id(),
			name: `Poll ${i + 11}: ${["Customer", "Employee", "Product", "Event", "Training", "Wellness", "Remote", "Marketing", "Team", "Annual", "Quarterly", "Monthly", "Weekly", "Project", "Service"][i % 15]} Survey`,
			description: `Description for poll ${i + 11}`,
			slug: `poll-${i + 11}`,
			status: statuses[i % 3] as const,
		};
	});

	const allPolls = [...polls, ...additionalPolls];

	await db.insert(schema.poll).values(
		allPolls.map((p, i) => ({
			...p,
			userId: allUsers[i % allUsers.length].id,
			rootId: null,
			version: 1,
			timeLimit: null,
			password: null,
			startDate: new Date(NOW - 5 * DAY),
			endDate: new Date(NOW + 5 * DAY),
			createdAt: new Date(NOW - Math.max(9 - i, 0) * DAY),
			updatedAt: new Date(NOW - Math.max(9 - i, 0) * DAY),
			organizationId: allOrgs[i % allOrgs.length].id,
			metadata: null,
		})),
	);

	console.log("Seeding questions...");

	const questions = [
		{
			id: id(),
			type: "single_choice" as const,
			questionText: "How satisfied are you with our service?",
			metadata: {
				type: "single_choice" as const,
				hasCorrectAnswers: false,
				maxSelections: 1,
			},
		},
		{
			id: id(),
			type: "rating" as const,
			questionText: "Rate our response time",
			metadata: { type: "rating" as const, minValue: 1, maxValue: 5 },
		},
		{
			id: id(),
			type: "open_answer" as const,
			questionText: "What improvements would you suggest?",
			metadata: { type: "open_answer" as const },
		},
		{
			id: id(),
			type: "multiple_choice" as const,
			questionText: "Which features do you use most?",
			metadata: {
				type: "multiple_choice" as const,
				hasCorrectAnswers: false,
				maxSelections: 3,
			},
		},
		{
			id: id(),
			type: "ranking" as const,
			questionText: "Rank our departments by performance",
			metadata: { type: "ranking" as const },
		},
		{
			id: id(),
			type: "date_single" as const,
			questionText: "When would you like the event?",
			metadata: { type: "date_single" as const },
		},
		{
			id: id(),
			type: "date_range" as const,
			questionText: "Select your vacation period",
			metadata: { type: "date_range" as const },
		},
		{
			id: id(),
			type: "point_distribution" as const,
			questionText: "Distribute $100 budget across areas",
			metadata: {
				type: "point_distribution" as const,
				distributionAmount: 100,
			},
		},
		{
			id: id(),
			type: "geolocation" as const,
			questionText: "Where is your office located?",
			metadata: { type: "geolocation" as const },
		},
		{
			id: id(),
			type: "single_choice" as const,
			questionText: "How often do you use our platform?",
			metadata: {
				type: "single_choice" as const,
				hasCorrectAnswers: false,
				maxSelections: 1,
			},
		},
		{
			id: id(),
			type: "multiple_choice" as const,
			questionText: "Which topics interest you?",
			metadata: {
				type: "multiple_choice" as const,
				hasCorrectAnswers: false,
				maxSelections: 5,
			},
		},
		{
			id: id(),
			type: "rating" as const,
			questionText: "Rate our onboarding process",
			metadata: { type: "rating" as const, minValue: 1, maxValue: 10 },
		},
		{
			id: id(),
			type: "open_answer" as const,
			questionText: "Describe your ideal work environment",
			metadata: { type: "open_answer" as const },
		},
		{
			id: id(),
			type: "single_choice" as const,
			questionText: "Would you recommend us to a colleague?",
			metadata: {
				type: "single_choice" as const,
				hasCorrectAnswers: false,
				maxSelections: 1,
			},
		},
		{
			id: id(),
			type: "ranking" as const,
			questionText: "Rank these company values",
			metadata: { type: "ranking" as const },
		},
		{
			id: id(),
			type: "point_distribution" as const,
			questionText: "Distribute 50 points to priorities",
			metadata: { type: "point_distribution" as const, distributionAmount: 50 },
		},
		{
			id: id(),
			type: "rating" as const,
			questionText: "Rate our communication clarity",
			metadata: { type: "rating" as const, minValue: 1, maxValue: 5 },
		},
		{
			id: id(),
			type: "multiple_choice" as const,
			questionText: "Which channels do you prefer?",
			metadata: {
				type: "multiple_choice" as const,
				hasCorrectAnswers: false,
				maxSelections: 3,
			},
		},
		{
			id: id(),
			type: "open_answer" as const,
			questionText: "Any additional comments?",
			metadata: { type: "open_answer" as const },
		},
		{
			id: id(),
			type: "single_choice" as const,
			questionText: "How did you hear about us?",
			metadata: {
				type: "single_choice" as const,
				hasCorrectAnswers: false,
				maxSelections: 1,
			},
		},
	];

	const additionalQuestions = Array.from({ length: 50 }, (_, i) => {
		const questionTypes = [
			"single_choice",
			"multiple_choice",
			"rating",
			"open_answer",
			"ranking",
			"date_single",
			"date_range",
			"point_distribution",
			"geolocation",
		] as const;
		const type = questionTypes[i % questionTypes.length];
		const baseIndex = i + 20;

		switch (type) {
			case "single_choice":
				return {
					id: id(),
					type: "single_choice" as const,
					questionText: `Question ${baseIndex + 1}: Which option do you prefer?`,
					metadata: {
						type: "single_choice" as const,
						hasCorrectAnswers: false,
						maxSelections: 1,
					},
				};
			case "multiple_choice":
				return {
					id: id(),
					type: "multiple_choice" as const,
					questionText: `Question ${baseIndex + 1}: Select all that apply`,
					metadata: {
						type: "multiple_choice" as const,
						hasCorrectAnswers: false,
						maxSelections: 3,
					},
				};
			case "rating":
				return {
					id: id(),
					type: "rating" as const,
					questionText: `Question ${baseIndex + 1}: Rate your experience (1-10)`,
					metadata: { type: "rating" as const, minValue: 1, maxValue: 10 },
				};
			case "open_answer":
				return {
					id: id(),
					type: "open_answer" as const,
					questionText: `Question ${baseIndex + 1}: Please provide your feedback`,
					metadata: { type: "open_answer" as const },
				};
			case "ranking":
				return {
					id: id(),
					type: "ranking" as const,
					questionText: `Question ${baseIndex + 1}: Rank these items by preference`,
					metadata: { type: "ranking" as const },
				};
			case "date_single":
				return {
					id: id(),
					type: "date_single" as const,
					questionText: `Question ${baseIndex + 1}: Select a date`,
					metadata: { type: "date_single" as const },
				};
			case "date_range":
				return {
					id: id(),
					type: "date_range" as const,
					questionText: `Question ${baseIndex + 1}: Select a date range`,
					metadata: { type: "date_range" as const },
				};
			case "point_distribution":
				return {
					id: id(),
					type: "point_distribution" as const,
					questionText: `Question ${baseIndex + 1}: Distribute 100 points`,
					metadata: {
						type: "point_distribution" as const,
						distributionAmount: 100,
					},
				};
			case "geolocation":
				return {
					id: id(),
					type: "geolocation" as const,
					questionText: `Question ${baseIndex + 1}: Where are you located?`,
					metadata: { type: "geolocation" as const },
				};
		}
	});

	const allQuestions = [...questions, ...additionalQuestions];

	await db.insert(schema.question).values(
		allQuestions.map((q, i) => ({
			...q,
			hasCorrectAnswers: false,
			maxSelections:
				q.type === "multiple_choice"
					? (q.metadata as { maxSelections: number }).maxSelections
					: 1,
			isRequired: i % 3 === 0,
			imageUrl: null,
			imagePublicId: null,
			createdAt: new Date(NOW - Math.max(19 - i, 0) * DAY),
		})),
	);

	console.log("Seeding poll-question links...");

	const allPollQuestions = allPolls.flatMap((p, pi) =>
		allQuestions.slice(pi * 2, pi * 2 + 2).map((q, qi) => ({
			pollId: p.id,
			questionId: q.id,
			order: qi,
		})),
	);

	await db.insert(schema.pollQuestions).values(allPollQuestions);

	console.log("Seeding answers...");

	const answerSets: {
		questionId: string;
		answerText: string;
		order: number;
	}[][] = [
		[
			{ questionId: questions[0].id, answerText: "Very satisfied", order: 0 },
			{ questionId: questions[0].id, answerText: "Satisfied", order: 1 },
			{ questionId: questions[0].id, answerText: "Neutral", order: 2 },
			{ questionId: questions[0].id, answerText: "Dissatisfied", order: 3 },
		],
		[
			{ questionId: questions[3].id, answerText: "Dashboard", order: 0 },
			{ questionId: questions[3].id, answerText: "Reports", order: 1 },
			{ questionId: questions[3].id, answerText: "User Management", order: 2 },
			{ questionId: questions[3].id, answerText: "Settings", order: 3 },
			{ questionId: questions[3].id, answerText: "API", order: 4 },
		],
		[
			{ questionId: questions[4].id, answerText: "Engineering", order: 0 },
			{ questionId: questions[4].id, answerText: "Marketing", order: 1 },
			{ questionId: questions[4].id, answerText: "Sales", order: 2 },
			{ questionId: questions[4].id, answerText: "Support", order: 3 },
		],
		[
			{ questionId: questions[7].id, answerText: "Infrastructure", order: 0 },
			{ questionId: questions[7].id, answerText: "R&D", order: 1 },
			{ questionId: questions[7].id, answerText: "Marketing", order: 2 },
			{ questionId: questions[7].id, answerText: "Training", order: 3 },
		],
		[
			{ questionId: questions[9].id, answerText: "Daily", order: 0 },
			{ questionId: questions[9].id, answerText: "Weekly", order: 1 },
			{ questionId: questions[9].id, answerText: "Monthly", order: 2 },
			{ questionId: questions[9].id, answerText: "Rarely", order: 3 },
		],
		[
			{ questionId: questions[10].id, answerText: "Technology", order: 0 },
			{ questionId: questions[10].id, answerText: "Health", order: 1 },
			{ questionId: questions[10].id, answerText: "Finance", order: 2 },
			{ questionId: questions[10].id, answerText: "Education", order: 3 },
			{ questionId: questions[10].id, answerText: "Environment", order: 4 },
		],
		[
			{ questionId: questions[13].id, answerText: "Yes, definitely", order: 0 },
			{ questionId: questions[13].id, answerText: "Probably yes", order: 1 },
			{ questionId: questions[13].id, answerText: "Not sure", order: 2 },
			{ questionId: questions[13].id, answerText: "Probably not", order: 3 },
		],
		[
			{ questionId: questions[14].id, answerText: "Innovation", order: 0 },
			{ questionId: questions[14].id, answerText: "Integrity", order: 1 },
			{ questionId: questions[14].id, answerText: "Teamwork", order: 2 },
			{ questionId: questions[14].id, answerText: "Customer Focus", order: 3 },
		],
		[
			{ questionId: questions[15].id, answerText: "Performance", order: 0 },
			{ questionId: questions[15].id, answerText: "Security", order: 1 },
			{ questionId: questions[15].id, answerText: "UX", order: 2 },
			{ questionId: questions[15].id, answerText: "Documentation", order: 3 },
		],
		[
			{ questionId: questions[17].id, answerText: "Email", order: 0 },
			{ questionId: questions[17].id, answerText: "Slack", order: 1 },
			{ questionId: questions[17].id, answerText: "In-app", order: 2 },
			{ questionId: questions[17].id, answerText: "Phone", order: 3 },
		],
		[
			{ questionId: questions[19].id, answerText: "Social Media", order: 0 },
			{ questionId: questions[19].id, answerText: "Friend Referral", order: 1 },
			{ questionId: questions[19].id, answerText: "Search Engine", order: 2 },
			{ questionId: questions[19].id, answerText: "Blog", order: 3 },
			{ questionId: questions[19].id, answerText: "Conference", order: 4 },
		],
	];

	// Add answers for additional questions
	for (let i = 20; i < allQuestions.length; i++) {
		const q = allQuestions[i];
		if (q.type === "single_choice" || q.type === "multiple_choice") {
			answerSets.push([
				{ questionId: q.id, answerText: "Option A", order: 0 },
				{ questionId: q.id, answerText: "Option B", order: 1 },
				{ questionId: q.id, answerText: "Option C", order: 2 },
				{ questionId: q.id, answerText: "Option D", order: 3 },
			]);
		} else if (q.type === "ranking") {
			answerSets.push([
				{ questionId: q.id, answerText: "Item 1", order: 0 },
				{ questionId: q.id, answerText: "Item 2", order: 1 },
				{ questionId: q.id, answerText: "Item 3", order: 2 },
				{ questionId: q.id, answerText: "Item 4", order: 3 },
			]);
		} else if (q.type === "point_distribution") {
			answerSets.push([
				{ questionId: q.id, answerText: "Area 1", order: 0 },
				{ questionId: q.id, answerText: "Area 2", order: 1 },
				{ questionId: q.id, answerText: "Area 3", order: 2 },
				{ questionId: q.id, answerText: "Area 4", order: 3 },
			]);
		}
		// For rating, open_answer, date_single, date_range, geolocation - no predefined answers needed
	}

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

	const submissionsData = Array.from({ length: 60 }, (_, i) => ({
		submissionId: id(),
		userId: allUsers[i % allUsers.length].id,
		pollId: allPolls[i % allPolls.length].id,
	}));

	await db.insert(schema.submission).values(
		submissionsData.map((s, i) => ({
			id: s.submissionId,
			pollId: s.pollId,
			userId: s.userId,
			submittedAt: new Date(NOW - (i % 60) * HOUR),
			startedAt: new Date(NOW - (i % 60) * HOUR - 600000),
			completedAt: new Date(NOW - (i % 60) * HOUR),
		})),
	);

	console.log("Seeding user answers...");

	const userAnswersData: {
		submissionId: string;
		questionId: string;
		value: object;
	}[] = [];

	for (let i = 0; i < submissionsData.length; i++) {
		const subId = submissionsData[i].submissionId;
		const pollQ = allPollQuestions.filter((pq) => pq.pollId === allPolls[i % allPolls.length].id);

		for (const pq of pollQ) {
			const questionObj = allQuestions.find((q) => q.id === pq.questionId);
			if (!questionObj) continue;

			switch (questionObj.type) {
				case "single_choice": {
					const qAnswers = answerRows.filter(
						(a) => a.questionId === pq.questionId,
					);
					const picked = qAnswers.length > 0
						? qAnswers[Math.floor(Math.random() * qAnswers.length)]
						: null;
					if (picked) {
						userAnswersData.push({
							submissionId: subId,
							questionId: pq.questionId,
							value: { type: "single_choice", selectedAnswerId: picked.id },
						});
					}
					break;
				}
				case "multiple_choice": {
					const qAnswers = answerRows.filter(
						(a) => a.questionId === pq.questionId,
					);
					if (qAnswers.length > 0) {
						const shuffled = [...qAnswers]
							.sort(() => Math.random() - 0.5)
							.slice(0, 2);
						userAnswersData.push({
							submissionId: subId,
							questionId: pq.questionId,
							value: {
								type: "multiple_choice",
								selectedAnswerIds: shuffled.map((a) => a.id),
							},
						});
					}
					break;
				}
				case "open_answer": {
					userAnswersData.push({
						submissionId: subId,
						questionId: pq.questionId,
						value: {
							type: "open_answer",
							textResponse: "This is a sample response.",
						},
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
					const qAnswers = answerRows.filter(
						(a) => a.questionId === pq.questionId,
					);
					if (qAnswers.length > 0) {
						const shuffled = [...qAnswers].sort(() => Math.random() - 0.5);
						userAnswersData.push({
							submissionId: subId,
							questionId: pq.questionId,
							value: {
								type: "ranking",
								orderedAnswerIds: shuffled.map((a) => a.id),
							},
						});
					}
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
						value: {
							type: "date_range",
							startDate: "2025-07-01",
							endDate: "2025-07-15",
						},
					});
					break;
				}
				case "point_distribution": {
					const qAnswers = answerRows.filter(
						(a) => a.questionId === pq.questionId,
					);
					if (qAnswers.length > 0) {
						const points: Record<string, number> = {};
						qAnswers.forEach((a, j) => {
							points[a.id] =
								Math.floor(100 / qAnswers.length) +
								(j === 0 ? 100 % qAnswers.length : 0);
						});
						userAnswersData.push({
							submissionId: subId,
							questionId: pq.questionId,
							value: { type: "point_distribution", points },
						});
					}
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
	console.log(`  Users: ${allUsers.length}`);
	console.log(`  Sessions: ${allUsers.length}`);
	console.log(`  Accounts: ${allUsers.length}`);
	console.log(`  Verifications: 60`);
	console.log(`  Organizations: ${allOrgs.length}`);
	console.log(`  Members: 60`);
	console.log(`  Invitations: 60`);
	console.log(`  Organization Roles: 60`);
	console.log(`  Teams: ${teams.length}`);
	console.log(`  Team Members: 60`);
	console.log(`  Polls: ${allPolls.length}`);
	console.log(`  Questions: ${allQuestions.length}`);
	console.log(`  Poll-Question Links: ${allPollQuestions.length}`);
	console.log(`  Answers: ${answerRows.length}`);
	console.log(`  Submissions: ${submissionsData.length}`);
	console.log(`  User Answers: ${userAnswersData.length}`);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});

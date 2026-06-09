export type UserAnswerValue =
	| { type: "open_answer"; textResponse: string }
	| { type: "rating"; score: number }
	| { type: "ranking"; orderedAnswerIds: string[] }
	| { type: "single_choice"; selectedAnswerId: string }
	| { type: "multiple_choice"; selectedAnswerIds: string[] }
	| { type: "date_single"; date: string }
	| { type: "date_range"; startDate: string; endDate: string }
	| { type: "point_distribution"; points: Record<string, number> };

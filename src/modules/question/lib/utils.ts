import type { QuestionMetadata } from "../shared/types";

interface MetadataQuestionInput {
	id?: string;
	type: string;
	questionText?: string;
	isRequired?: boolean;
	hasCorrectAnswers?: boolean;
	maxSelections?: number;
	imageUrl?: string | null;
	imagePublicId?: string | null;
	minValue?: number;
	maxValue?: number;
	minDate?: string | null;
	maxDate?: string | null;
	distributionAmount?: number;
	metadata?: string | Partial<QuestionMetadata> | null;
	answers?: { id?: string; answerText?: string; isCorrect?: boolean; imageUrl?: string | null; imagePublicId?: string | null }[];
}

export const getMetadataForQuestion = (q: MetadataQuestionInput) => {
	switch (q.type) {
		case "rating":
			return {
				type: q.type,
				minRating: q.minValue ?? 1,
				maxRating: q.maxValue ?? 5,
			};
		case "date_single":
		case "date_range":
			return {
				type: q.type,
				minDate: q.minDate ?? null,
				maxDate: q.maxDate ?? null,
			};
		case "point_distribution":
			return { type: q.type, distributionAmount: q.distributionAmount ?? 100 };
		default:
			return { type: q.type };
	}
};

export const transformInitialQuestionData = (
	initialData: MetadataQuestionInput[] | undefined,
	slug: string | null,
) => {
	if (!initialData || initialData.length === 0 || !slug) {
		return {
			slug,
			questions: [
				{
					type: "open_answer",
					questionText: "",
					hasCorrectAnswers: false,
					isRequired: true,
					maxSelections: 1,
					imageUrl: null,
					imagePublicId: null,
					answers: [],
				},
			],
		};
	}

	return {
		slug,
		questions: initialData.map((q) => {
			let meta: Partial<QuestionMetadata> = {};
			try {
				meta =
					typeof q.metadata === "string"
						? JSON.parse(q.metadata)
						: q.metadata || {};
			} catch {
			}

			// 2. Base común
			const base = {
				id: q.id,
				type: q.type,
				questionText: q.questionText ?? "",
				isRequired: q.isRequired ?? true,
				imageUrl: q.imageUrl ?? null,
				imagePublicId: q.imagePublicId ?? null,
				hasCorrectAnswers: q.hasCorrectAnswers ?? false,
				maxSelections: q.maxSelections ?? 1,
				answers:
					q.answers?.map((a) => ({
						id: a.id,
						answerText: a.answerText ?? "",
						isCorrect: a.isCorrect ?? false,
						imageUrl: a.imageUrl ?? null,
						imagePublicId: a.imagePublicId ?? null,
					})) || [],
			};

			// 3. Merge de metadata según el tipo
			if (q.type === "rating") {
				return {
					...base,
					minValue: meta.minRating ?? 1,
					maxValue: meta.maxRating ?? 5,
				};
			}
			if (q.type === "date_single" || q.type === "date_range") {
				return {
					...base,
					minDate: meta.minDate ?? null,
					maxDate: meta.maxDate ?? null,
				};
			}
			if (q.type === "point_distribution") {
				return { ...base, distributionAmount: meta.distributionAmount ?? 100 };
			}

			return base;
		}),
	};
};

import { useMutation } from "@tanstack/react-query";
import { Download, FileJson, Sheet, Table } from "lucide-react";
import { toast } from "sonner";
import { ExportFormat } from "@/common/shared/types";
import { getPollDetails } from "@/poll/actions/poll";
import { Button } from "@/ui/button";
import { LoadingSwap } from "@/ui/loading-swap";
import { exportPollFn } from "../actions/poll";
import { pollMKs } from "../lib/query";
import type { ExportData } from "../shared/types";

interface Props {
	format: ExportFormat;
	slug: string;
}

const renderIcon = (format: ExportFormat) => {
	switch (format) {
		case ExportFormat.CSV:
			return (
				<div className="w-full flex items-center justify-start gap-2">
					<Table /> CSV
				</div>
			);
		case ExportFormat.EXCEL:
			return (
				<div className="w-full flex items-center justify-start gap-2">
					<Sheet /> Excel
				</div>
			);
		case ExportFormat.JSON:
			return (
				<div className="w-full flex items-center justify-start gap-2">
					<FileJson /> JSON
				</div>
			);
		default:
			return <Download />;
	}
};

const ExportMenuButton = ({ format, slug }: Props) => {
	const exportMutation = useMutation({
		mutationKey: pollMKs.export({ slug, format }),
		mutationFn: async () => {
			const poll = await getPollDetails({
				data: {
					slug,
				},
			});
			const exportData: ExportData = {
				name: poll.name,
				description: poll.description,
				password: null,
				startDate: poll.startDate,
				endDate: poll.endDate,
				questions: poll.questions.map((q) => {
					return {
						questionText: q.questionText,
						hasCorrectAnswers: q.hasCorrectAnswers,
						isRequired: q.isRequired,
						maxSelections: q.maxSelections,
						order: q.order,
						type: q.type,
						metadata: q.metadata ?? {},
						answers: q.answers.map((a) => ({
							answerText: a.answerText,
							isCorrect: a.isCorrect,
						})),
					};
				}),
			};
			exportPollFn({
				filename: `${poll.name}-${Date.now()}`,
				format,
				poll: exportData,
			});
		},
		onSuccess: () =>
			toast.success("Su encuesta ha sido exportada exitosamente"),
		onError: () => toast.error("Ha ocurrido un error exportando la encuesta"),
	});
	return (
		<Button
			variant={"ghostContext"}
			className="w-full flex items-center justify-start"
			onClick={() => exportMutation.mutate()}
		>
			<LoadingSwap isLoading={exportMutation.isPending}>
				{renderIcon(format)}
			</LoadingSwap>
		</Button>
	);
};

export default ExportMenuButton;

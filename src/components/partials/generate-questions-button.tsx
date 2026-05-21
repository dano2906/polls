import { BrainCircuit } from "lucide-react";
import { useState, useTransition } from "react";
import { generateQuestionsFromContext } from "#/actions/question";
import type { NewQuestion } from "#/shared/types";
import { Button } from "../ui/button";
import { LoadingSwap } from "../ui/loading-swap";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "../ui/popover";
import { Textarea } from "../ui/textarea";
import EnhanceContextButton from "./enhance-context-button";

interface Props {
	pollDescription?: string | null;
	addQuestion: (value: NewQuestion) => void;
}

const GenerateQuestionsButton = ({ pollDescription, addQuestion }: Props) => {
	const [isPending, startTransition] = useTransition();
	const [context, setContext] = useState("");
	const handleGenerate = () => {
		startTransition(async () => {
			try {
				const result = await generateQuestionsFromContext({
					data: {
						context,
						pollDescription,
						lang: "spanish",
					},
				});
				if (result) {
					addQuestion(result);
					setContext("");
				}
			} catch (error) {
				console.log(error);
			}
		});
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant={"secondary"}>
					<BrainCircuit />
					Sugerir pregunta
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="space-y-2 max-w-md w-full">
				<PopoverHeader>
					<PopoverTitle>Crea una pregunta usando IA</PopoverTitle>
					<PopoverDescription className="text-xs">
						Dale un breve contexto a la inteligencia artificial y te dará una
						pregunta para incorporar a la encuesta. (Puede demorar debido a la
						disponibilidad de los modelos gratuitos de IA)
					</PopoverDescription>
				</PopoverHeader>
				<Textarea
					placeholder="Quisiera pregunta a cerca de..."
					value={context}
					onChange={(e) => setContext(e.target.value)}
				/>
				<div className="w-full flex items-center justify-end gap-2">
					<EnhanceContextButton context={context} setNewContext={setContext} />
					<Button
						variant={"outline"}
						onClick={handleGenerate}
						disabled={isPending || !context || context.trim().length < 32}
					>
						<LoadingSwap
							isLoading={isPending}
							className="flex items-center gap-2"
						>
							<BrainCircuit />
							Sugerir pregunta
						</LoadingSwap>
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default GenerateQuestionsButton;

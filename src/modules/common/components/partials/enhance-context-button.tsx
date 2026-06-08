import { Lightbulb } from "lucide-react";
import { useTransition } from "react";
import { enhanceGenerateQuestionContext } from "@/question/actions/question";
import { Button } from "@/ui/button";
import { LoadingSwap } from "@/ui/loading-swap";

interface Props {
	context: string;
	setNewContext: React.Dispatch<React.SetStateAction<string>>;
}

const EnhanceContextButton = ({ context, setNewContext }: Props) => {
	const [isPending, startTransition] = useTransition();
	const handleEnhance = () => {
		startTransition(async () => {
			try {
				const result = await enhanceGenerateQuestionContext({
					data: {
						context,
						lang: "spanish",
					},
				});
				setNewContext(result);
			} catch (error) {
				console.log(error);
			}
		});
	};
	return (
		<Button
			variant={"outline"}
			onClick={handleEnhance}
			disabled={isPending || !context || context.trim().length < 32}
		>
			<LoadingSwap isLoading={isPending} className="flex items-center gap-2">
				<Lightbulb />
				Mejorar contexto
			</LoadingSwap>
		</Button>
	);
};

export default EnhanceContextButton;

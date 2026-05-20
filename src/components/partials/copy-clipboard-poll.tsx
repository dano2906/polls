import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { createPollPublicURL } from "#/actions/app";
import { Button } from "../ui/button";

interface Props {
	slug: string;
	label?: boolean;
	buttonType?: "ghost" | "ghostContext";
}

const CopyClipboardPoll = ({
	slug,
	buttonType = "ghostContext",
	label = true,
}: Props) => {
	const [copied, setCopied] = useState(false);
	const handleCopy = async () => {
		try {
			await createPollPublicURL(slug);
			setCopied(true);
			setTimeout(() => {
				setCopied(false);
			}, 2000);
		} catch (err) {
			console.error("Error al copiar al portapapeles: ", err);
		}
	};
	return (
		<Button
			variant={buttonType}
			size={label ? "default" : "icon-sm"}
			onClick={handleCopy}
		>
			{copied ? (
				<>
					<Check />
					{label && <span>¡Copiado!</span>}
				</>
			) : (
				<>
					<Copy />
					{label && <span>Copiar enlace de la encuesta</span>}
				</>
			)}
		</Button>
	);
};

export default CopyClipboardPoll;

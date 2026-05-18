import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { createPollPublicURL } from "#/actions/app";
import { Button } from "../ui/button";

interface Props {
	slug: string;
}

const ForkVersionButton = ({ slug }: Props) => {
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
		<Button variant={"ghostContext"} onClick={handleCopy}>
			{copied ? (
				<>
					<Check />
					<span>¡Copiado!</span>
				</>
			) : (
				<>
					<Copy />
					<span>Copiar enlace de la encuesta</span>
				</>
			)}
		</Button>
	);
};

export default ForkVersionButton;

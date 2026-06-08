import { Check, Copy, Download, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { cn } from "@/common/lib/utils";
import { Button } from "@/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/ui/popover";
import { createPollPublicURL } from "../actions/poll";

interface Props {
	slug: string;
	label?: boolean;
	buttonType?: "ghost" | "ghostContext";
}
const PollQrPopover = ({
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
	const downloadQR = (filename: string) => {
		const svg = document.getElementById(`poll-${slug}-qr`);
		if (!svg) return;

		const svgData = new XMLSerializer().serializeToString(svg);
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();

		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;
			ctx?.drawImage(img, 0, 0);
			const pngFile = canvas.toDataURL("image/png");

			const downloadLink = document.createElement("a");
			downloadLink.download = filename;
			downloadLink.href = pngFile;
			downloadLink.click();
		};

		img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
	};
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={buttonType}
					size={label ? "default" : "icon-sm"}
					className={cn(
						label && "w-full flex items-center justify-start gap-2",
					)}
				>
					<QrCode />
					{label && "Mostrar código QR"}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="center">
				<PopoverHeader>
					<PopoverTitle>Código QR</PopoverTitle>
					<PopoverDescription>
						Puede escanear o descargar este código QR
					</PopoverDescription>
				</PopoverHeader>
				<QRCodeSVG
					id={`poll-${slug}-qr`}
					value={`${import.meta.env.VITE_PUBLIC_APP_URL}/q/${slug}`}
					size={160}
					bgColor={"#ffffff"}
					fgColor={"#000000"}
					level={"H"}
					className="my-2.5 mx-auto"
				/>
				<div className="w-full grid grid-cols-2 gap-2">
					<Button
						variant={"outline"}
						size={"sm"}
						className="text-xs"
						onClick={() => handleCopy()}
					>
						{copied ? (
							<>
								<Check />
								<span>¡Copiado!</span>
							</>
						) : (
							<>
								<Copy />
								<span>Copiar enlace</span>
							</>
						)}
					</Button>
					<Button
						variant={"outline"}
						size={"sm"}
						className="text-xs"
						onClick={() => downloadQR(`poll-${slug}-qr`)}
					>
						<Download />
						Descargar QR
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default PollQrPopover;

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Camera, Check, Loader2, X } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";
import { uploadToCloudinary } from "@/common/lib/utils";
import { updateAvatarAction } from "../actions/user";

interface Props {
	avatarUrl: string | null | undefined;
	email: string | undefined;
	id: string;
}

export default function ChangeUserAvatar({ avatarUrl, email, id }: Props) {
	const router = useRouter();
	const qc = useQueryClient();
	const [isUploading, setIsUploading] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!selectedFile) {
			setPreviewUrl(null);
			return;
		}

		const objectUrl = URL.createObjectURL(selectedFile);
		setPreviewUrl(objectUrl);

		return () => URL.revokeObjectURL(objectUrl);
	}, [selectedFile]);

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);
		}
	};

	const { mutate: handleConfirmUpload } = useMutation({
		mutationKey: ["user", "change-avatar", id],
		mutationFn: async () => {
			if (!selectedFile) return;

			try {
				setIsUploading(true);

				const cloudinaryResult = await uploadToCloudinary(selectedFile);

				await updateAvatarAction({
					data: {
						id,
						url: cloudinaryResult.url,
						publicId: cloudinaryResult.publicId,
					},
				});

				setSelectedFile(null);
				await router.invalidate();
			} catch (error) {
				console.error("Error actualizando el avatar:", error);
			} finally {
				setIsUploading(false);
			}
		},
		onSuccess: async () => {
			toast.success("Su avatar ha sido cambiado satisfactoriamente");
			await qc.invalidateQueries({
				queryKey: ["user"],
			});
		},
	});

	const handleCancel = () => {
		setSelectedFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	const currentDisplaySrc = previewUrl || avatarUrl || undefined;

	return (
		<div className="flex flex-col items-center">
			{/* Contenedor relativo que agrupa el avatar y sus controles flotantes */}
			<div className="relative size-40">
				<button
					type="button"
					className="relative h-full w-full group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
					onClick={triggerFileInput}
					disabled={isUploading}
					aria-label="Seleccionar nueva foto de perfil"
				>
					<Avatar className="h-full w-full border-2 border-border transition-opacity group-hover:opacity-80">
						<AvatarImage src={currentDisplaySrc} alt={email || "Usuario"} />
						<AvatarFallback className="text-xl">
							{email?.substring(0, 2).toUpperCase() || "US"}
						</AvatarFallback>
					</Avatar>

					{/* Capa superpuesta en hover */}
					<div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
						{isUploading ? (
							<Loader2 className="h-6 w-6 animate-spin text-white" />
						) : (
							<Camera className="h-6 w-6 text-white" />
						)}
					</div>
				</button>

				{/* Panel de acciones flotante (Abajo a la derecha) */}
				{selectedFile && (
					<div className="absolute -bottom-1 -right-2 flex items-center gap-1 bg-background border shadow-md p-0.5 rounded-full animate-in fade-in zoom-in-95 duration-150 z-10">
						<Button
							type="button"
							variant="default"
							size="sm"
							onClick={() => handleConfirmUpload()}
							disabled={isUploading}
							className="h-7 w-7 rounded-full p-0 shadow-none"
							aria-label="Confirmar cambio de avatar"
						>
							{isUploading ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Check className="h-3.5 w-3.5" />
							)}
						</Button>

						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleCancel}
							disabled={isUploading}
							className="h-7 w-7 rounded-full p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
							aria-label="Cancelar cambio de avatar"
						>
							<X className="h-3.5 w-3.5" />
						</Button>
					</div>
				)}
			</div>

			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept="image/*"
				className="hidden"
				disabled={isUploading}
			/>
		</div>
	);
}

import type { AnyFieldApi } from "@tanstack/react-form";
import { Camera, Loader2 } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/common/components/ui/avatar";

interface AvatarUploadFieldProps {
	// Pasamos el API completo del field de TanStack Form
	field: AnyFieldApi;
	email?: string;
	initialAvatarUrl?: string | null;
	isSubmitting?: boolean;
}

export default function AvatarUploadField({
	field,
	email,
	initialAvatarUrl,
	isSubmitting = false,
}: AvatarUploadFieldProps) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Extraemos el valor actual del estado del formulario de TanStack
	const fieldValue = field.state.value as File | string | null | undefined;

	// Generar la URL de vista previa cuando el valor cambia y es un archivo
	useEffect(() => {
		if (!fieldValue || typeof fieldValue === "string") {
			setPreviewUrl(null);
			return;
		}

		const objectUrl = URL.createObjectURL(fieldValue);
		setPreviewUrl(objectUrl);

		// Limpieza de memoria para evitar fugas (memory leaks)
		return () => URL.revokeObjectURL(objectUrl);
	}, [fieldValue]);

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Usamos el método expuesto por TanStack Form para actualizar el valor y marcarlo como 'touched'
			field.setValue(file);
		}
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	// Prioridad de visualización: Vista previa local > URL en string (si viene de la BD en el form) > URL inicial por Props
	const currentDisplaySrc =
		previewUrl ||
		(typeof fieldValue === "string" ? fieldValue : initialAvatarUrl) ||
		undefined;

	return (
		<div className="w-full flex flex-col items-center">
			<div className="relative size-40">
				<button
					type="button"
					className="relative h-full w-full group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
					onClick={triggerFileInput}
					disabled={isSubmitting}
					aria-label="Seleccionar nueva foto de perfil"
					// Vinculamos eventos básicos de accesibilidad que maneja TanStack si los necesitas
					onBlur={field.handleBlur}
				>
					<Avatar className="h-full w-full border-2 border-border transition-opacity group-hover:opacity-80">
						<AvatarImage src={currentDisplaySrc} alt={email || "Usuario"} />
						<AvatarFallback className="text-xl">
							{email?.substring(0, 2).toUpperCase() || "US"}
						</AvatarFallback>
					</Avatar>

					{/* Capa de hover / cargando */}
					<div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
						{isSubmitting ? (
							<Loader2 className="h-6 w-6 animate-spin text-white" />
						) : (
							<Camera className="h-6 w-6 text-white" />
						)}
					</div>
				</button>
			</div>

			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept="image/*"
				className="hidden"
				disabled={isSubmitting}
			/>

			{field.state.meta.errors.length > 0 && (
				<p className="text-xs text-destructive mt-2">
					{field.state.meta.errors.join(", ")}
				</p>
			)}
		</div>
	);
}

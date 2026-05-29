import { useEffect, useState } from "react";

interface QuestionImageProps {
	currentImageUrl?: string | null;
	currentPublicId?: string | null; // 🆕 Útil para el trackeo de borrado
	onFileSelected: (file: File | null) => void;
	onImageReplaced?: (oldPublicId: string) => void; // 🆕 Notifica si pisa una imagen previa
}

export function QuestionImageUploader({
	currentImageUrl,
	currentPublicId,
	onFileSelected,
	onImageReplaced,
}: QuestionImageProps) {
	const [preview, setPreview] = useState<string | null>(
		currentImageUrl ?? null,
	);

	// 🆕 Escucha cambios externos (por ejemplo, cuando el formulario resetea el campo a null/undefined)
	useEffect(() => {
		// Si desde fuera eliminan la imagen (currentImageUrl pasa a ser falsy),
		// pero nuestra preview actual no es un archivo local recién cargado, limpiamos la preview.
		if (!currentImageUrl && preview && !preview.startsWith("blob:")) {
			setPreview(null);
		} else if (currentImageUrl && !preview) {
			// Si por algún motivo cambia la URL desde fuera (y no hay preview local), la actualizamos
			setPreview(currentImageUrl);
		}
	}, [currentImageUrl, preview]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] || null;

		// 💡 Limpieza de memoria: si la preview anterior era un Object URL, lo liberamos
		if (preview?.startsWith("blob:")) {
			URL.revokeObjectURL(preview);
		}

		if (file) {
			// Si el usuario sube algo nuevo sobre una imagen que ya existía en Cloudinary, avisamos al form
			if (currentPublicId && onImageReplaced) {
				onImageReplaced(currentPublicId);
			}

			setPreview(URL.createObjectURL(file));
			onFileSelected(file);
		} else {
			setPreview(null);
			onFileSelected(null);
		}
	};

	return (
		<div className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/50 mt-2">
			<label
				htmlFor="image"
				className="text-xs font-medium text-muted-foreground"
			>
				Imagen de la pregunta
			</label>
			<input
				name="image"
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="text-sm"
			/>
			{preview && (
				<div className="relative w-20 h-20 mt-1 border rounded overflow-hidden">
					<img
						src={preview}
						alt="Preview"
						className="w-full h-full object-cover"
					/>
				</div>
			)}
		</div>
	);
}

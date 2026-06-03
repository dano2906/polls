import { FileWarning, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

interface ImageUploadProps {
	currentImageUrl?: string | null;
	currentPublicId?: string | null; // Para tracking de borrado en Cloudinary
	maxSizeInMB?: number; // Límite dinámico de peso
	onFileSelected: (file: File | null) => void;
	onImageReplaced?: (oldPublicId: string) => void; // Notifica si pisa una imagen previa
	onImageRemoved?: () => void; // 🆕 Nueva prop para manejar la lógica de borrado del formulario
}

export default function ImageUploader({
	currentImageUrl,
	currentPublicId,
	maxSizeInMB = 2,
	onFileSelected,
	onImageReplaced,
	onImageRemoved, // 🆕
}: ImageUploadProps) {
	const [preview, setPreview] = useState<string | null>(
		currentImageUrl ?? null,
	);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Escucha cambios externos (ej. si el formulario se resetea)
	useEffect(() => {
		if (!currentImageUrl && preview && !preview.startsWith("blob:")) {
			setPreview(null);
		} else if (currentImageUrl && !preview) {
			setPreview(currentImageUrl);
		}
	}, [currentImageUrl, preview]);

	const handleFile = (file: File) => {
		setError(null);

		if (!file.type.startsWith("image/")) {
			setError("El archivo debe ser una imagen válida.");
			return;
		}

		const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
		if (file.size > maxSizeInBytes) {
			setError(`La imagen excede el límite permitido de ${maxSizeInMB}MB.`);
			return;
		}

		if (preview?.startsWith("blob:")) {
			URL.revokeObjectURL(preview);
		}

		if (currentPublicId && onImageReplaced) {
			onImageReplaced(currentPublicId);
		}

		const url = URL.createObjectURL(file);
		setPreview(url);
		onFileSelected(file);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) handleFile(file);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleFile(file);
		e.target.value = "";
	};

	const removeImage = (e: React.MouseEvent) => {
		e.stopPropagation(); // Evita que el click del botón "X" active el explorador de archivos

		if (preview?.startsWith("blob:")) {
			URL.revokeObjectURL(preview);
		}

		setPreview(null);
		setError(null);
		onFileSelected(null);

		// 🆕 Disparar el callback externo si existe para limpiar estados o encolar deletes
		if (onImageRemoved) {
			onImageRemoved();
		}
	};

	return (
		<div className="w-full mx-auto space-y-2">
			<button
				type="button"
				onDragOver={(e) => {
					e.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={handleDrop}
				onClick={() => inputRef.current?.click()}
				className={`relative w-full h-full rounded-lg border-2 border-dashed p-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
					isDragging
						? "border-primary bg-primary/5 scale-[1.01]"
						: "border-muted-foreground/30 hover:border-muted-foreground/60 bg-muted/20"
				}`}
			>
				{!preview ? (
					// Vista de carga (Cuando no hay imagen)
					<div className="flex w-full p-2 flex-col items-center gap-2 text-muted-foreground text-center pointer-events-none">
						<Upload className="w-6 h-6 stroke-[1.5]" />
						<div className="space-y-0.5">
							<p className="text-sm font-medium text-foreground">
								Selecciona o arrastra una imagen
							</p>
							<p className="text-xs text-muted-foreground">
								Formatos aceptados: JPG, PNG (Máx. {maxSizeInMB}MB)
							</p>
						</div>
					</div>
				) : (
					// Vista de Previsualización Pequeña (Cuando ya hay una imagen)
					<div className="flex flex-col items-center gap-3 w-full pointer-events-none">
						<div className="relative w-24 h-24 rounded-md overflow-hidden border border-muted-foreground/20 pointer-events-auto group">
							<img
								src={preview}
								alt="Preview"
								className="w-full h-full object-cover"
							/>
							{/* Botón de eliminar sobre la miniatura al hacer hover */}
							<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
								<Button
									type="button"
									variant={"ghostDestructive"}
									size={"icon-sm"}
									onClick={removeImage}
									title="Eliminar imagen"
								>
									<X className="w-4 h-4" />
								</Button>
							</div>
						</div>
					</div>
				)}

				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					onChange={handleInputChange}
					className="sr-only"
				/>
			</button>

			{/* Alerta de error si el peso o formato no coinciden */}
			{error && (
				<div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20 animate-in fade-in-50">
					<FileWarning className="w-4 h-4 shrink-0" />
					<span>{error}</span>
				</div>
			)}
		</div>
	);
}

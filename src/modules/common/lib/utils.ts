import type { ClassValue } from "clsx";
import { clsx, twMerge } from "cnfast";
import { getCloudinarySignature } from "@/common/actions/cloudinary";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function uploadToCloudinary(
	file: File,
): Promise<{ url: string; publicId: string }> {
	const config = await getCloudinarySignature();

	if (!config) throw new Error("Error obteniendo la firma");

	// 2. Construir FormData
	const formData = new FormData();
	formData.append("file", file);
	formData.append("api_key", config.apiKey);
	formData.append("timestamp", config.timestamp.toString());
	formData.append("signature", config.signature);
	formData.append("folder", config.folder);

	// 3. Subir
	const response = await fetch(
		`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
		{ method: "POST", body: formData },
	);

	if (!response.ok) throw new Error("Error al subir archivo a Cloudinary");

	const data = await response.json();
	return {
		url: data.secure_url,
		publicId: data.public_id,
	};
}

import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getSession } from "@/auth/actions/auth";

export const getCloudinarySignature = createServerFn({ method: "GET" }).handler(
	async () => {
		if (!process.env.CLOUDINARY_API_SECRET) {
			throw new Error(
				"No se encuentra la variable CLOUDINARY_API_SECRET en las variables de entorno",
			);
		}

		if (typeof window !== "undefined") return;

		// 2. Importación dinámica del SDK de Node solo en tiempo de ejecución del servidor
		const { v2: cloudinary } = await import("cloudinary");

		// 3. Lo configuras en caliente justo antes de usarlo
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
			api_key: process.env.CLOUDINARY_API_KEY,
			api_secret: process.env.CLOUDINARY_API_SECRET,
		});

		const timestamp = Math.round(Date.now() / 1000);

		const paramsToSign = {
			timestamp: timestamp,
			folder: "pollify_assets",
		};

		const signature = cloudinary.utils.api_sign_request(
			paramsToSign,
			process.env.CLOUDINARY_API_SECRET,
		);

		return {
			signature,
			timestamp,
			apiKey: process.env.CLOUDINARY_API_KEY!,
			cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
			folder: "pollify_assets",
		};
	},
);

export const deleteImagesFromCloudinary = createServerFn({ method: "POST" })
	.validator((data: { publicIds: string[] }) => data)
	.handler(async ({ data }) => {
		if (!process.env.CLOUDINARY_API_SECRET) {
			throw new Error(
				"No se encuentra la variable CLOUDINARY_API_SECRET en las variables de entorno",
			);
		}

		if (typeof window !== "undefined") return;

		// 2. Importación dinámica del SDK de Node solo en tiempo de ejecución del servidor

		const session = await getSession();
		if (!session) throw notFound();

		const { v2: cloudinary } = await import("cloudinary");

		// 3. Lo configuras en caliente justo antes de usarlo
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
			api_key: process.env.CLOUDINARY_API_KEY,
			api_secret: process.env.CLOUDINARY_API_SECRET,
		});
		if (!data.publicIds.length) return { success: true };

		try {
			// Borra todas las imágenes enviadas en paralelo
			const deletionPromises = data.publicIds.map((id) =>
				cloudinary.uploader.destroy(id),
			);
			await Promise.all(deletionPromises);

			return { success: true };
		} catch (error) {
			console.error("Error al eliminar assets en Cloudinary:", error);
			return {
				success: false,
				error: "No se pudieron eliminar algunas imágenes.",
			};
		}
	});

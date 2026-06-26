import { toast } from "sonner";

const SENSITIVE_KEYWORDS = [
	"UNAUTHORIZED",
	"FORBIDDEN",
	"NOT_FOUND",
	"INTERNAL_SERVER_ERROR",
	"token",
	"secret",
	"api_key",
	"apiSecret",
	"password",
	"sensitive",
];

const USER_SAFE_MESSAGES: Record<string, string> = {
	UNAUTHORIZED: "Debes iniciar sesión para realizar esta acción.",
	FORBIDDEN: "No tienes permisos para realizar esta acción.",
	"Error: UNAUTHORIZED": "Debes iniciar sesión para realizar esta acción.",
	"Error: FORBIDDEN": "No tienes permisos para realizar esta acción.",
};

export function normalizeErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		const msg = error.message;

		if (USER_SAFE_MESSAGES[msg]) {
			return USER_SAFE_MESSAGES[msg];
		}

		const containsSensitive = SENSITIVE_KEYWORDS.some(
			(kw) => msg.toLowerCase().includes(kw.toLowerCase()),
		);
		if (containsSensitive) {
			return "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
		}

		if (
			msg.includes("El slug") ||
			msg.includes("La encuesta") ||
			msg.includes("Debe") ||
			msg.includes("No se") ||
			msg.includes("Error al") ||
			msg.includes("La fecha") ||
			msg.includes("Las encuestas") ||
			msg.includes("Contraseña incorrecta") ||
			msg.includes("Sesión no encontrada") ||
			msg.includes("No puedes eliminar tu propia cuenta") ||
			msg.includes("El tiempo para responder") ||
			msg.includes("El plazo para responder") ||
			msg.includes("Esta encuesta") ||
			msg.includes("No se puede cambiar de")
		) {
			return msg;
		}

		return "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
	}

	if (typeof error === "string") {
		if (USER_SAFE_MESSAGES[error]) return USER_SAFE_MESSAGES[error];
		const containsSensitive = SENSITIVE_KEYWORDS.some((kw) =>
			error.toLowerCase().includes(kw.toLowerCase()),
		);
		if (containsSensitive) {
			return "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
		}
		return error;
	}

	return "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
}

export function handleServerFnError(error: unknown): void {
	const message = normalizeErrorMessage(error);
	toast.error(message);
	if (
		error instanceof Error &&
		!SENSITIVE_KEYWORDS.some((kw) =>
			error.message.toLowerCase().includes(kw.toLowerCase()),
		)
	) {
		console.error("[ServerFnError]", error);
	} else {
		console.error("[ServerFnError] An error occurred (details suppressed)");
	}
}

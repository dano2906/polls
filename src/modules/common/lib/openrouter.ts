import { createOpenRouter } from "@openrouter/ai-sdk-provider";

if (typeof window !== "undefined") {
	throw new Error("openrouter.ts solo puede importarse desde el servidor");
}

export const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

import { createClientOnlyFn } from "@tanstack/react-start";

export const createPollPublicURL = createClientOnlyFn(async (slug: string) => {
	return await navigator.clipboard.writeText(
		`${import.meta.env.VITE_PUBLIC_APP_URL}/p/${slug}`,
	);
});

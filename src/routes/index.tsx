import { createFileRoute } from "@tanstack/react-router";
import ThemeToggle from "#/components/ui/partials/theme-toggle.tsx";
import BetterAuthHeader from "#/integrations/better-auth/header-user.tsx";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-8 bg-background text-foreground">
			<BetterAuthHeader />
			<ThemeToggle />
		</div>
	);
}

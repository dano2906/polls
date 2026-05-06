import { createFileRoute, Link } from "@tanstack/react-router";
import ThemeToggle from "#/components/partials/theme-toggle.tsx";
import BetterAuthHeader from "#/integrations/better-auth/header-user.tsx";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-8 bg-background text-foreground">
			<BetterAuthHeader />
			<ThemeToggle />
			<Link to="/dashboard">To dashboard</Link>
		</div>
	);
}

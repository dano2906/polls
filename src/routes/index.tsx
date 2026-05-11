import { createFileRoute, Link } from "@tanstack/react-router";
import AuthHeader from "#/components/partials/auth-header.tsx";
import ThemeToggle from "#/components/partials/theme-toggle.tsx";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-8 bg-background text-foreground">
			<AuthHeader />
			<ThemeToggle />
			<Link to="/dashboard">To dashboard</Link>
		</div>
	);
}

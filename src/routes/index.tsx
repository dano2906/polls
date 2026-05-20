import { createFileRoute } from "@tanstack/react-router";
import AuthHeader from "#/components/partials/auth-header.tsx";
import ListPublishedPolls from "#/components/partials/list-published-polls";
import ThemeToggle from "#/components/partials/theme-toggle.tsx";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-8 bg-background text-foreground space-y-8">
			<header className="flex items-center justify-center gap-2.5">
				<AuthHeader />
				<ThemeToggle />
			</header>
			<main className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-2">
				<ListPublishedPolls />
			</main>
		</div>
	);
}

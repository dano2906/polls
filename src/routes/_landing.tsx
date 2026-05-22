import { createFileRoute, Outlet } from "@tanstack/react-router";
import AuthHeader from "#/components/partials/auth-header";
import ThemeToggle from "#/components/partials/theme-toggle";

export const Route = createFileRoute("/_landing")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<header className="flex items-center justify-center gap-2.5 p-4">
				<AuthHeader />
				<ThemeToggle />
			</header>
			<main className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-2">
				<Outlet />
			</main>
		</div>
	);
}

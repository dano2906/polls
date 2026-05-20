import {
	createFileRoute,
	isRedirect,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import type { User } from "better-auth";
import DashboardAside from "#/components/partials/dashboard-aside.tsx";

export const Route = createFileRoute("/_protected")({
	component: RouteComponent,
	beforeLoad: async ({ context, location }) => {
		try {
			if (!context.auth?.session) {
				throw redirect({
					to: "/",
					search: location.pathname,
				});
			}
		} catch (error) {
			// Re-throw redirects (they're intentional, not errors)
			if (isRedirect(error)) throw error;

			// Auth check failed (network error, etc.) - redirect to login
			throw redirect({
				to: "/",
				search: { redirect: location.href },
			});
		}
	},
});

function RouteComponent() {
	const { auth } = Route.useRouteContext();
	return (
		<div className="bg-background text-foreground relative w-full min-h-screen">
			<main className="w-full max-w-md sm:max-lg md:max-w-xl xl:max-w-5xl mx-auto py-6 px-2">
				<Outlet />
			</main>
			<DashboardAside user={auth?.user as User} />
		</div>
	);
}

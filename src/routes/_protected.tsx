import {
	createFileRoute,
	isRedirect,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import DashboardAside from "#/components/partials/dashboard-aside.tsx";
import { ensureSession, getSession } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/_protected")({
	component: RouteComponent,
	beforeLoad: async ({ location }) => {
		try {
			const user = await getSession(); // might throw on network error
			if (!user) {
				throw redirect({
					to: "/",
					search: { redirect: location.href },
				});
			}
			return { user };
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
	loader: {
		handler: async () => {
			const session = await ensureSession();
			return {
				session,
			};
		},
	},
});

function RouteComponent() {
	const { session } = Route.useLoaderData();
	return (
		<div className="bg-background text-foreground relative w-full min-h-screen">
			<main className="w-full max-w-md sm:max-lg md:max-w-xl xl:max-w-4xl mx-auto py-6 px-2">
				<Outlet />
			</main>
			<DashboardAside user={session.user} />
		</div>
	);
}

import {
	createFileRoute,
	isRedirect,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import AuthHeader from "#/components/partials/auth-header";

export const Route = createFileRoute("/_protected")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		try {
			if (!context.auth?.session) {
				throw redirect({
					to: "/",
				});
			}
		} catch (error) {
			if (isRedirect(error)) throw error;
			throw redirect({
				to: "/",
			});
		}
	},
});

function RouteComponent() {
	return (
		<div className="bg-background text-foreground relative w-full min-h-screen max-w-md sm:max-lg md:max-w-xl xl:max-w-5xl mx-auto py-6 px-2">
			<header className="w-full flex items-center justify-end p-2">
				<AuthHeader />
			</header>
			<main>
				<Outlet />
			</main>
		</div>
	);
}

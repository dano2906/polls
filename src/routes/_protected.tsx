import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import AuthHeader from "@/auth/components/auth-header";
import { AutoBreadcrumb } from "@/common/components/partials/auto-breadcrumb";

export const Route = createFileRoute("/_protected")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		if (!context.auth) {
			throw redirect({ to: "/" });
		}
		return { auth: context.auth };
	},
});

function RouteComponent() {
	return (
		<div className="bg-background text-foreground relative w-full min-h-screen max-w-md sm:max-lg md:max-w-xl xl:max-w-5xl mx-auto py-6 px-2">
			<header className="w-full flex items-center justify-end p-2">
				<AuthHeader />
			</header>
			<main className="px-2">
				<AutoBreadcrumb />
				<Outlet />
			</main>
		</div>
	);
}

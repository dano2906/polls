import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ensureSession } from "@/auth/actions/auth";
import AuthHeader from "@/auth/components/auth-header";
import { AutoBreadcrumb } from "@/common/components/partials/auto-breadcrumb";

export const Route = createFileRoute("/_protected")({
	component: RouteComponent,
	beforeLoad: async () => {
		await ensureSession();
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

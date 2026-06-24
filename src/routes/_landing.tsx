import { createFileRoute, Outlet } from "@tanstack/react-router";
import AuthHeader from "@/auth/components/auth-header";
import { AutoBreadcrumb } from "@/common/components/partials/auto-breadcrumb";

export const Route = createFileRoute("/_landing")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="w-full max-w-md sm:max-lg md:max-w-xl xl:max-w-5xl mx-auto py-6 px-2">
			<header className="w-full flex items-center justify-end p-2">
				<AuthHeader />
			</header>
			<main className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-2">
				<AutoBreadcrumb />
				<Outlet />
			</main>
		</div>
	);
}

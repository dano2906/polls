import { createFileRoute, Outlet } from "@tanstack/react-router";
import AuthHeader from "@/common/components/partials/auth-header";

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
				<Outlet />
			</main>
		</div>
	);
}

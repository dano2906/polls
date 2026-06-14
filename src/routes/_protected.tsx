import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import AuthHeader from "@/common/components/partials/auth-header";
import { ensureSession } from "@/common/lib/auth-functions";
import { Button } from "@/ui/button";

export const Route = createFileRoute("/_protected")({
	component: RouteComponent,
	beforeLoad: async () => {
		await ensureSession();
	},
});

function RouteComponent() {
	const router = useRouter();
	return (
		<div className="bg-background text-foreground relative w-full min-h-screen max-w-md sm:max-lg md:max-w-xl xl:max-w-5xl mx-auto py-6 px-2">
			<header className="w-full flex items-center justify-between p-2">
				<Button variant={"ghost"} onClick={() => router.history.back()}>
					<ArrowLeft /> Atrás
				</Button>
				<AuthHeader />
			</header>
			<main>
				<Outlet />
			</main>
		</div>
	);
}

import { useRouteContext, useRouter } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { GithubDark } from "#/components/ui/svgs/githubDark";
import { GithubLight } from "#/components/ui/svgs/githubLight.tsx";
import { Google } from "#/components/ui/svgs/google";
import { authClient } from "#/lib/auth-client";

export default function BetterAuthHeader() {
	const { data: session, isPending } = authClient.useSession();
	const { theme } = useRouteContext({ from: "__root__" });
	const router = useRouter();

	async function signInWithProvider(provider: "github" | "google") {
		await authClient.signIn.social({
			provider,
			callbackURL: "/",
		});
		router.invalidate();
	}

	if (isPending) {
		return (
			<div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
		);
	}

	if (session?.user) {
		return (
			<div className="flex items-center gap-2">
				{session.user.image ? (
					<img src={session.user.image} alt="" className="h-8 w-8" />
				) : (
					<div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
						<span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
							{session.user.name?.charAt(0).toUpperCase() || "U"}
						</span>
					</div>
				)}
				<button
					type="button"
					onClick={() => {
						void authClient.signOut();
					}}
					className="flex-1 h-9 px-4 text-sm font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
				>
					Sign out
				</button>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center gap-2">
			<Button
				variant={"secondary"}
				size={"icon"}
				onClick={() => signInWithProvider("github")}
			>
				{theme === "dark" ? <GithubDark /> : <GithubLight />}
			</Button>
			<Button
				variant={"secondary"}
				size={"icon"}
				onClick={() => signInWithProvider("google")}
			>
				<Google />
			</Button>
		</div>
	);
}

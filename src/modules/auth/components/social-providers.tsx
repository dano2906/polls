import { useRouteContext, useRouter } from "@tanstack/react-router";
import { Button } from "@/common/components/ui/button";
import { GithubDark } from "@/ui/svgs/githubDark";
import { GithubLight } from "@/ui/svgs/githubLight.tsx";
import { Google } from "@/ui/svgs/google";
import { authClient } from "../lib/auth-client";

const SocialProviders = () => {
	const router = useRouter();
	const { theme } = useRouteContext({ from: "__root__" });
	async function signInWithProvider(provider: "github" | "google") {
		await authClient.signIn.social({
			provider,
			callbackURL: "/",
		});
		router.invalidate();
	}

	return (
		<div className="w-full grid grid-cols-2 gap-2 p-1">
			<Button
				variant={"secondary"}
				size={"icon"}
				onClick={() => signInWithProvider("github")}
				className="w-full max-w-60 mx-auto"
			>
				{theme === "dark" ? <GithubDark /> : <GithubLight />}
			</Button>
			<Button
				variant={"secondary"}
				size={"icon"}
				onClick={() => signInWithProvider("google")}
				className="w-full max-w-60 mx-auto"
			>
				<Google />
			</Button>
		</div>
	);
};

export default SocialProviders;

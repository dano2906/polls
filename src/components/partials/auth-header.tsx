import {
	Link,
	useMatches,
	useRouteContext,
	useRouter,
} from "@tanstack/react-router";
import { File, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "#/components/ui/button";
import { GithubDark } from "#/components/ui/svgs/githubDark";
import { GithubLight } from "#/components/ui/svgs/githubLight.tsx";
import { Google } from "#/components/ui/svgs/google";
import { authClient } from "#/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import ThemeToggle from "./theme-toggle";

export default function AuthHeader() {
	const { data: session, isPending } = authClient.useSession();
	const { theme } = useRouteContext({ from: "__root__" });
	const router = useRouter();
	const matches = useMatches();
	const isProtected = matches.some((match) => match.routeId === "/_protected");

	async function signInWithProvider(provider: "github" | "google") {
		await authClient.signIn.social({
			provider,
			callbackURL: "/",
		});
		router.invalidate();
	}

	async function signOut() {
		authClient.signOut();
		await router.invalidate();
	}

	if (isPending) {
		return (
			<div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
		);
	}

	if (session?.user) {
		return (
			<div className="flex items-center gap-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Avatar size="lg">
							<AvatarImage
								src={
									session.user.image ||
									`https://api.dicebear.com/9.x/glass/svg?seed=${session.user.name}`
								}
							/>
							<AvatarFallback>
								{session.user.name || session.user.email}
							</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="flex flex-col items-end justify-center gap-0.5 text-primary">
								<span className="text-sm font-sg font-semibold">
									{session.user.name}
								</span>
								<small className="text-xs font-sg font-normal">
									{session.user.email}
								</small>
							</DropdownMenuLabel>
							<DropdownMenuItem asChild>
								{isProtected ? (
									<Link
										to="/"
										className="w-full flex items-center justify-start gap-1"
										preload={false}
									>
										<File />
										Landing
									</Link>
								) : (
									<Link
										to="/dashboard"
										className="w-full flex items-center justify-start gap-1"
										preload={false}
									>
										<LayoutDashboard />
										Administración
									</Link>
								)}
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem asChild>
								<ThemeToggle />
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Button
									variant={"ghostDestructive"}
									onClick={signOut}
									className="w-full flex items-center justify-start gap-2 p-0"
								>
									<LogOut className="hover:text-destructive" />
									Salir
								</Button>
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
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

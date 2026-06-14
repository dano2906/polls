import {
	Link,
	useMatches,
	useRouteContext,
	useRouter,
} from "@tanstack/react-router";
import { File, FilePlus, Import, LayoutDashboard, LogOut } from "lucide-react";
import { authClient } from "@/auth/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Button } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { GithubDark } from "@/ui/svgs/githubDark";
import { GithubLight } from "@/ui/svgs/githubLight.tsx";
import { Google } from "@/ui/svgs/google";
import ThemeToggle from "../../common/components/partials/theme-toggle";

export default function AuthHeader() {
	const { theme, auth } = useRouteContext({ from: "__root__" });
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

	if (auth?.user) {
		return (
			<div className="flex items-center gap-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Avatar size="lg">
							<AvatarImage
								src={
									auth.user.image ||
									`https://api.dicebear.com/9.x/glass/svg?seed=${auth.user.name}`
								}
							/>
							<AvatarFallback>
								{auth.user.name || auth.user.email}
							</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="flex flex-col items-end justify-center gap-0.5 text-primary">
								<span className="text-sm font-sg font-semibold">
									{auth.user.name}
								</span>
								<small className="text-xs font-sg font-normal">
									{auth.user.email}
								</small>
							</DropdownMenuLabel>
							<DropdownMenuItem asChild>
								<Link
									to="/"
									className="w-full flex items-center justify-start gap-1"
									preload={false}
								>
									<File />
									Inicio
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link
									to="/dashboard"
									className="w-full flex items-center justify-start gap-1"
									preload={false}
								>
									<LayoutDashboard />
									Administración
								</Link>
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						{isProtected && (
							<DropdownMenuGroup>
								<DropdownMenuItem asChild>
									<Link
										to="/poll/new"
										className="w-full flex items-center justify-start gap-1"
										preload={false}
									>
										<FilePlus />
										Crear encuesta
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										to="/poll/import"
										preload={false}
										className="w-full flex items-center justify-start gap-1"
									>
										<Import />
										Importar encuesta
									</Link>
								</DropdownMenuItem>
							</DropdownMenuGroup>
						)}

						{isProtected && <DropdownMenuSeparator />}
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

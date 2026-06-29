import { memo } from "react";
import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import {
	Building2,
	File,
	FilePlus,
	Import,
	Key,
	LayoutDashboard,
	LogOut,
	User,
} from "lucide-react";
import ThemeToggle from "@/common/components/partials/theme-toggle";
import { getOptimizedImageUrl } from "@/common/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Button, buttonVariants } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { authClient } from "../lib/auth-client";

const AuthHeader = memo(function AuthHeader() {
	const { auth } = useRouteContext({ from: "__root__" });
	const router = useRouter();

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
									getOptimizedImageUrl(auth.user.image, 96) ||
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
							{auth && (
								<DropdownMenuItem asChild>
									<Link
										to="/user/me"
										className="w-full flex items-center justify-start gap-1"
										preload={false}
									>
										<User />
										Mi perfil
									</Link>
								</DropdownMenuItem>
							)}

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
						{auth && (
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>Encuestas</DropdownMenuSubTrigger>
								<DropdownMenuPortal>
									<DropdownMenuSubContent>
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
									</DropdownMenuSubContent>
								</DropdownMenuPortal>
							</DropdownMenuSub>
						)}
						{auth && auth.user.role === "admin" && (
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>Entidades</DropdownMenuSubTrigger>
								<DropdownMenuPortal>
									<DropdownMenuSubContent>
										<DropdownMenuItem asChild>
											<Link
												to="/user"
												search={{
													limit: 10,
													offset: 0,
													sortDirection: "desc",
												}}
												className="w-full flex items-center justify-start gap-1"
												preload={false}
											>
												<User />
												Usuarios
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link
												to="/org"
												className="w-full flex items-center justify-start gap-1"
												preload={false}
											>
												<Building2 />
												Organizaciones
											</Link>
										</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuPortal>
							</DropdownMenuSub>
						)}

						{auth && <DropdownMenuSeparator />}
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
			<Link to="/auth" className={buttonVariants({ variant: "secondary" })}>
				<Key />
				Iniciar sesión
			</Link>
		</div>
	);
});

export default AuthHeader;

import { Link, useRouter } from "@tanstack/react-router";
import type { User } from "better-auth";
import { LogOutIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

interface DashboardAsideProps {
	user: User;
}

const menu = [
	{
		menuLabel: "Encuesta",
		links: [
			{
				to: "/poll/new",
				label: "Crear encuesta",
			},
		],
	},
];

const DashboardAside = ({ user }: DashboardAsideProps) => {
	const router = useRouter();
	async function signOut() {
		await authClient.signOut();
		router.invalidate();
	}

	return (
		<aside className="hidden md:block absolute top-8 right-6 space-y-5">
			<div className="w-full flex items-center justify-end gap-2">
				<div className="w-full flex flex-col items-end justify-center gap-0.5">
					<span className="text-base font-sg font-semibold">{user.name}</span>
					<small className="text-xs font-sg font-normal">{user.email}</small>
				</div>
				<Link to="/dashboard">
					<Avatar size="lg">
						<AvatarImage src={user.image || ""} />
						<AvatarFallback>{user.name || user.email}</AvatarFallback>
					</Avatar>
				</Link>
			</div>
			<ul className="flex flex-col items-end justify-end gap-1.5">
				{menu.map((m) => {
					return (
						<li
							key={m.menuLabel}
							className="flex flex-col items-end justify-center gap-1.5"
						>
							<h5 className="text-xl text-primary font-medium">
								{m.menuLabel}
							</h5>
							{m.links.map((link) => {
								return (
									<Link
										key={link.to}
										to={link.to}
										className="text-foreground hover:text-muted-foreground active:text-accent text-sm font-sg font-thin"
									>
										{link.label}
									</Link>
								);
							})}
						</li>
					);
				})}
				<li>
					<Button
						onClick={() => signOut()}
						variant={"link"}
						size={"sm"}
						className="text-destructive text-sm font-medium font-sg flex items-center justify-center gap-1"
					>
						<LogOutIcon size={12} />
						Salir
					</Button>
				</li>
			</ul>
		</aside>
	);
};

export default DashboardAside;

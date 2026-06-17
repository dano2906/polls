import { Link } from "@tanstack/react-router";
import { cn } from "@/common/lib/utils";
import { Button, buttonVariants } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

const UserTableActions = () => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Acciones</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuItem asChild>
					<Link
						to="/user/new"
						className={cn(
							buttonVariants({
								variant: "ghost",
							}),
							"w-full flex items-start justify-start",
						)}
					>
						Crear usuario
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default UserTableActions;

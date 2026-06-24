import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { cn } from "@/common/lib/utils";
import { Button, buttonVariants } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

const MembersTableActions = ({ slug }: { slug: string }) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Acciones</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuItem asChild>
					<Link
						to="/org/$orgSlug/members"
						params={{ orgSlug: slug }}
						className={cn(
							buttonVariants({
								variant: "ghost",
							}),
							"w-full flex items-start justify-start",
						)}
					>
						<Users />
						Ver detalles de miembros
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default MembersTableActions;

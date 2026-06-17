import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { cn } from "@/common/lib/utils";
import { Button, buttonVariants } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import RemoveUserButton from "./remove-user-button";
import RevokeSessionsButton from "./revoke-sessions-button";
import UnbanUserButton from "./unban-user-button";

interface Props {
	id: string;
	isBanned: boolean;
}
const UserColumnActions = ({ id, isBanned }: Props) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghostContext">
					<Menu />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="flex flex-col items-start justify-start">
				<DropdownMenuItem asChild>
					<Link
						to="/user/$id"
						params={{
							id,
						}}
						className={cn(
							buttonVariants({
								variant: "ghostContext",
							}),
							"w-full flex items-start justify-start",
						)}
					>
						Detalles
					</Link>
				</DropdownMenuItem>
				{isBanned && (
					<DropdownMenuItem asChild>
						<UnbanUserButton id={id} />
					</DropdownMenuItem>
				)}
				<DropdownMenuItem asChild>
					<RevokeSessionsButton id={id} mode="all" />
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<RemoveUserButton id={id} />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default UserColumnActions;

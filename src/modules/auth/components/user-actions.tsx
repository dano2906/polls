import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Button } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

interface Props {
	id: string;
}
const UserActionsMenu = ({ id }: Props) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghostContext">
					<Menu />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem asChild>
					<Link
						to="/user/$id"
						params={{
							id,
						}}
					>
						Detalles
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default UserActionsMenu;

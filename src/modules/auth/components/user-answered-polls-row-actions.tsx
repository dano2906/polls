import { Link } from "@tanstack/react-router";
import cn from "cnfast";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/common/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";

interface Props {
	slug: string;
}
const UserAnsweredPollsRowActions = ({ slug }: Props) => {
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
						to="/poll/$slug/result"
						params={{
							slug,
						}}
						className={cn(
							buttonVariants({
								variant: "ghostContext",
							}),
							"w-full flex items-start justify-start",
						)}
					>
						Ver respuestas
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default UserAnsweredPollsRowActions;

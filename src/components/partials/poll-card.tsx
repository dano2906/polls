import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil } from "lucide-react";
import type { Poll } from "#/shared/types";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "../ui/context-menu";
import ForkVersionButton from "./fork-poll-button";

interface Props {
	poll: Pick<
		Poll,
		| "name"
		| "description"
		| "slug"
		| "startDate"
		| "endDate"
		| "version"
		| "status"
	>;
}

const PollCard = ({ poll }: Props) => {
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<Card className="p-4 gap-3 w-full h-full flex flex-col items-center justify-between">
					<CardHeader className="w-full p-0.5 gap-1">
						<CardTitle className="font-sgc text-2xl font-medium tracking-wide text-truncate line-clamp-2">
							{poll.name}
						</CardTitle>
						<CardDescription className="font-sg text-truncate line-clamp-4">
							{poll.description}
						</CardDescription>
					</CardHeader>
					<CardFooter className="w-full p-0.5 gap-1">
						<Badge>{poll.status}</Badge>
						<Badge variant={"secondary"} className="text-xs font-sg font-thin">
							<span className="text-accent-foreground text-xs">
								{format(poll.startDate, "dd/MM/yyyy", { locale: es })}{" "}
							</span>
							{poll.endDate && `...`}
							{poll.endDate && (
								<span className="text-accent-foreground">
									{" "}
									{format(poll.endDate, "dd/MM/yyyy", {
										locale: es,
									}).toString()}
								</span>
							)}
						</Badge>
						<Badge
							variant={"outline"}
							className="font-sg text-xs font-semibold text-accent-foreground"
						>
							V{poll.version}
						</Badge>
					</CardFooter>
				</Card>
			</ContextMenuTrigger>
			<ContextMenuContent className="flex flex-col">
				<ContextMenuItem asChild>
					<Link
						to="/poll/update/$slug"
						params={{
							slug: poll.slug as string,
						}}
						preload={false}
						className={buttonVariants({
							variant: "ghost",
						})}
					>
						<Pencil />
						Editar encuesta
					</Link>
				</ContextMenuItem>
				<ContextMenuItem asChild>
					<ForkVersionButton
						slug={poll.slug as string}
						version={poll.version as number}
					/>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default PollCard;

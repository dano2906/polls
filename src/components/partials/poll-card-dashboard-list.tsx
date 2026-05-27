import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil } from "lucide-react";
import { cn } from "#/lib/utils";
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
import CopyClipboardPoll from "./copy-clipboard-poll";
import DeletePollButton from "./delete-poll-button";
import ForkVersionButton from "./fork-poll-button";
import PollQrPopover from "./poll-qrcode-popover";

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

const PollCardDashoardList = ({ poll }: Props) => {
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
			<ContextMenuContent className="grid w-auto">
				<ContextMenuItem asChild>
					<Link
						to="/poll/update/$slug"
						params={{
							slug: poll.slug as string,
						}}
						preload={false}
						className={cn(
							buttonVariants({
								variant: "ghostContext",
							}),
							"w-full flex items-center justify-start",
						)}
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
				<ContextMenuItem asChild>
					<CopyClipboardPoll slug={poll.slug as string} />
				</ContextMenuItem>
				<ContextMenuItem asChild>
					<PollQrPopover slug={poll.slug as string} />
				</ContextMenuItem>
				<ContextMenuItem asChild>
					<DeletePollButton slug={poll.slug as string} />
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default PollCardDashoardList;

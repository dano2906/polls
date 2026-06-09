import { ClientOnly, Link } from "@tanstack/react-router";
import { Loader, Pencil, Sheet } from "lucide-react";
import { cn } from "@/common/lib/utils";
import { ExportFormat } from "@/common/shared/types";
import { buttonVariants } from "@/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/ui/context-menu";
import type { Poll, PollStatus } from "../shared/types";
import { ChangePollStatus } from "./change-poll-status";
import CopyClipboardPoll from "./copy-clipboard-poll";
import DeletePollButton from "./delete-poll-button";
import ExportMenuButton from "./export-menu-button";
import ForkVersionButton from "./fork-poll-button";
import PollQrPopover from "./poll-qrcode-popover";

interface Props {
	children: React.ReactNode;
	poll: Poll;
	forkVersion: number;
}

const CardContextMenu = ({ children, poll, forkVersion }: Props) => {
	return (
		<ContextMenu key={poll.slug}>
			<ContextMenuTrigger className="w-full h-full flex flex-col items-center justify-between">
				{children}
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
							"w-full flex items-center justify-start group",
						)}
					>
						<Pencil className="group-hover:text-accent-foreground" />
						Editar encuesta
					</Link>
				</ContextMenuItem>

				<ContextMenuItem asChild>
					<ForkVersionButton slug={poll.slug as string} version={forkVersion} />
				</ContextMenuItem>
				<ContextMenuItem asChild>
					<ClientOnly fallback={<Loader />}>
						<CopyClipboardPoll slug={poll.slug as string} />
					</ClientOnly>
				</ContextMenuItem>
				<ContextMenuItem asChild>
					<PollQrPopover slug={poll.slug as string} />
				</ContextMenuItem>
				{poll.slug && (
					<ContextMenuSub>
						<ContextMenuSubTrigger
							className={cn(
								buttonVariants({
									variant: "ghostContext",
								}),
								"w-full flex items-center justify-start group",
							)}
						>
							<Sheet className="group-hover:text-accent-foreground" />
							Exportar
						</ContextMenuSubTrigger>
						<ContextMenuSubContent>
							<ContextMenuGroup>
								{Object.values(ExportFormat).map((f) => {
									return (
										<ContextMenuItem key={f} asChild>
											<ExportMenuButton format={f} slug={poll.slug as string} />
										</ContextMenuItem>
									);
								})}
							</ContextMenuGroup>
						</ContextMenuSubContent>
					</ContextMenuSub>
				)}
				<ContextMenuItem asChild>
					<ChangePollStatus
						slug={poll.slug as string}
						status={poll.status as PollStatus}
						inMenu
					/>
				</ContextMenuItem>
				<ContextMenuItem asChild>
					<DeletePollButton slug={poll.slug as string} />
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default CardContextMenu;

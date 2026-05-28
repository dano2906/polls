import { Link } from "@tanstack/react-router";
import { Pencil, Sheet } from "lucide-react";
import { cn } from "#/lib/utils";
import { ExportFormat } from "#/shared/types";
import { buttonVariants } from "../ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "../ui/context-menu";
import CopyClipboardPoll from "./copy-clipboard-poll";
import DeletePollButton from "./delete-poll-button";
import ExportMenuButton from "./export-menu-button";
import ForkVersionButton from "./fork-poll-button";
import PollQrPopover from "./poll-qrcode-popover";

interface Props {
	children: React.ReactNode;
	poll: {
		id: string;
		rootId: string | null;
		name: string;
		description: string | null;
		slug: string | null;
		startDate: Date;
		endDate: Date | null;
		status: "draft" | "published" | "archived" | null;
		version: number | null;
		createdAt: Date | null;
	};
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
							"w-full flex items-center justify-start",
						)}
					>
						<Pencil />
						Editar encuesta
					</Link>
				</ContextMenuItem>
				<ContextMenuItem asChild>
					<ForkVersionButton slug={poll.slug as string} version={forkVersion} />
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
				<ContextMenuSub>
					<ContextMenuSubTrigger
						className={buttonVariants({
							variant: "ghostContext",
						})}
					>
						<Sheet />
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
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default CardContextMenu;

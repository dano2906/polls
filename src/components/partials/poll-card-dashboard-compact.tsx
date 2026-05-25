import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil } from "lucide-react";
import { cn } from "#/lib/utils";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import {
	Card,
	CardContent,
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
import ForkVersionButton from "./fork-poll-button";
import PollQrPopover from "./poll-qrcode-popover";

interface Props {
	pollGroup: {
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
	}[];
}

const PollCardDashboardCompact = ({ pollGroup }: Props) => {
	const lastPoll = pollGroup[0];
	return (
		<Card className="p-4 gap-3 w-full h-full flex flex-col items-center justify-between">
			<ContextMenu>
				<ContextMenuTrigger className="w-full h-full flex flex-col items-center justify-between">
					<CardHeader className="w-full p-0.5 gap-1">
						<CardTitle className="font-sgc text-2xl font-medium tracking-wide text-truncate line-clamp-2">
							{lastPoll.name}
						</CardTitle>
						{/* Si no hay descripción, este componente no ocupará espacio */}
						{lastPoll.description && (
							<CardDescription className="font-sg text-truncate line-clamp-4">
								{lastPoll.description}
							</CardDescription>
						)}
					</CardHeader>

					<CardContent className="w-full p-0.5 gap-1 flex-1 flex flex-col justify-end">
						<div>
							<Badge>{lastPoll.status}</Badge>
							<Badge
								variant={"secondary"}
								className="text-xs font-sg font-thin"
							>
								<span className="text-accent-foreground text-xs">
									{format(lastPoll.startDate, "dd/MM/yyyy", {
										locale: es,
									})}{" "}
								</span>
								{lastPoll.endDate && `...`}
								{lastPoll.endDate && (
									<span className="text-accent-foreground">
										{" "}
										{format(lastPoll.endDate, "dd/MM/yyyy", {
											locale: es,
										}).toString()}
									</span>
								)}
							</Badge>
							<Badge
								variant={"outline"}
								className="font-sg text-xs font-semibold text-accent-foreground"
							>
								V{lastPoll.version}
							</Badge>
						</div>
					</CardContent>
				</ContextMenuTrigger>
				<ContextMenuContent className="grid w-auto">
					<ContextMenuItem asChild>
						<Link
							to="/poll/update/$slug"
							params={{
								slug: lastPoll.slug as string,
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
							slug={lastPoll.slug as string}
							version={lastPoll.version as number}
						/>
					</ContextMenuItem>
					<ContextMenuItem asChild>
						<CopyClipboardPoll slug={lastPoll.slug as string} />
					</ContextMenuItem>
					<ContextMenuItem asChild>
						<PollQrPopover slug={lastPoll.slug as string} />
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
			<CardFooter className="px-1">
				<Accordion type="single" collapsible className="w-full">
					{pollGroup.slice(1).map((poll) => {
						return (
							<ContextMenu key={poll.slug}>
								<ContextMenuTrigger className="w-full h-full flex flex-col items-center justify-between">
									<AccordionItem
										value={poll.slug as string}
										className="w-full border-b-0 bg-muted/20"
									>
										<AccordionTrigger className="w-full px-4 hover:no-underline text-sm font-sg tracking-wide">
											{`${poll.name} (v${poll.version})`}
										</AccordionTrigger>

										<AccordionContent className="px-4 pb-4 font-sg space-y-2">
											<p>{poll.description}</p>
											<div>
												<Badge>{poll.status}</Badge>
												<Badge
													variant={"secondary"}
													className="text-xs font-sg font-thin"
												>
													<span className="text-accent-foreground text-xs">
														{format(poll.startDate, "dd/MM/yyyy", {
															locale: es,
														})}{" "}
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
											</div>
										</AccordionContent>
									</AccordionItem>
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
											version={lastPoll.version as number}
										/>
									</ContextMenuItem>
									<ContextMenuItem asChild>
										<CopyClipboardPoll slug={poll.slug as string} />
									</ContextMenuItem>
									<ContextMenuItem asChild>
										<PollQrPopover slug={poll.slug as string} />
									</ContextMenuItem>
								</ContextMenuContent>
							</ContextMenu>
						);
					})}
				</Accordion>
			</CardFooter>
		</Card>
	);
};

export default PollCardDashboardCompact;

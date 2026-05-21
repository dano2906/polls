import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { FileTextIcon, QrCode, Share } from "lucide-react";
import type { getPublishedPolls } from "#/actions/poll";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button, buttonVariants } from "../ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import CopyClipboardPoll from "./copy-clipboard-poll";
import GoToPollLink from "./go-to-poll-link";
import PollQrPopover from "./poll-qrcode-popover";

interface Props {
	poll: Awaited<ReturnType<typeof getPublishedPolls>>[number];
}

const PollCardLanding = ({ poll }: Props) => {
	return (
		<li key={poll.slug} className="h-full w-full">
			<Card className="gap-3 w-full h-full flex flex-col items-center justify-between">
				<CardHeader className="w-full">
					<CardTitle className="font-sg text-xl leading-tight tracking-wide font-medium text-accent-foreground">
						{poll.name}
					</CardTitle>
					<CardDescription className="font-sgc text-base font-normal line-clamp-4">
						{poll.description}
					</CardDescription>
				</CardHeader>
				<div className="w-full space-y-2">
					<CardContent className="space-y-1">
						<Badge
							variant={"secondary"}
							className="text-xs font-sg font-thin px-0 py-1 gap-1 flex items-center w-fit"
						>
							<span className="text-muted-foreground">
								Disponible desde el{" "}
								<strong className="text-foreground font-normal">
									{format(poll.startDate, "dd/MM/yyyy", { locale: es })}
								</strong>
							</span>

							{poll.endDate && (
								<span className="text-muted-foreground">
									{" "}
									hasta el{" "}
									<strong className="text-foreground font-normal">
										{format(poll.endDate, "dd/MM/yyyy", { locale: es })}
									</strong>
								</span>
							)}
						</Badge>
					</CardContent>
					<CardFooter className="justify-end">
						<CardAction className="space-x-2">
							<PollQrPopover
								slug={poll.slug as string}
								buttonType="ghost"
								label={false}
							/>
							<CopyClipboardPoll
								slug={poll.slug as string}
								buttonType="ghost"
								label={false}
							/>
							<GoToPollLink slug={poll.slug} />
						</CardAction>
					</CardFooter>
				</div>
			</Card>
		</li>
	);
};

export default PollCardLanding;

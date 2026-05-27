import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "../ui/badge";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import CardContextMenu from "./card-context-menu";

interface Props {
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
}

const PollCardDashoardList = ({ poll }: Props) => {
	return (
		<CardContextMenu poll={poll} forkVersion={poll.version as number}>
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
		</CardContextMenu>
	);
};

export default PollCardDashoardList;

import { Building2 } from "lucide-react";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/ui/card";
import OrgCardContextMenu from "./org-card-context-menu";

interface Props {
	org: {
		id: string;
		name: string;
		slug: string;
		createdAt: Date | string | number;
	};
}

const OrgCardDashboardList = ({ org }: Props) => {
	const createdDate = new Date(org.createdAt);
	const formattedDate = createdDate.toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

	return (
		<OrgCardContextMenu org={org}>
			<Card className="p-4 gap-3 w-full h-full flex flex-col items-center justify-between">
				<CardHeader className="w-full p-0.5 gap-1">
					<div className="flex items-center gap-2">
						<Building2 className="size-5 text-muted-foreground" />
						<CardTitle className="font-sgc text-2xl font-medium tracking-wide text-truncate line-clamp-2">
							{org.name}
						</CardTitle>
					</div>
					<CardDescription className="font-sg text-truncate line-clamp-4">
						{org.slug}
					</CardDescription>
				</CardHeader>
				<CardFooter className="w-full p-0.5 gap-1 justify-between">
					<CardDescription className="font-sg text-xs font-thin text-muted-foreground">
						Creado: {formattedDate}
					</CardDescription>
				</CardFooter>
			</Card>
		</OrgCardContextMenu>
	);
};

export default OrgCardDashboardList;

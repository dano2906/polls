import { Link } from "@tanstack/react-router";
import { Building2, UserPlus, Users } from "lucide-react";
import { cn } from "@/common/lib/utils";
import { buttonVariants } from "@/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/ui/context-menu";

interface Props {
	children: React.ReactNode;
	org: {
		id: string;
		name: string;
		slug: string;
	};
}

const OrgCardContextMenu = ({ children, org }: Props) => {
	return (
		<ContextMenu key={org.slug}>
			<ContextMenuTrigger className="w-full h-full flex flex-col items-center justify-between">
				{children}
			</ContextMenuTrigger>
			<ContextMenuContent className="grid w-auto">
				<ContextMenuItem asChild>
					<Link
						to="/org/$orgSlug"
						params={{ orgSlug: org.slug }}
						preload={false}
						className={cn(
							buttonVariants({ variant: "ghostContext" }),
							"w-full flex items-center justify-start group",
						)}
					>
						<Building2 className="group-hover:text-accent-foreground" />
						Ver detalles
					</Link>
				</ContextMenuItem>
				<ContextMenuItem asChild>
					<Link
						to="/org/$orgSlug/members"
						params={{ orgSlug: org.slug }}
						preload={false}
						className={cn(
							buttonVariants({ variant: "ghostContext" }),
							"w-full flex items-center justify-start group",
						)}
					>
						<Users className="group-hover:text-accent-foreground" />
						Ver miembros
					</Link>
				</ContextMenuItem>
				<ContextMenuItem asChild>
					<Link
						to="/org/$orgSlug/invite"
						params={{ orgSlug: org.slug }}
						preload={false}
						className={cn(
							buttonVariants({ variant: "ghostContext" }),
							"w-full flex items-center justify-start group",
						)}
					>
						<UserPlus className="group-hover:text-accent-foreground" />
						Invitar miembro
					</Link>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default OrgCardContextMenu;

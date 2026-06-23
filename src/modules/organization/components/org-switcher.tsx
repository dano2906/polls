import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { listOrganizationsOptions } from "@/organization/lib/query";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

export function OrganizationSwitcher({ currentSlug }: { currentSlug: string }) {
	const { data } = useSuspenseQuery(listOrganizationsOptions());

	if (!data || data.length === 0) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<Building2 className="size-4" />
					<span>Cambiar organización</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Organizaciones</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{data.map((org) => (
					<DropdownMenuItem key={org.id} asChild>
						<Link
							to="/org/$orgSlug"
							params={{ orgSlug: org.slug }}
							className="w-full"
						>
							{org.name}
						</Link>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

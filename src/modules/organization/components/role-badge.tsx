import { Shield } from "lucide-react";
import { Badge } from "@/ui/badge";

const ROLE_LABELS: Record<string, string> = {
	owner: "Propietario",
	admin: "Administrador",
	member: "Miembro",
};

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
	owner: "default",
	admin: "secondary",
	member: "outline",
};

interface Props {
	role: string;
}

export function RoleBadge({ role }: Props) {
	const label = ROLE_LABELS[role] ?? role;
	const variant = ROLE_VARIANTS[role] ?? "outline";

	return (
		<Badge variant={variant}>
			{role === "owner" && <Shield className="size-3" />}
			{label}
		</Badge>
	);
}

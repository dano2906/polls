import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "better-auth";
import type { SessionWithImpersonatedBy } from "better-auth/plugins";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { UAParser } from "ua-parser-js";
import { DataTableColumnHeader } from "@/common/components/partials/data-table-column-header";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/common/components/ui/avatar";
import { addChecboxSelectColumn } from "@/common/lib/table";
import UserActionsMenu from "./user-actions";

export const listUsersColumns: ColumnDef<User>[] = [
	addChecboxSelectColumn(),
	{
		accessorKey: "image",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Avatar" />
		),
		cell: ({ row }) => {
			return row.getValue("image") ? (
				<Avatar size="sm">
					<AvatarImage src={row.getValue("image")} />
					<AvatarFallback>
						{row.getValue("name") || row.getValue("email")}
					</AvatarFallback>
				</Avatar>
			) : (
				<span>No image available</span>
			);
		},
	},
	{
		accessorKey: "email",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Correo electrónico" />
		),
	},
	{
		accessorKey: "name",
		header: "Nombre",
	},

	{
		id: "actions",
		accessorKey: "actions",
		header: "Acciones",
		cell: ({ row }) => {
			return <UserActionsMenu id={row.original.id} />;
		},
	},
];

export const listUserSessionsColumns: ColumnDef<SessionWithImpersonatedBy>[] = [
	{
		accessorKey: "ipAddress",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Dirección IP" />
		),
		cell: ({ getValue }) => {
			return <code className="font-mono">{getValue<string>()}</code>;
		},
	},
	{
		accessorKey: "userAgent",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Dispositivo / Navegador" />
		),
		cell: ({ getValue }) => {
			const rawUserAgent = getValue<string>();

			// Controlamos si por algún motivo viene vacío o no existe
			if (!rawUserAgent) {
				return (
					<span className="text-muted-foreground text-sm">Desconocido</span>
				);
			}

			// Inicializamos el parser con el UA de esta fila
			const parser = new UAParser(rawUserAgent);
			const result = parser.getResult();

			const browser = result.browser.name
				? `${result.browser.name} ${result.browser.major || ""}`
				: "Navegador indeterminado";
			const os = result.os.name
				? `${result.os.name} ${result.os.version || ""}`
				: "SO desconocido";
			const isDesktop = !result.device.type; // Si type es undefined, suele ser Desktop

			return (
				<div className="flex flex-col gap-0.5 max-w-[300px] truncate">
					{/* Línea principal: Chrome 120 en macOS 10.15 */}
					<span className="font-medium text-sm text-foreground">
						{browser}{" "}
						<span className="text-muted-foreground font-normal text-xs">
							en
						</span>{" "}
						{os}
					</span>

					{/* Subtexto: Tipo de dispositivo (Mobile, Tablet, Desktop) */}
					<span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
						{isDesktop ? "Escritorio" : result.device.type}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Fecha de creación" />
		),
		cell: ({ getValue }) => {
			const rawDate = getValue<string | Date>();

			if (!rawDate) {
				return <span className="text-muted-foreground text-sm">Nunca</span>;
			}

			const date = new Date(rawDate);
			const formattedDate = format(date, "d 'de' MMMM, yyyy - HH:mm", {
				locale: es,
			});

			return (
				<div className="flex flex-col gap-0.5 min-w-[180px]">
					<span className="text-sm font-medium text-foreground">
						{formattedDate}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "expiresAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Fecha de expiración" />
		),
		cell: ({ getValue }) => {
			const rawDate = getValue<string | Date>();

			if (!rawDate) {
				return <span className="text-muted-foreground text-sm">Nunca</span>;
			}

			const date = new Date(rawDate);
			const hasExpired = isPast(date);
			const formattedDate = format(date, "d 'de' MMMM, yyyy - HH:mm", {
				locale: es,
			});

			const relativeTime = formatDistanceToNow(date, {
				locale: es,
				addSuffix: true,
			});

			return (
				<div className="flex flex-col gap-0.5 min-w-[180px]">
					<span className="text-sm font-medium text-foreground">
						{formattedDate}
					</span>

					<span
						className={`text-xs ${hasExpired ? "text-destructive font-medium" : "text-muted-foreground"}`}
					>
						{hasExpired
							? `Expirada (${relativeTime})`
							: `Expira ${relativeTime}`}
					</span>
				</div>
			);
		},
	},
	{
		id: "actions",
		accessorKey: "actions",
		header: "Acciones",
		cell: ({ row }) => {
			return "acciones";
		},
	},
];

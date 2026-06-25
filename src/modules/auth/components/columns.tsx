import type { ColumnDef } from "@tanstack/react-table";
import type {
	SessionWithImpersonatedBy,
	UserWithRole,
} from "better-auth/plugins";
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
import type { getUserAnsweredPolls } from "../actions/user";
import SessionActionsMenu from "./session-actions";
import UserAnsweredPollsRowActions from "./user-answered-polls-row-actions";
import UserRowActions from "./user-row-actions";

export const listUsersColumns: ColumnDef<UserWithRole>[] = [
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
		meta: { label: "Avatar" },
	},
	{
		accessorKey: "email",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Correo electrónico" />
		),
		meta: { label: "Correo electrónico" },
	},
	{
		accessorKey: "name",
		header: "Nombre",
		meta: { label: "Nombre" },
	},
	{
		accessorKey: "banned",
		header: "Estado",
		meta: { label: "Estado" },
		cell: ({ row }) => {
			const isBanned = row.getValue<boolean>("banned");
			const banExpires = row.original.banExpires;

			if (!isBanned) {
				return (
					<span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20">
						Activo
					</span>
				);
			}

			let banMessage = "Baneado permanentemente";

			if (banExpires) {
				const date = new Date(banExpires);
				if (!Number.isNaN(date.getTime())) {
					banMessage = `Baneado hasta ${format(date, "d 'de' MMMM, yyyy", { locale: es })}`;
				}
			}

			return (
				<span
					className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20"
					title={banMessage}
				>
					{banMessage}
				</span>
			);
		},
	},
	{
		id: "actions",
		accessorKey: "actions",
		header: "Acciones",
		cell: ({ row }) => {
			return (
				<UserRowActions
					id={row.original.id}
					isBanned={Boolean(row.original.banned)}
				/>
			);
		},
		meta: { label: "Acciones" },
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
		meta: { label: "Dirección IP" },
	},
	{
		accessorKey: "userAgent",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Dispositivo / Navegador" />
		),
		meta: { label: "DIspositivo / Navegador" },
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
		accessorKey: "expiresAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Fecha de expiración" />
		),
		meta: { label: "Fecha de expiración" },
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
			return (
				<SessionActionsMenu token={row.original.token} id={row.original.id} />
			);
		},
		meta: { label: "Acciones" },
	},
];

export const listUserAnsweredPolls: ColumnDef<
	Awaited<ReturnType<typeof getUserAnsweredPolls>>[number]
>[] = [
	{
		accessorKey: "name",
		header: "Nombre",
		meta: { label: "Nombre" },
	},
	{
		accessorKey: "description",
		header: "Descripción",
		meta: { label: "Descripción" },
	},
	{
		accessorKey: "submittedAt",
		header: "Fecha de respuesta",
		meta: { label: "Fecha de respuesta" },
		cell: ({ getValue }) => {
			const date = getValue<Date | null>();
			if (!date)
				return <span className="text-muted-foreground text-sm">-</span>;
			return (
				<span>{format(date, "d 'de' MMMM, yyyy - HH:mm", { locale: es })}</span>
			);
		},
	},
	{
		id: "actions",
		accessorKey: "actions",
		header: "Acciones",
		cell: ({ row }) => {
			return <UserAnsweredPollsRowActions slug={row.original.slug as string} />;
		},
		meta: { label: "Acciones" },
	},
];

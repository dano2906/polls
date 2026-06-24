import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/common/components/partials/data-table-column-header";
import type { Member } from "../shared/types";
import { RoleBadge } from "./role-badge";

export const listMembersColumns: ColumnDef<Member>[] = [
	{
		accessorKey: "user.avatar",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Avatar" />
		),
		cell: ({ row }) => {
			const name = row.original.user.name;
			const image = row.original.user.image;

			return (
				<div className="flex items-center gap-3">
					{image ? (
						<img
							src={image}
							alt={name}
							className="w-8 h-8 rounded-full object-cover"
						/>
					) : (
						<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
							{name.charAt(0).toUpperCase()}
						</div>
					)}
				</div>
			);
		},
		meta: {
			label: "Avatar",
		},
	},
	{
		accessorKey: "user.name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Usuario" />
		),
		cell: ({ getValue }) => (
			<span className="text-foreground">{getValue<string>()}</span>
		),
		meta: {
			label: "Usuario",
		},
	},
	{
		accessorKey: "user.email",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Correo electrónico" />
		),
		cell: ({ getValue }) => (
			<span className="text-foreground">{getValue<string>()}</span>
		),
		meta: {
			label: "Correo electrónico",
		},
	},
	{
		accessorKey: "role",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Rol" />
		),
		cell: ({ getValue }) => {
			const role = getValue<string>();
			return <RoleBadge role={role} />;
		},
		meta: {
			label: "Rol",
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Fecha de registro" />
		),
		cell: ({ getValue }) => {
			const date = getValue<Date>();
			return (
				<span className="text-gray-500 text-sm">
					{new Date(date).toLocaleDateString("es-ES", {
						year: "numeric",
						month: "short",
						day: "numeric",
					})}
				</span>
			);
		},
		meta: {
			label: "Fecha de registro",
		},
	},
];

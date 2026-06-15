import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "better-auth";
import { DataTableColumnHeader } from "@/common/components/partials/data-table-column-header";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/common/components/ui/avatar";
import { addChecboxSelectColumn } from "@/common/lib/table";

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
			return "acciones";
		},
	},
];

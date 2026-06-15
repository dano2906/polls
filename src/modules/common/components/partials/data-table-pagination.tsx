import { type Table } from "@tanstack/react-table";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";

import { Button } from "@/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";

interface DataTablePaginationProps<TData> {
	table: Table<TData>;
	totalRows?: number;
}

export function DataTablePagination<TData>({
	table,
	totalRows,
}: DataTablePaginationProps<TData>) {
	const total = totalRows ?? table.getFilteredRowModel().rows.length;
	return (
		<div className="w-full flex items-center justify-between gap-2 px-2">
			<div className="w-full text-xs text-muted-foreground text-start">
				{table.getFilteredSelectedRowModel().rows.length} de {total} fila(s)
				seleccionadas.
			</div>
			<div className="w-full flex items-center space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="text-xs">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 25, 30, 40, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[100px] items-center justify-center text-xs font-medium">
					Página {table.getState().pagination.pageIndex + 1} de{" "}
					{Math.max(1, table.getPageCount())}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="icon"
						className="hidden size-8 lg:flex"
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Primera página</span>
						<ChevronsLeft />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Página anterior</span>
						<ChevronLeft />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Página siguiente</span>
						<ChevronRight />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="hidden size-8 lg:flex"
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Página final</span>
						<ChevronsRight />
					</Button>
				</div>
			</div>
		</div>
	);
}

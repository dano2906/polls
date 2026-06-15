import { useNavigate, useSearch } from "@tanstack/react-router";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Eye, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/ui/table";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "../ui/input-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Spinner } from "../ui/spinner";
import { DataTablePagination } from "./data-table-pagination";

export interface TableFilters {
	limit: number;
	offset: number;
	sortBy?: string;
	searchField?: string;
	searchValue?: string;
	sortDirection?: "asc" | "desc";
}

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	filteringColumns: (keyof TData & string)[];
	total?: number;
	isLoading?: boolean;
	mode?: "client" | "server";
}

export function DataTable<TData, TValue>({
	columns,
	data,
	filteringColumns,
	total = 0,
	isLoading = false,
	mode = "client",
}: DataTableProps<TData, TValue>) {
	const searchParams = useSearch({ strict: false }) as TableFilters;
	const navigate = useNavigate();

	const limit = searchParams.limit ?? 10;
	const offset = searchParams.offset ?? 0;
	const sortBy = searchParams.sortBy;
	const sortDirection = searchParams.sortDirection ?? "desc";
	const searchValue = searchParams.searchValue ?? "";
	const activeSearchField =
		searchParams.searchField ?? filteringColumns[0] ?? "";

	const [localSearch, setLocalSearch] = useState(searchValue);

	const pageIndex = Math.floor(offset / limit);
	const computedPageCount = Math.max(1, Math.ceil(total / limit));

	const sortingState = sortBy
		? [{ id: sortBy, desc: sortDirection === "desc" }]
		: [];

	// Preparamos el estado de filtros de columna para TanStack Table
	const columnFilters =
		activeSearchField && searchValue
			? [{ id: activeSearchField, value: searchValue }]
			: [];

	const isServer = mode === "server";

	useEffect(() => {
		setLocalSearch(searchValue);
	}, [searchValue]);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (localSearch !== searchValue) {
				navigate({
					to: ".",
					search: (prev: any) => ({
						...prev,
						searchField: localSearch ? activeSearchField : undefined,
						searchValue: localSearch || undefined,
						offset: 0,
					}),
				});
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [localSearch, activeSearchField, navigate, searchValue]);

	const handleSearchFieldChange = (newField: string) => {
		navigate({
			to: ".",
			search: (prev: any) => ({
				...prev,
				searchField: newField ?? undefined,
				searchValue: localSearch ?? undefined,
				offset: 0,
			}),
		});
	};

	const table = useReactTable({
		data,
		columns,
		// Si es modo cliente, TanStack calcula el pageCount internamente
		pageCount: isServer ? computedPageCount : undefined,
		getCoreRowModel: getCoreRowModel(),

		// Modelos necesarios para el modo cliente
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),

		// Banderas que controlan el modo (delegar vs hacer internamente)
		manualPagination: isServer,
		manualSorting: isServer,
		manualFiltering: isServer,

		state: {
			pagination: {
				pageIndex,
				pageSize: limit,
			},
			sorting: sortingState,
			columnFilters, // <-- Inyectamos el estado del filtro de la URL a la tabla
		},
		onPaginationChange: (updater) => {
			const nextState =
				typeof updater === "function"
					? updater({ pageIndex, pageSize: limit })
					: updater;

			navigate({
				to: ".",
				search: (prev: any) => ({
					...prev,
					limit: nextState.pageSize,
					offset: nextState.pageIndex * nextState.pageSize,
				}),
			});
		},
		onSortingChange: (updater) => {
			const nextState =
				typeof updater === "function" ? updater(sortingState) : updater;
			const firstSort = nextState[0];

			navigate({
				to: ".",
				search: (prev: any) => ({
					...prev,
					sortBy: firstSort ? firstSort.id : undefined,
					sortDirection: firstSort
						? firstSort.desc
							? "desc"
							: "asc"
						: undefined,
					offset: 0,
				}),
			});
		},
	});

	// En modo cliente, el total de filas filtradas cambia dinámicamente
	const currentTotalRows = isServer
		? total
		: table.getFilteredRowModel().rows.length;

	return (
		<div className="flex w-full flex-col items-center justify-center gap-4">
			<div className="flex w-full items-center gap-0.5">
				<InputGroup className="w-full max-w-md px-1">
					{filteringColumns.length > 1 && (
						<InputGroupAddon align={"inline-end"}>
							<Select
								value={activeSearchField}
								onValueChange={handleSearchFieldChange}
							>
								<SelectTrigger
									className="w-full max-w-28 p-1 text-xs"
									size="sm"
								>
									<SelectValue placeholder="Filtrar por..." className="w-28" />
								</SelectTrigger>
								<SelectContent>
									{filteringColumns.map((col) => (
										<SelectItem
											key={col}
											value={col}
											className="text-xs capitalize"
										>
											{col}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</InputGroupAddon>
					)}

					<InputGroupInput
						placeholder={
							filteringColumns.length === 1
								? `Filtrar por ${filteringColumns[0]}`
								: "Filtrar por..."
						}
						value={localSearch}
						onChange={(event) => setLocalSearch(event.target.value)}
						className={filteringColumns.length > 1 ? "rounded-l-none" : ""}
					/>
					<InputGroupAddon align="inline-end" className="gap-1">
						{localSearch && localSearch.length > 0 && (
							<InputGroupButton
								aria-label="Clean"
								title="Clean filters"
								size="icon-xs"
								variant={"ghostDestructive"}
								onClick={() => {
									setLocalSearch("");
									navigate({
										to: ".",
										search: (prev: any) => ({
											...prev,
											searchField: undefined,
											searchValue: undefined,
											offset: 0,
										}),
									});
								}}
							>
								<X />
							</InputGroupButton>
						)}
					</InputGroupAddon>
				</InputGroup>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="ml-auto">
							<Eye />
							Visibilidad
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{table
							.getAllColumns()
							.filter((column) => column.getCanHide())
							.map((column) => {
								const meta = column.columnDef.meta as
									| { label?: string }
									| undefined;
								const label = meta?.label ?? column.id;
								return (
									<DropdownMenuCheckboxItem
										key={column.id}
										checked={column.getIsVisible()}
										onCheckedChange={(value) =>
											column.toggleVisibility(!!value)
										}
									>
										{label}
									</DropdownMenuCheckboxItem>
								);
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="w-full overflow-hidden rounded-md border">
				{isLoading && <Spinner />}
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									Sin resultados.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Usamos currentTotalRows para que la paginación funcione correctamente en ambos modos */}
			<DataTablePagination table={table} totalRows={currentTotalRows} />
		</div>
	);
}

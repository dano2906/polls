import { useNavigate, useSearch } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/common/hooks/useDebounce"; // O implementado inline abajo si no tienes uno
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/ui/input-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";

interface Props {
	showStateSelector?: boolean;
	from: "/_protected/dashboard" | "/_landing/";
}

interface Filter {
	q?: string;
	status?: "all" | "draft" | "published" | "archived";
}

const STATUS_LABELS = {
	all: "Todos",
	draft: "Borrador",
	published: "Publicado",
	archived: "Archivado",
};

export function PollFilterBar({ showStateSelector = false, from }: Props) {
	const search = useSearch({ from }) as Filter;
	const navigate = useNavigate();

	// Valores por defecto si no existen en la URL
	const currentQ = search.q || "";
	const currentStatus = search.status || "all";

	// 2. Estado local para el input de texto (para que la escritura sea fluida)
	const [textFilter, setTextFilter] = useState(currentQ);

	// Ref para rastrear el último valor que el componente envió a la URL
	const lastNavigatedQRef = useRef(currentQ);

	// Sincronizar el estado local si la URL cambia externamente (ej. navegación con atrás/adelante)
	// No se ejecuta cuando el cambio viene del propio debounce
	useEffect(() => {
		if (currentQ !== lastNavigatedQRef.current) {
			setTextFilter(currentQ);
		}
	}, [currentQ]);

	// 3. Debounce del texto de búsqueda
	const debouncedSearchTerm = useDebounce(textFilter, 250);

	// 4. Efecto para actualizar la URL cuando el término deboneado cambia
	useEffect(() => {
		if (debouncedSearchTerm !== currentQ) {
			lastNavigatedQRef.current = debouncedSearchTerm;
			navigate({
				search: (prev: Filter) => ({
					...prev,
					q: debouncedSearchTerm,
				}),
				replace: true, // Evita llenar el historial del navegador con cada keystroke
			});
		}
	}, [debouncedSearchTerm, navigate, currentQ]);

	// 5. Manejador para el cambio de estado (este es instantáneo, no lleva debounce)
	const handleStatusChange = (newStatus: string) => {
		navigate({
			search: (prev: Filter) => ({
				...prev,
				status: newStatus === "all" ? undefined : newStatus, // Limpia de la URL si es 'all'
			}),
			replace: true,
		});
	};

	return (
		<div className="grid w-full max-w-md gap-4 mx-auto">
			<InputGroup className="px-1">
				<InputGroupInput
					placeholder="Da vinci y los cuadros..."
					value={textFilter}
					onChange={(e) => setTextFilter(e.target.value)}
				/>
				<InputGroupAddon align="inline-end" className="gap-1">
					{showStateSelector && (
						<Select value={currentStatus} onValueChange={handleStatusChange}>
							<SelectTrigger className="w-full max-w-28 p-1 text-xs" size="sm">
								<SelectValue placeholder="Estado" className="w-28">
									{STATUS_LABELS[currentStatus as keyof typeof STATUS_LABELS]}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="all">Todos</SelectItem>
									<SelectItem value="draft">Borrador</SelectItem>
									<SelectItem value="published">Publicado</SelectItem>
									<SelectItem value="archived">Archivado</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					)}
					{(currentStatus !== "all" || textFilter !== "") && (
						<InputGroupButton
							aria-label="Clean"
							title="Clean filters"
							size="icon-xs"
							variant={"ghostDestructive"}
							onClick={() => {
								setTextFilter("");
								handleStatusChange("all");
							}}
						>
							<X />
						</InputGroupButton>
					)}
				</InputGroupAddon>
			</InputGroup>
		</div>
	);
}

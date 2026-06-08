import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AnyFieldApi } from "@tanstack/react-form";
import { GripVertical } from "lucide-react";
import { useEffect, useState } from "react";

interface Answer {
	id: string;
	answerText: string;
}

interface RankingFieldProps {
	field: AnyFieldApi;
	answers: Answer[];
}

interface SortableItemProps {
	id: string;
	text: string;
}

export function RankingSortableItem({ id, text }: SortableItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		// 💡 SOLUCIÓN: Si se está arrastrando, eliminamos la transición para que siga al cursor en tiempo real.
		// Las demás tarjetas de la lista sí conservarán la transición para apartarse suavemente.
		transition: isDragging ? undefined : transition,
		zIndex: isDragging ? 50 : "auto",
		opacity: isDragging ? 0.8 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`
            flex items-center gap-3 p-3 bg-background border rounded-lg shadow-xs select-none 
            transition-all cursor-grab active:cursor-grabbing
            hover:bg-muted/30 hover:border-muted-foreground/30
            ${isDragging ? "ring-2 ring-accent/20 border-accent" : ""}
          `}
		>
			{/* El icono ahora es puramente visual y decorativo, ya no es un botón */}
			<div className="text-muted-foreground/60 p-1 shrink-0">
				<GripVertical className="h-5 w-5" />
			</div>

			<p className="text-sm font-medium text-foreground pointer-events-none">
				{text}
			</p>
		</div>
	);
}

export function RankingField({ field, answers }: RankingFieldProps) {
	// Inicializamos el orden según el valor actual del formulario, o por defecto el de la base de datos
	const [orderedIds, setOrderedIds] = useState<string[]>(() => {
		const currentValue = field.state.value as string[];
		return currentValue && currentValue.length > 0
			? currentValue
			: answers.map((a) => a.id);
	});

	// Configuración de sensores para soporte Móvil (Pointer) y Accesibilidad (Teclado)
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	useEffect(() => {
		if (!field.state.value || field.state.value.length === 0) {
			field.handleChange(orderedIds);
		}
	}, [field.handleChange, field.state.value, orderedIds]);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = orderedIds.indexOf(active.id as string);
			const newIndex = orderedIds.indexOf(over.id as string);

			const nextOrder = arrayMove(orderedIds, oldIndex, newIndex);

			setOrderedIds(nextOrder);
			field.handleChange(nextOrder);
		}
	}

	const sortedAnswers = orderedIds
		.map((id) => answers.find((ans) => ans.id === id))
		.filter(Boolean) as Answer[];

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={orderedIds}
				strategy={verticalListSortingStrategy}
			>
				<div className="space-y-2 mt-2">
					{sortedAnswers.map((ans) => (
						<RankingSortableItem
							key={ans.id}
							id={ans.id}
							text={ans.answerText}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}

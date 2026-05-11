"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react"; // Opcional, para mantener consistencia
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
	value?: Date;
	onChange: (date?: Date) => void;
	placeholder?: string;
	className?: string;
	id?: string;
	name?: string;
}

export function DateInput({
	value,
	onChange,
	placeholder = "Selecciona una fecha",
	className,
	id,
	name,
}: DatePickerProps) {
	return (
		<Field id={id} name={name} className={cn("w-full", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						id="date-picker-simple"
						className={cn(
							"w-full justify-start text-left font-normal",
							!value && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{value ? (
							format(value, "PPP", { locale: es })
						) : (
							<span>{placeholder}</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={value}
						onSelect={onChange}
						lang="es"
					/>
				</PopoverContent>
			</Popover>
		</Field>
	);
}

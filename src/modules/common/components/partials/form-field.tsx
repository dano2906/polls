import type { AnyFieldApi } from "@tanstack/react-form-start";
import type { ClassValue } from "clsx";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/common/lib/utils";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import { Checkbox } from "@/ui/checkbox";
import { DateInput } from "@/ui/date-input";
import { Field, FieldLabel } from "@/ui/field";
import { Input } from "@/ui/input";
import { NumberInput } from "@/ui/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { Slider } from "@/ui/slider";
import { Textarea } from "@/ui/textarea";

export enum FieldType {
	INPUT_TEXT = "input_text",
	INPUT_NUMBER = "input_number",
	TEXTAREA = "textarea",
	SIMPLE_DATE = "simple_date",
	RANGE_DATE = "range_date",
	SELECT = "select",
	CHECKBOX = "checkbox",
	RADIO = "radio",
	SLIDER = "slider",
	DATE_SINGLE = "date_single",
	DATE_RANGE = "date_range",
}

// 1. Interfaz para definir qué puedes sobreescribir del comportamiento por defecto
interface OverrideBindings {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	value?: any;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	onChange?: (value: any) => void;
	onBlur?: () => void;
}

interface Props {
	field: AnyFieldApi;
	field_type: FieldType | `${FieldType}`; // Permite tanto el Enum como strings literales
	label: string;
	input_classes?: ClassValue;
	required?: boolean;
	disabled?: boolean;
	placeholder?: string;
	options?: {
		value: string;
		label: string;
	}[];
	minRating?: number;
	maxRating?: number;
	minDate?: string;
	maxDate?: string;
	minLimit?: number;
	maxLimit?: number;
	overrideBindings?: (field: AnyFieldApi) => OverrideBindings;
}

const RenderField = ({
	field,
	field_type,
	placeholder,
	options,
	disabled = false,
	overrideBindings,
	minRating = 1,
	maxRating = 5,
	minDate,
	maxDate,
	minLimit,
	maxLimit,
}: Omit<Props, "label" | "input_classes">) => {
	const overrides = overrideBindings ? overrideBindings(field) : {};

	const value =
		overrides.value !== undefined ? overrides.value : field.state.value;

	const fromLimit = minDate ? parseISO(minDate) : undefined;
	const toLimit = maxDate ? parseISO(maxDate) : undefined;

	switch (field_type) {
		case "input_text":
			return (
				<Input
					id={field.name}
					name={field.name}
					value={value}
					onChange={(e) =>
						overrides.onChange
							? overrides.onChange(e)
							: field.handleChange(e.target.value)
					}
					onBlur={() =>
						overrides.onBlur ? overrides.onBlur() : field.handleBlur()
					}
					placeholder={placeholder}
					disabled={disabled}
				/>
			);
		case "input_number":
			return (
				<NumberInput
					id={field.name}
					name={field.name}
					value={value}
					min={minLimit}
					max={maxLimit}
					onChange={(e) =>
						overrides.onChange ? overrides.onChange(e) : field.handleChange(e)
					}
					onBlur={() =>
						overrides.onBlur ? overrides.onBlur() : field.handleBlur()
					}
					disabled={disabled}
				/>
			);
		case "textarea":
			return (
				<Textarea
					id={field.name}
					name={field.name}
					value={value}
					onChange={(e) =>
						overrides.onChange
							? overrides.onChange(e)
							: field.handleChange(e.target.value)
					}
					onBlur={() =>
						overrides.onBlur ? overrides.onBlur() : field.handleBlur()
					}
					placeholder={placeholder}
					disabled={disabled}
				/>
			);
		case "simple_date":
			return (
				<DateInput
					id={field.name}
					name={field.name}
					value={value}
					onChange={(e) =>
						overrides.onChange ? overrides.onChange(e) : field.handleChange(e)
					}
				/>
			);
		case "checkbox":
			return (
				<Checkbox
					id={field.name}
					checked={value}
					onCheckedChange={(e) =>
						overrides.onChange ? overrides.onChange(e) : field.handleChange(e)
					}
					onBlur={() =>
						overrides.onBlur ? overrides.onBlur() : field.handleBlur()
					}
					disabled={disabled}
				/>
			);
		case "radio":
			return (
				<RadioGroup
					name={field.name}
					value={value ?? ""}
					onValueChange={(e) =>
						overrides.onChange ? overrides.onChange(e) : field.handleChange(e)
					}
					disabled={disabled}
					className="flex flex-col space-y-2 pt-1"
				>
					{options?.map((opt) => {
						const itemId = `${field.name}-${opt.value}`;
						return (
							<div
								key={opt.value}
								className="flex items-center space-x-3 space-y-0"
							>
								<RadioGroupItem value={opt.value} id={itemId} />
								<FieldLabel htmlFor={itemId}>{opt.label}</FieldLabel>
							</div>
						);
					})}
				</RadioGroup>
			);
		case "select":
			return (
				<Select
					name={field.name}
					value={value}
					onValueChange={(e) =>
						overrides.onChange ? overrides.onChange(e) : field.handleChange(e)
					}
					disabled={disabled}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder={placeholder} />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{options?.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			);
		case "slider": {
			const currentNumericValue =
				value !== "" && value !== undefined && value !== null
					? Number(value)
					: minRating;

			return (
				<div className="w-full space-y-2 pt-2">
					<Slider
						id={field.name}
						name={field.name}
						min={minRating}
						max={maxRating}
						step={1}
						value={[currentNumericValue]}
						disabled={disabled}
						onValueChange={(vals) => {
							const selectedVal = vals[0];
							if (overrides.onChange) {
								overrides.onChange(String(selectedVal));
							} else {
								field.handleChange(String(selectedVal));
							}
						}}
						onBlur={() =>
							overrides.onBlur ? overrides.onBlur() : field.handleBlur()
						}
					/>
					<div className="flex justify-between items-center text-xs text-muted-foreground px-1 select-none">
						<span>Mín: {minRating}</span>
						<span className="font-bold text-sm text-primary bg-primary/10 px-2 py-0.5 rounded-full">
							Seleccionado: {currentNumericValue}
						</span>
						<span>Máx: {maxRating}</span>
					</div>
				</div>
			);
		}
		case "date_single": {
			// Evaluamos si el valor actual del formulario es un string válido convertible a Date
			const dateValue =
				value && typeof value === "string" ? parseISO(value) : undefined;
			const isDateValid = dateValue && isValid(dateValue);

			// 💡 Corrección de límites: Convertimos los límites en objetos Date nativos
			const minDateLimit = fromLimit ? new Date(fromLimit) : undefined;
			const maxDateLimit = toLimit ? new Date(toLimit) : undefined;

			// Construimos el array de condiciones de deshabilitación para react-day-picker
			const disabledDays = [];
			if (minDateLimit && !Number.isNaN(minDateLimit.getTime())) {
				disabledDays.push({ before: minDateLimit });
			}
			if (maxDateLimit && !Number.isNaN(maxDateLimit.getTime())) {
				disabledDays.push({ after: maxDateLimit });
			}

			return (
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant={"outline"}
							className={cn(
								"w-full justify-start text-left font-normal",
								!value && "text-muted-foreground",
							)}
							disabled={disabled}
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{isDateValid ? (
								format(dateValue, "PPP", { locale: es })
							) : (
								<span>{placeholder || "Selecciona una fecha"}</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							defaultMonth={
								isDateValid ? dateValue : minDateLimit || new Date()
							}
							selected={isDateValid ? dateValue : undefined}
							onSelect={(date) => {
								const formatted = date ? format(date, "yyyy-MM-dd") : "";
								if (overrides.onChange) {
									overrides.onChange(formatted);
								} else {
									field.handleChange(formatted);
								}
							}}
							// 🛠️ SOLUCIÓN: Reemplazamos 'min' y 'max' por la propiedad oficial 'disabled'
							disabled={disabledDays.length > 0 ? disabledDays : undefined}
						/>
					</PopoverContent>
				</Popover>
			);
		}
		case "date_range": {
			let rangeValue: DateRange | undefined;

			if (value && typeof value === "string" && value.includes("/")) {
				const [startStr, endStr] = value.split("/");

				const start = startStr?.trim() ? parseISO(startStr) : undefined;
				const end = endStr?.trim() ? parseISO(endStr) : undefined;

				rangeValue = {
					from: start && isValid(start) ? start : undefined,
					to: end && isValid(end) ? end : undefined,
				};
			}

			const minDateLimit = fromLimit ? new Date(fromLimit) : undefined;
			const maxDateLimit = toLimit ? new Date(toLimit) : undefined;

			const disabledDays = [];
			if (minDateLimit && !Number.isNaN(minDateLimit.getTime())) {
				disabledDays.push({ before: minDateLimit });
			}
			if (maxDateLimit && !Number.isNaN(maxDateLimit.getTime())) {
				disabledDays.push({ after: maxDateLimit });
			}

			// 💡 DETERMINAR EL MES DE ENFOQUE INICIAL
			// Si ya hay una fecha seleccionada, muestra ese mes. Si no, fuerza el mes del 'minDateLimit'
			const initialMonth = rangeValue?.from || minDateLimit || new Date();

			return (
				<Popover>
					<PopoverTrigger asChild>
						<Button
							id={field.name}
							variant={"outline"}
							className={cn(
								"w-full justify-start text-left font-normal",
								!value && "text-muted-foreground",
							)}
							disabled={disabled}
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{rangeValue?.from ? (
								rangeValue.to ? (
									<>
										{format(rangeValue.from, "LLL dd, yyyy", { locale: es })} -{" "}
										{format(rangeValue.to, "LLL dd, yyyy", { locale: es })}
									</>
								) : (
									format(rangeValue.from, "LLL dd, yyyy", { locale: es })
								)
							) : (
								<span>{placeholder || "Selecciona un rango de fechas"}</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="range"
							// 💡 FOCO DINÁMICO: Esto fuerza al calendario a posicionarse en el periodo disponible
							defaultMonth={initialMonth}
							selected={rangeValue}
							onSelect={(range) => {
								// Si tu validador del formulario espera un OBJETO en lugar de un STRING,
								// descomenta las siguientes líneas y comenta la serialización por string:
								/*
								if (overrides.onChange) {
									overrides.onChange(range);
								} else {
									field.handleChange(range);
								}
								*/

								// --- MANTENIENDO TU SERIALIZACIÓN EN STRING ---
								const startFormatted = range?.from
									? format(range.from, "yyyy-MM-dd")
									: "";
								const endFormatted = range?.to
									? format(range.to, "yyyy-MM-dd")
									: "";

								const serialisedRange =
									startFormatted || endFormatted
										? `${startFormatted}/${endFormatted}`
										: "";

								if (overrides.onChange) {
									overrides.onChange(serialisedRange);
								} else {
									// Cambia esto por 'range' si el error "expected object" persiste
									// debido a la configuración de tu esquema Zod
									field.handleChange(serialisedRange);
								}
							}}
							numberOfMonths={2}
							disabled={disabledDays.length > 0 ? disabledDays : undefined}
						/>
					</PopoverContent>
				</Popover>
			);
		}
		default:
			return (
				<Input
					id={field.name}
					name={field.name}
					value={value}
					onChange={(e) =>
						overrides.onChange
							? overrides.onChange(e)
							: field.handleChange(e.target.value)
					}
					onBlur={() =>
						overrides.onBlur ? overrides.onBlur() : field.handleBlur()
					}
					placeholder={placeholder}
					disabled={disabled}
				/>
			);
	}
};

const FormField = (props: Props) => {
	const { field, field_type, label, input_classes, required = false } = props;

	// Extraemos la renderización de errores repetitiva en una pequeña constante scannable
	const renderError = !field.state.meta.isValid && (
		<em role="alert" className="text-xs text-destructive font-sg mt-1 block">
			{field.state.meta.errors
				.map((e) => (typeof e === "object" ? e.message : e))
				.join(". ")}
		</em>
	);

	if (field_type === FieldType.CHECKBOX) {
		return (
			<Field className={cn([input_classes, "-space-y-0.5"])}>
				<div className="flex items-center justify-start gap-2">
					<RenderField {...props} />
					<FieldLabel htmlFor={field.name}>
						{label} {required && <span className="text-destructive">*</span>}
					</FieldLabel>
				</div>
				{renderError}
			</Field>
		);
	}

	return (
		<Field className={cn([input_classes, "-space-y-0.5"])}>
			<FieldLabel htmlFor={field.name}>
				{label} {required && <span className="text-destructive">*</span>}
			</FieldLabel>
			<RenderField {...props} />
			{renderError}
		</Field>
	);
};

export default FormField;

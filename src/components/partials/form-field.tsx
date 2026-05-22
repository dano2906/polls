import type { AnyFieldApi } from "@tanstack/react-form-start";
import type { ClassValue } from "clsx";
import { cn } from "#/lib/utils.ts";
import { Checkbox } from "../ui/checkbox";
import { DateInput } from "../ui/date-input";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { NumberInput } from "../ui/number-input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

export enum FieldType {
	INPUT_TEXT = "input_text",
	INPUT_NUMBER = "input_number",
	TEXTAREA = "textarea",
	SIMPLE_DATE = "simple_date",
	RANGE_DATE = "range_date",
	SELECT = "select",
	CHECKBOX = "checkbox",
	RADIO = "radio",
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
	requried?: boolean;
	disabled?: boolean;
	placeholder?: string;
	options?: {
		value: string;
		label: string;
	}[];
	overrideBindings?: (field: AnyFieldApi) => OverrideBindings;
}

const RenderField = ({
	field,
	field_type,
	placeholder,
	options,
	disabled = false,
	overrideBindings,
}: Omit<Props, "label" | "input_classes">) => {
	const overrides = overrideBindings ? overrideBindings(field) : {};

	const value =
		overrides.value !== undefined ? overrides.value : field.state.value;

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
	const { field, field_type, label, input_classes, requried = false } = props;

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
						{label} {requried && <span className="text-destructive">*</span>}
					</FieldLabel>
				</div>
				{renderError}
			</Field>
		);
	}

	return (
		<Field className={cn([input_classes, "-space-y-0.5"])}>
			<FieldLabel htmlFor={field.name}>
				{label} {requried && <span className="text-destructive">*</span>}
			</FieldLabel>
			<RenderField {...props} />
			{renderError}
		</Field>
	);
};

export default FormField;

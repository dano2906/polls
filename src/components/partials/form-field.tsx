import type { AnyFieldApi } from "@tanstack/react-form-start";
import type { ClassValue } from "clsx";
import { cn } from "#/lib/utils.ts";
import { Checkbox } from "../ui/checkbox";
import { DateInput } from "../ui/date-input";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { NumberInput } from "../ui/number-input";
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
}

interface Props {
	field: AnyFieldApi;
	field_type: FieldType;
	label: string;
	input_classes?: ClassValue;
	requried?: boolean;
	disabled?: boolean;
	placeholder?: string;
	options?: {
		value: string;
		label: string;
	}[];
}

const RenderField = ({
	field,
	field_type,
	placeholder,
	options,
	disabled = false,
}: Omit<Props, "label" | "input_classes">) => {
	switch (field_type) {
		case "input_text":
			return (
				<Input
					id={field.name}
					name={field.name}
					value={field.state.value}
					onChange={(e) => field.handleChange(e.target.value)}
					placeholder={placeholder}
					disabled={disabled}
				/>
			);
		case "input_number":
			return (
				<NumberInput
					id={field.name}
					name={field.name}
					value={field.state.value}
					onChange={(e) => field.handleChange(e)}
					disabled={disabled}
				/>
			);
		case "textarea":
			return (
				<Textarea
					id={field.name}
					name={field.name}
					value={field.state.value}
					onChange={(e) => field.handleChange(e.target.value)}
					placeholder={placeholder}
					disabled={disabled}
				/>
			);
		case "simple_date":
			return (
				<DateInput
					id={field.name}
					name={field.name}
					value={field.state.value}
					onChange={(e) => field.handleChange(e)}
				/>
			);
		case "checkbox":
			return (
				<Checkbox
					checked={field.state.value}
					onCheckedChange={(e) => field.handleChange(e)}
					disabled={disabled}
				/>
			);
		case "select":
			return (
				<Select
					name={field.name}
					value={field.state.value}
					onValueChange={(e) => field.handleChange(e)}
					disabled={disabled}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder={placeholder} />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{options?.map((opt) => {
								return (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								);
							})}
						</SelectGroup>
					</SelectContent>
				</Select>
			);
		default:
			return (
				<Input
					id={field.name}
					name={field.name}
					value={field.state.value}
					onChange={(e) => field.handleChange(e.target.value)}
					placeholder={placeholder}
					disabled={disabled}
				/>
			);
	}
};

const FormField = ({
	field,
	field_type,
	label,
	input_classes,
	requried = false,
	placeholder,
	options,
	disabled,
}: Props) => {
	if (field_type === FieldType.CHECKBOX) {
		return (
			<Field className={cn([input_classes, "-space-y-0.5"])}>
				<div className="flex items-center justify-start gap-2">
					<RenderField
						field_type={field_type}
						field={field}
						placeholder={placeholder}
						options={options}
						disabled={disabled}
					/>
					<FieldLabel htmlFor={field.name}>
						{label} {requried && <span className="text-destructive">*</span>}
					</FieldLabel>
				</div>
				{!field.state.meta.isValid && (
					<em role="alert" className="text-xs text-destructive font-sg">
						{field.state.meta.errors.map((e) => e.message).join(". ")}
					</em>
				)}
			</Field>
		);
	} else {
		return (
			<Field className={cn([input_classes, "-space-y-0.5"])}>
				<FieldLabel htmlFor={field.name}>
					{label} {requried && <span className="text-destructive">*</span>}
				</FieldLabel>
				<RenderField
					field_type={field_type}
					field={field}
					placeholder={placeholder}
					options={options}
					disabled={disabled}
				/>
				{!field.state.meta.isValid && (
					<em role="alert" className="text-xs text-destructive font-sg">
						{field.state.meta.errors.map((e) => e.message).join(". ")}
					</em>
				)}
			</Field>
		);
	}
};

export default FormField;

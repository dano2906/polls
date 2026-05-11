import type { AnyFieldApi } from "@tanstack/react-form-start";
import type { ClassValue } from "clsx";
import { cn } from "#/lib/utils.ts";
import { DateInput } from "../ui/date-input";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export enum FieldType {
	INPUT_TEXT = "input_text",
	TEXTAREA = "textarea",
	SIMPLE_DATE = "simple_date",
	RANGE_DATE = "range_date",
}

interface Props {
	field: AnyFieldApi;
	field_type: FieldType;
	label: string;
	input_classes?: ClassValue;
	requried?: boolean;
	placeholder?: string;
}

const RenderField = ({
	field,
	field_type,
	placeholder,
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
		default:
			return (
				<Input
					id={field.name}
					name={field.name}
					value={field.state.value}
					onChange={(e) => field.handleChange(e.target.value)}
					placeholder={placeholder}
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
}: Props) => {
	return (
		<Field className={cn([input_classes, "-space-y-0.5"])}>
			<FieldLabel htmlFor={field.name}>
				{label} {requried && <span className="text-destructive">*</span>}
			</FieldLabel>
			<RenderField
				field_type={field_type}
				field={field}
				placeholder={placeholder}
			/>
			{!field.state.meta.isValid && (
				<em role="alert" className="text-xs text-destructive font-sg">
					{field.state.meta.errors.map((e) => e.message).join(". ")}
				</em>
			)}
		</Field>
	);
};

export default FormField;

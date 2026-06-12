import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "./input-group";

// Heredamos las propiedades nativas que acepta tu InputGroupInput para no perder tipado
interface PasswordInputProps extends ComponentProps<typeof InputGroupInput> {
	// Si tu InputGroupInput no hereda automáticamente de un input común,
	// puedes declarar las propiedades explícitamente aquí:
	// id?: string;
	// name?: string;
	// value?: any;
	// onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	// onBlur?: () => void;
	// placeholder?: string;
	// disabled?: boolean;
}

const PasswordInput = ({
	id,
	name,
	value,
	onChange,
	onBlur,
	placeholder,
	disabled,
	...props // Por si pasas clases u otros atributos extras
}: PasswordInputProps) => {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<InputGroup>
			<InputGroupInput
				{...props}
				id={id}
				name={name}
				type={showPassword ? "text" : "password"}
				value={value ?? ""}
				onChange={onChange}
				onBlur={onBlur}
				placeholder={placeholder}
				disabled={disabled}
			/>
			<InputGroupAddon align="inline-end">
				<InputGroupButton
					type="button"
					variant="secondary"
					disabled={disabled}
					onClick={() => setShowPassword((prev) => !prev)}
				>
					{showPassword ? (
						<EyeOff className="h-4 w-4 text-muted-foreground" />
					) : (
						<Eye className="h-4 w-4 text-muted-foreground" />
					)}
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
};

export default PasswordInput;

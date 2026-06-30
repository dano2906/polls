import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/common/components/ui/input-group";
import { changeUserPassword } from "../actions/user";
import { userMKs, userQKs } from "../lib/query";

const ChangePasswordInput = ({ id }: { id: string }) => {
	const [newPassword, setNewPassword] = useState("");
	const [inputType, setInputType] = useState("password");
	const qc = useQueryClient();
	const { mutate: changePassword } = useMutation({
		mutationKey: userMKs.changePass(id),
		mutationFn: async () => {
			if (!newPassword || newPassword.length === 0) return;

			const { success } = await changeUserPassword({
				data: {
					id,
					newPassword,
				},
			});
			if (success) {
				toast.success("La contraseña ha sido cambiada correctamente");
				await qc.invalidateQueries({
					queryKey: userQKs.detail(id),
				});
				setNewPassword("");
			}
		},
		onError: (error) => toast.error(error.message),
	});
	return (
		<InputGroup className="px-1 max-w-lg w-full">
			<InputGroupInput
				placeholder="Nueva contraseña..."
				value={newPassword}
				onChange={(e) => setNewPassword(e.target.value)}
				type={inputType}
			/>
			<InputGroupAddon align="inline-end" className="gap-1">
				<InputGroupButton
					aria-label="See password"
					title="See password"
					size="icon-xs"
					variant={"secondary"}
					onClick={() =>
						setInputType(inputType === "password" ? "text" : "password")
					}
				>
					{inputType === "password" ? <Eye /> : <EyeOff />}
				</InputGroupButton>
			</InputGroupAddon>
			<InputGroupAddon align="inline-end" className="gap-1">
				<InputGroupButton
					aria-label="Change password"
					title="Change password"
					size="icon-xs"
					variant={"secondary"}
					onClick={() => changePassword()}
				>
					<Check />
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
};

export default ChangePasswordInput;

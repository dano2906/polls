import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/common/components/ui/input-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/common/components/ui/select";
import { banUser } from "../actions/user";
import { userMKs, userQKs } from "../lib/query";

const BanUserInput = ({ id }: { id: string }) => {
	const qc = useQueryClient();
	const [banReason, setBanReason] = useState("");
	const [banExpiresIn, setBanExpiresIn] = useState<"1" | "7" | "15" | "31">(
		"7",
	);
	const { mutate: ban } = useMutation({
		mutationKey: userMKs.ban(id),
		mutationFn: async () => {
			if (!banReason || banReason.length === 0) {
				toast.error("Debe escribir una razón del baneo");
				return;
			}

			if (!["1", "7", "15", "31"].includes(banExpiresIn)) {
				toast.error("Debe seleccionar un tiempo de baneo");
				return;
			}

			const { success } = await banUser({
				data: {
					id,
					banReason,
					banExpiresIn: Number(banExpiresIn) as 1 | 7 | 15 | 31,
				},
			});
			if (success) {
				toast.success("Usuario baneado correctamente");
				await qc.invalidateQueries({
					queryKey: ["user"],
					exact: false,
				});
				setBanReason("");
				setBanExpiresIn("7");
			}
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: userQKs.detail(id) });
		},
		onError: (error) => toast.error(error.message),
	});
	return (
		<InputGroup className="px-1 max-w-xs w-full">
			<InputGroupInput
				placeholder="Banear por..."
				value={banReason}
				onChange={(e) => setBanReason(e.target.value)}
			/>
			<InputGroupAddon align="inline-end" className="gap-1">
				<Select value={banExpiresIn} onValueChange={setBanExpiresIn}>
					<SelectTrigger className="w-full max-w-32 p-1 text-xs" size="sm">
						<SelectValue placeholder="Tiempo de baneo" className="w-32">
							{`${banExpiresIn} días`}
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="1">1 día</SelectItem>
							<SelectItem value="7">7 días</SelectItem>
							<SelectItem value="15">15 días</SelectItem>
							<SelectItem value="31">1 mes</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<InputGroupButton
					aria-label="Ban"
					title="Ban user"
					size="icon-xs"
					variant={"secondary"}
					onClick={() => ban()}
				>
					<Check />
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
};

export default BanUserInput;

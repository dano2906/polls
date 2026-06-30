import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { unbanUser } from "../actions/user";
import { userMKs, userQKs } from "../lib/query";

const UnbanUserButton = ({
	id,
	buttonVariant = "ghostContext",
}: {
	id: string;
	buttonVariant?: "ghostDestructive" | "secondary" | "ghostContext";
}) => {
	const qc = useQueryClient();
	const { mutate: unban } = useMutation({
		mutationKey: userMKs.unban(id),
		mutationFn: () =>
			unbanUser({
				data: {
					id,
				},
			}),
		onSuccess: async (data) => {
			await qc.invalidateQueries({
				queryKey: userQKs.lists(),
			});
			await qc.invalidateQueries({
				queryKey: userQKs.detail(id),
			});
			if (!data.success) {
				toast.error("Ha ocurrido un error");
				return;
			}
			toast.success("Usuario habilitado satisfactoriamente.");
		},
	});
	return (
		<Button
			variant={buttonVariant}
			className={"w-full flex justify-start"}
			onClick={() => unban()}
		>
			Habilitar usuario
		</Button>
	);
};

export default UnbanUserButton;

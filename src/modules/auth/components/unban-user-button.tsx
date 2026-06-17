import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/common/components/ui/button";
import { cn } from "@/common/lib/utils";
import { unbanUser } from "../actions/user";

const UnbanUserButton = ({
	id,
	buttonVariant = "ghostContext",
}: {
	id: string;
	buttonVariant?: "ghostDestructive" | "secondary" | "ghostContext";
}) => {
	const qc = useQueryClient();
	const { mutate: unban } = useMutation({
		mutationKey: ["unban", "user", id],
		mutationFn: () =>
			unbanUser({
				data: {
					id,
				},
			}),
		onSuccess: async (data) => {
			await qc.invalidateQueries({
				queryKey: ["user", "list"],
				exact: false,
			});
			await qc.invalidateQueries({
				queryKey: ["user", "detail", id],
				exact: false,
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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { revokeUserSession } from "../actions/user";

const RevokeSessionsButton = ({
	id,
	mode = "single",
	buttonVariant = "ghostDestructive",
}: {
	id: string;
	mode?: "single" | "all";
	buttonVariant?: "ghostDestructive" | "secondary";
}) => {
	const qc = useQueryClient();
	const { mutate: revoke } = useMutation({
		mutationKey: ["revoke", "user", "sessions", id],
		mutationFn: () =>
			revokeUserSession({
				data: { id, mode },
			}),
		onSuccess: async (data) => {
			await qc.invalidateQueries({
				queryKey: ["user"],
				exact: false,
			});
			if (!data.success) {
				toast.error("Ha ocurrido un error");
				return;
			}
			toast.success("Su sesión ha sido cerrada satisfactoriamente.");
		},
	});
	return (
		<Button
			variant={buttonVariant}
			className={"w-full max-w-fit flex justify-start"}
			onClick={() => revoke()}
		>
			{mode === "all" ? "Cerrar todas las sesiones" : "Cerrar sesión"}
		</Button>
	);
};

export default RevokeSessionsButton;

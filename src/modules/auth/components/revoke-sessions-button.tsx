import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { revokeUserSession } from "../actions/user";
import { userMKs, userQKs } from "../lib/query";

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
		mutationKey: userMKs.revokeSessions(id),
		mutationFn: () =>
			revokeUserSession({
				data: { id, mode },
			}),
		onSuccess: async (data) => {
			await qc.invalidateQueries({
				queryKey: userQKs.sessions(id),
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

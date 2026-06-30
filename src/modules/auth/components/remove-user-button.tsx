import { useMutation, useQueryClient } from "@tanstack/react-query";
import { redirect, useRouteContext } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { removeUser } from "../actions/user";
import { userMKs, userQKs } from "../lib/query";

const RemoveUserButton = ({
	id,
	buttonVariant = "ghostDestructive",
}: {
	id: string;
	buttonVariant?:
		| "ghostDestructive"
		| "secondary"
		| "ghostContext"
		| "destructive";
}) => {
	const context = useRouteContext({
		from: "/_protected",
	});
	const qc = useQueryClient();
	const { mutate: remove } = useMutation({
		mutationKey: userMKs.remove(id),
		mutationFn: () =>
			removeUser({
				data: {
					id,
				},
			}),
		onSuccess: async (data) => {
			qc.invalidateQueries({
				queryKey: userQKs.lists(),
			});
			qc.removeQueries({
				queryKey: userQKs.detail(id),
			});
			if (!data.success) {
				toast.error("Ha ocurrido un error");
				return;
			}
			toast.success("Usuario eliminado satisfactoriamente.");
			redirect({
				to: "/user",
				search: {
					limit: 10,
					offset: 0,
					sortDirection: "desc",
				},
			});
		},
		onError: (error) => toast.error(error.message),
	});
	return (
		<Button
			disabled={context.auth?.user.id === id}
			variant={buttonVariant}
			className={"w-full flex justify-start"}
			onClick={() =>
				toast.warning("¿Está seguro que desea eliminar este usuario?", {
					action: {
						label: "Eliminar",
						onClick: () => remove(),
					},
				})
			}
		>
			Eliminar usuario
		</Button>
	);
};

export default RemoveUserButton;

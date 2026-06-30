import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { deletePollBySlug } from "@/poll/actions/poll";
import { Button } from "@/ui/button";
import { LoadingSwap } from "@/ui/loading-swap";
import { pollMKs } from "../lib/query";

interface Props {
	slug: string;
}

const DeletePollButton = ({ slug }: Props) => {
	const qc = useQueryClient();
	const deletePollMutation = useMutation({
		mutationKey: pollMKs.remove(slug),
		mutationFn: async () => {
			return await deletePollBySlug({
				data: {
					slug,
				},
			});
		},
		onSuccess: async ({ message, success }) => {
			await qc.invalidateQueries({
				queryKey: ["poll"],
			});
			if (success) {
				toast.success(message);
			}
		},
		onError: () => toast.error("Ha ocurrido un error creando la nueva versión"),
	});

	const handleConfirm = () => {
		toast.warning("Estás seguro que deseas eliminar la encuesta?", {
			action: {
				onClick: () => deletePollMutation.mutateAsync(),
				label: "Eliminar",
			},
			duration: 6000,
		});
	};

	return (
		<Button
			variant={"ghostDestructive"}
			className="w-full flex items-center justify-start px-2.5"
			onClick={handleConfirm}
		>
			<LoadingSwap
				isLoading={deletePollMutation.isPending}
				className="flex items-center gap-2 w-full"
			>
				<Trash />
				Eliminar
			</LoadingSwap>
		</Button>
	);
};

export default DeletePollButton;

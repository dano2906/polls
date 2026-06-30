import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ListTree } from "lucide-react";
import { toast } from "sonner";
import { forkPoll } from "@/poll/actions/poll";
import { Button } from "@/ui/button";
import { LoadingSwap } from "@/ui/loading-swap";
import { pollMKs } from "../lib/query";

interface Props {
	slug: string;
	version: number;
}

const ForkVersionButton = ({ slug, version }: Props) => {
	const qc = useQueryClient();
	const forkPollMutation = useMutation({
		mutationKey: pollMKs.fork(slug),
		mutationFn: async () => {
			return await forkPoll({
				data: {
					pollSlug: slug,
				},
			});
		},
		onSuccess: async () => {
			await qc.invalidateQueries({
				queryKey: ["poll"],
			});
		},
		onError: () => toast.error("Ha ocurrido un error creando la nueva versión"),
	});

	return (
		<Button
			variant={"ghostContext"}
			className="w-full flex items-center justify-start px-2.5"
			onClick={() => forkPollMutation.mutateAsync()}
		>
			<LoadingSwap
				isLoading={forkPollMutation.isPending}
				className="flex items-center gap-2 w-full"
			>
				<ListTree />
				Crear nueva versión (v
				{version + 1})
			</LoadingSwap>
		</Button>
	);
};

export default ForkVersionButton;

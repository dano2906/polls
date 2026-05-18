import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ListTree } from "lucide-react";
import { toast } from "sonner";
import { forkPoll } from "#/actions/poll";
import { Button } from "../ui/button";
import { LoadingSwap } from "../ui/loading-swap";

interface Props {
	slug: string;
	version: number;
}

const ForkVersionButton = ({ slug, version }: Props) => {
	const router = useRouter();
	const forkPollMutation = useMutation({
		mutationKey: ["fork", "poll"],
		mutationFn: async () => {
			return await forkPoll({
				data: {
					pollSlug: slug,
				},
			});
		},
		onSuccess: async () => {
			await router.invalidate();
		},
		onError: () => toast.error("Ha ocurrido un error creando la nueva versión"),
	});

	return (
		<Button
			variant={"ghostContext"}
			onClick={() => forkPollMutation.mutateAsync()}
		>
			<LoadingSwap
				isLoading={forkPollMutation.isPending}
				className="flex items-center gap-2"
			>
				<ListTree />
				Crear nueva versión (v
				{version + 1})
			</LoadingSwap>
		</Button>
	);
};

export default ForkVersionButton;

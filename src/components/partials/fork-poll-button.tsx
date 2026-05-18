import { useMutation } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { ListTree } from "lucide-react";
import { toast } from "sonner";
import { forkPoll } from "#/actions/poll";
import type { Poll } from "#/shared/types";
import { Button } from "../ui/button";
import { LoadingSwap } from "../ui/loading-swap";

interface Props {
	poll: Pick<
		Poll,
		| "name"
		| "description"
		| "slug"
		| "startDate"
		| "endDate"
		| "version"
		| "status"
	>;
}

const ForkVersionButton = ({ poll }: Props) => {
	const router = useRouter();
	const { user } = useRouteContext({ from: "/_protected" });
	const forkPollMutation = useMutation({
		mutationKey: ["fork", "poll"],
		mutationFn: async () => {
			return await forkPoll({
				data: {
					name: poll.name,
					startDate: poll.startDate,
					userId: user.id,
					description: poll.description as string,
					endDate: poll.endDate as Date,
					status: "draft",
					version: (poll.version as number) + 1,
				},
			});
		},
		onSuccess: async () => {
			await router.invalidate();
		},
		onError: () => toast.error("Ha ocurrido un error creando la nueva versión"),
	});

	return (
		<Button variant={"ghost"} onClick={() => forkPollMutation.mutateAsync()}>
			<LoadingSwap
				isLoading={forkPollMutation.isPending}
				className="flex items-center gap-2"
			>
				<ListTree />
				Crear nueva versión (v
				{(poll.version as number) + 1})
			</LoadingSwap>
		</Button>
	);
};

export default ForkVersionButton;

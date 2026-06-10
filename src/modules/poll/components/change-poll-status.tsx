import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { CircleArrowUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/common/lib/utils";
import { updatePoll } from "@/poll/actions/poll";
import { Button } from "@/ui/button";
import { LoadingSwap } from "@/ui/loading-swap";
import { POLL_STATUS_FLOW, type PollStatus } from "../shared/types";

const statusLabels: Record<PollStatus, string> = {
	draft: "Borrador",
	published: "Publicado",
	archived: "Archivado",
};

const statusStyles: Record<PollStatus, string> = {
	draft: "text-foreground",
	published: "text-success",
	archived: "text-destructive",
};

export const StatusBadge = ({
	children,
	status,
	className,
}: {
	children: React.ReactNode;
	status: PollStatus;
	className?: string;
}) => {
	return (
		<span
			className={cn(
				"text-inherit font-medium text-sm",
				statusStyles[status],
				className,
			)}
		>
			{children}
		</span>
	);
};

export const ChangePollStatus = ({
	status,
	slug,
	inMenu = false,
}: {
	status: PollStatus;
	slug: string;
	inMenu?: boolean;
}) => {
	const router = useRouter();

	const currentIndex = POLL_STATUS_FLOW.indexOf(status);
	const nextStatus = POLL_STATUS_FLOW[currentIndex + 1] as
		| PollStatus
		| undefined;

	const { mutateAsync: changeStatus, isPending } = useMutation({
		mutationKey: ["change-status", slug],
		mutationFn: async () => {
			await updatePoll({
				data: {
					slug,
					values: { status: nextStatus ?? "draft" },
				},
			});
		},
		onSuccess: async () => {
			await router.invalidate();
			toast.success(`Estado actualizado`);
		},
		onError: () => {
			toast.error("No se pudo actualizar el estado");
		},
	});

	return (
		<Button
			disabled={isPending}
			onClick={() => changeStatus()}
			variant={"secondary"}
			className={cn(
				"flex items-center  px-2.5",
				inMenu &&
					" hover:bg-muted hover:text-accent-foreground w-full max-w-xs justify-start",
			)}
		>
			<LoadingSwap isLoading={isPending} className="flex items-center gap-2">
				<CircleArrowUp className="size-4" />
				<StatusBadge status={nextStatus ?? "draft"}>
					Cambiar a {statusLabels[nextStatus ?? "draft"].toLocaleLowerCase()}
				</StatusBadge>
			</LoadingSwap>
		</Button>
	);
};

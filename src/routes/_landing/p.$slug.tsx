import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import PollCompleteForm from "#/components/partials/poll-complete-form";

export const Route = createFileRoute("/_landing/p/$slug")({
	component: RouteComponent,
	beforeLoad: async ({ context, location }) => {
		try {
			if (!context.auth?.session) {
				throw redirect({
					to: "/",
					search: location.pathname,
				});
			}
		} catch (error) {
			if (isRedirect(error)) throw error;
			throw redirect({
				to: "/",
				search: { redirect: location.href },
			});
		}
	},
});

function RouteComponent() {
	return (
		<div>
			<PollCompleteForm />
		</div>
	);
}

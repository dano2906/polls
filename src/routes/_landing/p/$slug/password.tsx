import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import PollPasswordForm from "@/poll/components/poll-password-form";

export const Route = createFileRoute("/_landing/p/$slug/password")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		try {
			if (!context.auth?.session) {
				throw redirect({
					to: "/",
				});
			}
		} catch (error) {
			if (isRedirect(error)) throw error;
			throw redirect({
				to: "/",
			});
		}
	},
});

function RouteComponent() {
	const { slug } = Route.useParams();
	return (
		<div className="w-full max-w-4xl mx-auto space-y-6 py-6 px-4">
			<div className="border-b pb-5 space-y-2">
				<h2 className="text-xl font-sg font-semibold tracking-wider text-primary uppercase">
					Introduzca la contraseña de la encuesta
				</h2>
				<p className="text-base tracking-wide font-sgc font-normal">
					Si la contraseña es correcta será redirigido y podrá comenzar la
					encuesta.
				</p>
			</div>
			<PollPasswordForm slug={slug} />
		</div>
	);
}

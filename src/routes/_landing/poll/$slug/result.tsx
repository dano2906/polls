import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ResponseRenderer } from "@/answers/components/result-response-renderer";
import { pollResultOptions } from "@/poll/lib/query";

export const Route = createFileRoute("/_landing/poll/$slug/result")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		if (!context.auth) {
			throw redirect({ to: "/" });
		}
		return { auth: context.auth };
	},
	loader: ({ context, params }) => {
		context.queryClient.ensureQueryData(
			pollResultOptions({
				slug: params.slug,
				userId: context.auth.user.id,
			}),
		);
	},
});

function RouteComponent() {
	const { slug } = Route.useParams();
	const { auth } = Route.useRouteContext();
	const { data } = useSuspenseQuery(
		pollResultOptions({
			slug,
			userId: auth.user.id,
		}),
	);
	const { poll, results } = data;

	return (
		<div className="w-full max-w-4xl mx-auto space-y-6 py-6 px-4">
			<div className="border-b pb-5 space-y-2">
				<h2 className="text-sm font-semibold tracking-wider text-primary uppercase">
					Resumen de Resultados
				</h2>
				<h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
					{poll.name}
				</h1>
				{poll.description && (
					<p className="text-base text-muted-foreground max-w-2xl">
						{poll.description}
					</p>
				)}
			</div>

			<div className="space-y-4">
				{results.map((q, index) => (
					<div
						key={q.order}
						className="bg-card text-card-foreground border rounded-xl p-5 shadow-xs transition-all"
					>
						<div className="flex items-start gap-3 mb-4">
							<span className="shrink-0 bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-md mt-0.5">
								P{index + 1}
							</span>
							<h3 className="text-lg font-semibold leading-snug text-foreground">
								{q.questionText}
							</h3>
						</div>

						<div className="pl-0 md:pl-8">
							<ResponseRenderer question={q} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

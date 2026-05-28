import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUserPollResults } from "#/actions/poll";
import { ResponseRenderer } from "#/components/partials/result-response-renderer";
import { getSession } from "#/lib/auth-functions";

export const Route = createFileRoute("/_landing/p/$slug/result")({
	component: RouteComponent,
	loader: async ({ params }) => {
		const session = await getSession();
		if (!session) {
			throw redirect({
				to: "/",
			});
		}
		return await getUserPollResults({
			data: {
				slug: params.slug,
				userId: session?.user?.id as string,
			},
		});
	},
});

function RouteComponent() {
	const { results, poll } = Route.useLoaderData();

	return (
		<div className="w-full max-w-4xl mx-auto space-y-6 py-6 px-4">
			{/* Cabecera de la Encuesta */}
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

			{/* Listado de Preguntas */}
			<div className="space-y-4">
				{results.map((q, index) => (
					<div
						key={q.id}
						className="bg-card text-card-foreground border rounded-xl p-5 shadow-xs transition-all"
					>
						{/* Enunciado de la Pregunta */}
						<div className="flex items-start gap-3 mb-4">
							<span className="shrink-0 bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-md mt-0.5">
								P{index + 1}
							</span>
							<h3 className="text-lg font-semibold leading-snug text-foreground">
								{q.questionText}
							</h3>
						</div>

						{/* Renderizado condicional según el tipo de componente */}
						<div className="pl-0 md:pl-8">
							<ResponseRenderer question={q} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

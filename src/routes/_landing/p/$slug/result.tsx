import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUserPollResults } from "#/actions/poll";
import { getSession } from "#/lib/auth-functions";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/_landing/p/$slug/result")({
	component: RouteComponent,
	loader: async ({ params }) => {
		const session = await getSession();
		if (!session) {
			redirect({
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
		<div className="w-full space-y-2">
			<h2 className="text-4xl font-sgc font-semibold text-primary tracking-wider pb-3">
				Respuestas
			</h2>
			<h6 className="text-3xl font-sg font-medium text-foreground tracking-wide">
				{poll.name}
			</h6>
			<p className="text-base font-sg font-normale text--muted-foreground tracking-wide">
				{poll.description}
			</p>
			<ul className="bg-muted p-5 space-y-2">
				{results.map((q) => {
					return (
						<li
							key={q.id}
							className="w-full font-sg flex flex-col items-start justify-start gap-2"
						>
							<span className="text-xl font-medium tracking-wide text-muted-foreground">
								P{(q.order as number) + 1}. {q.questionText}
							</span>
							<div className="ml-6 p-2">
								{q.selectedAnswers.map((a, i) => {
									return (
										<span
											key={a.answerId}
											className={cn(
												"text-base font-normal tracking-wide text-foreground",
												a.isCorrect && "text-success",
											)}
										>
											R{i + 1}. {a.answerText}
										</span>
									);
								})}
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

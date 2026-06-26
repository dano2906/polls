import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { getSession } from "@/auth/actions/auth";
import TanStackQueryDevtools from "@/common/components/partials/devtools";
import { ErrorBoundary } from "@/common/components/partials/error-boundary";
import { TooltipProvider } from "@/common/components/ui/tooltip";
import { getThemeServerFn } from "@/common/lib/theme";
import appCss from "@/common/styles/styles.css?url";
import { Toaster } from "@/ui/sonner";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Pollify",
			},
			{
				name: "description",
				content:
					"A comprehensive application to build, publish, share and complete polls.",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	beforeLoad: async () => ({
		auth: await getSession(),
		theme: await getThemeServerFn(),
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const { theme } = Route.useRouteContext();
	return (
		<html lang="en" className={theme}>
			<head>
				<HeadContent />
			</head>
			<body>
				<TooltipProvider>
					<ErrorBoundary>{children}</ErrorBoundary>
				</TooltipProvider>
				<Toaster richColors position="top-center" />
				{process.env.NODE_ENV !== "production" && (
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							formDevtoolsPlugin(),
							TanStackQueryDevtools,
						]}
					/>
				)}
				<Scripts />
			</body>
		</html>
	);
}

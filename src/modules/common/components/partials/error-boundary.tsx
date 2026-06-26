import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/ui/button";

interface ErrorFallbackProps {
	error: Error;
	resetError: () => void;
}

function DefaultFallback({ resetError }: ErrorFallbackProps) {
	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
			<div className="text-destructive text-6xl">!</div>
			<h2 className="text-2xl font-semibold">Algo salió mal</h2>
			<p className="text-muted-foreground text-center max-w-md">
				Ocurrió un error inesperado. Por favor, intenta recargar la página.
			</p>
			<Button onClick={resetError}>Reintentar</Button>
		</div>
	);
}

interface ErrorBoundaryInnerState {
	hasError: boolean;
	error: Error | null;
}

class ErrorBoundaryInner extends Component<
	{
		children: ReactNode;
		onError?: (error: Error, info: ErrorInfo) => void;
		fallback?: (props: ErrorFallbackProps) => ReactNode;
	},
	ErrorBoundaryInnerState
> {
	constructor(props: {
		children: ReactNode;
		onError?: (error: Error, info: ErrorInfo) => void;
		fallback?: (props: ErrorFallbackProps) => ReactNode;
	}) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		this.props.onError?.(error, info);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) {
				return this.props.fallback({
					error: this.state.error,
					resetError: this.handleReset,
				});
			}
			return (
				<DefaultFallback
					error={this.state.error}
					resetError={this.handleReset}
				/>
			);
		}

		return this.props.children;
	}
}

export function ErrorBoundary({
	children,
	onError,
	fallback,
}: {
	children: ReactNode;
	onError?: (error: Error, info: ErrorInfo) => void;
	fallback?: (props: ErrorFallbackProps) => ReactNode;
}) {
	return (
		<ErrorBoundaryInner onError={onError} fallback={fallback}>
			{children}
		</ErrorBoundaryInner>
	);
}

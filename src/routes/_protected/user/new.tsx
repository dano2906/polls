import { createFileRoute } from "@tanstack/react-router";
import CreateUserForm from "@/auth/components/create-user-form";

export const Route = createFileRoute("/_protected/user/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="container mx-auto py-10">
			<CreateUserForm />
		</div>
	);
}

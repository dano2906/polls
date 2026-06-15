import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import SignInForm from "@/auth/components/sign-in-form";
import SignUpForm from "@/auth/components/sign-up-form";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/common/components/ui/tabs";

export const Route = createFileRoute("/_landing/auth")({
	component: RouteComponent,
});

function RouteComponent() {
	const [tab, setTab] = useState<"sign-in" | "sign-up">("sign-in");
	return (
		<div className="w-full space-y-8 bg-background p-8 text-foreground">
			<Tabs
				defaultValue="sign-in"
				value={tab}
				onValueChange={(value) => setTab(value as "sign-in" | "sign-up")}
				className="w-full"
			>
				<TabsList className="w-full max-w-md mx-auto">
					<TabsTrigger value="sign-in">Iniciar sesión</TabsTrigger>
					<TabsTrigger value="sign-up">Registrarse</TabsTrigger>
				</TabsList>
				<TabsContent value="sign-in">
					<SignInForm setTab={setTab} />
				</TabsContent>
				<TabsContent value="sign-up">
					<SignUpForm setTab={setTab} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

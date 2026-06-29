import { useForm } from "@tanstack/react-form";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import FormField, { FieldType } from "@/common/components/partials/form-field";
import { Button } from "@/common/components/ui/button";
import { LoadingSwap } from "@/common/components/ui/loading-swap";
import { Separator } from "@/common/components/ui/separator";
import { authClient } from "../lib/auth-client";
import { signUpSchema } from "../lib/validation";
import SocialProviders from "./social-providers";

interface Props {
	setTab: Dispatch<SetStateAction<"sign-in" | "sign-up">>;
}

const SignUpForm = ({ setTab }: Props) => {
	const form = useForm({
		defaultValues: {
			email: "",
			name: "",
			password: "",
		},
		validators: {
			onSubmit: signUpSchema,
		},
		onSubmit: async ({ value }) => {
			const { email, name, password } = value;
			await authClient.signUp.email(
				{
					email,
					password,
					name,
				},
				{
					onSuccess: () => {
						toast.success("Su usuario se ha creado con éxito");
						setTab("sign-in");
					},
					onError: (ctx) => {
						toast.error(ctx.error.message);
					},
				},
			);
		},
	});
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
			}}
			className="w-full max-w-lg mx-auto space-y-5 my-4"
		>
			<form.Field name="name">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.INPUT_TEXT}
						label="Nombre del usuario"
						placeholder="John Doe"
						required
					/>
				)}
			</form.Field>
			<form.Field name="email">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.EMAIL}
						label="Correo electrónico"
						placeholder="johndoe@gmail.com"
						required
					/>
				)}
			</form.Field>
			<form.Field name="password">
				{(field) => (
					<FormField
						field={field}
						field_type={FieldType.PASSWORD}
						label="Contraseña"
						placeholder="aBCd98**"
						required
					/>
				)}
			</form.Field>
			<Button variant={"link"} onClick={() => setTab("sign-in")}>
				¿Ya tienes una cuenta?
			</Button>
			<form.Subscribe
				selector={(state) => [
					state.canSubmit,
					state.isSubmitting,
					state.errors,
				]}
			>
				{([canSubmit, isSubmitting]) => (
					<div className="w-full flex flex-col items-end justify-center gap-4 ">
						<Button
							type="submit"
							variant={"default"}
							onClick={() => form.handleSubmit()}
							disabled={!canSubmit}
						>
							<LoadingSwap
								isLoading={isSubmitting as boolean}
								className="flex items-center gap-2"
							>
								Crear cuenta
							</LoadingSwap>
						</Button>
						<Separator />
						<SocialProviders />
					</div>
				)}
			</form.Subscribe>
		</form>
	);
};

export default SignUpForm;

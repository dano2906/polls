import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Key } from "lucide-react";
import { toast } from "sonner";
import FormField, { FieldType } from "@/common/components/partials/form-field";
import { Button } from "@/common/components/ui/button";
import { LoadingSwap } from "@/common/components/ui/loading-swap";
import { validatePollPassword } from "../actions/poll";
import { pollPasswordSchema } from "../lib/validation";

const PollPasswordForm = ({ slug }: { slug: string }) => {
	const navigate = useNavigate({ from: "/poll/$slug/password" });
	const form = useForm({
		defaultValues: {
			password: "",
		},
		validators: {
			onChange: pollPasswordSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				const result = await validatePollPassword({
					data: {
						slug,
						password: value.password,
					},
				});

				if (!result.success) {
					toast.error(result.message || "Contraseña incorrecta");
					return;
				}

				toast.success("¡Contraseña correcta! Accediendo a la encuesta...");

				// CORRECCIÓN 3: Agregamos la pausa de 2 segundos para dar tiempo a ver el toast
				await new Promise((resolve) => setTimeout(resolve, 2000));

				await navigate({
					to: "/poll/$slug",
					params: { slug },
				});
			} catch {
				toast.error("Ocurrió un error inesperado. Inténtalo de nuevo.");
			}
		},
	});
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="w-full max-w-md mx-auto flex flex-col items-center justify-center gap-4"
		>
			<form.Field name="password">
				{(field) => (
					<div className="space-y-2 w-full">
						<FormField
							field={field}
							field_type={FieldType.PASSWORD}
							label="Contraseña"
							placeholder="aBCd98@*"
							required
						/>
					</div>
				)}
			</form.Field>
			<form.Subscribe
				selector={(state) => [
					state.canSubmit,
					state.isSubmitting,
					state.errors,
				]}
			>
				{([canSubmit, _isSubmitting, _errors]) => (
					<div className="w-full flex items-center justify-end gap-2 ">
						<Button type="submit" variant={"default"} disabled={!canSubmit}>
							<LoadingSwap
								isLoading={form.state.isSubmitting}
								className="flex items-center gap-2"
							>
								<Key />
								Acceder
							</LoadingSwap>
						</Button>
					</div>
				)}
			</form.Subscribe>
		</form>
	);
};

export default PollPasswordForm;

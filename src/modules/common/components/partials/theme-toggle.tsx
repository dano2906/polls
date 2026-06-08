import { useRouteContext, useRouter } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import { setThemeServerFn } from "#/modules/common/lib/theme";
import { Button } from "@/ui/button";

const ThemeToggle = () => {
	const { theme } = useRouteContext({ from: "__root__" });
	const router = useRouter();
	async function toggleTheme() {
		const themes = ["light", "dark"] as const;
		const next = themes[(themes.indexOf(theme) + 1) % themes.length];
		await setThemeServerFn({ data: next });
		router.invalidate();
	}
	return (
		<Button
			aria-label="Toggle theme"
			onClick={toggleTheme}
			variant={"secondary"}
			className="w-full flex items-center justify-start gap-2 p-0"
		>
			{theme === "dark" ? <Sun /> : theme === "light" ? <Moon /> : <Monitor />}
			{theme === "dark"
				? "Tema claro"
				: theme === "light"
					? "Tema oscuro"
					: "Tema predeterminado"}
		</Button>
	);
};

export default ThemeToggle;

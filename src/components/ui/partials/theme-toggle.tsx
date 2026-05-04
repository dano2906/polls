import { useRouteContext, useRouter } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import { setThemeServerFn } from "#/lib/theme.ts";
import { Button } from "../button";

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
		<Button aria-label="Toggle theme" onClick={toggleTheme}>
			{theme === "dark" ? <Moon /> : theme === "light" ? <Sun /> : <Monitor />}
		</Button>
	);
};

export default ThemeToggle;

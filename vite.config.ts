import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		...(process.env.NODE_ENV !== "production" ? [devtools()] : []),
		nitro({ rollupConfig: { external: [/^@sentry\//] }, preset: "vercel" }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
	],
	server: {
		proxy: {
			"/carto-api": {
				target: "https://tiles-c.basemaps.cartocdn.com",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/carto-api/, ""),
			},
		},
	},
});

export default config;

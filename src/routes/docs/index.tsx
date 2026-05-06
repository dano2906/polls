import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from "swagger-ui-dist";

export const Route = createFileRoute("/docs/")({
	component: SwaggerDocs,
});

function SwaggerDocs() {
	useEffect(() => {
		const ui = SwaggerUIBundle({
			url: "/api/openapi",
			dom_id: "#swagger-ui",
			presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
			layout: "BaseLayout",
		});
	}, []);

	return (
		<div className="swagger-wrapper">
			{/* Cargar Assets de Swagger UI */}
			<link
				rel="stylesheet"
				href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
			/>
			<script
				src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
				crossOrigin="anonymous"
			></script>
			<script
				src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"
				crossOrigin="anonymous"
			></script>

			{/* Contenedor donde se renderizará la UI */}
			<div id="swagger-ui"></div>

			<style>{`
        body {
          margin: 0;
          background: #fafafa;
        }
        .swagger-wrapper {
          font-family: sans-serif;
        }
      `}</style>
		</div>
	);
}

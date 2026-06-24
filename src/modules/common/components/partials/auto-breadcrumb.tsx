import { Link, useMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/common/components/ui/breadcrumb";

interface BreadcrumbSegment {
	label: string;
	to: string;
	params: Record<string, string>;
	isCurrent: boolean;
}

const routeConfigs: Record<
	string,
	{ label: string; parentKey: string | null }
> = {
	"/dashboard": { label: "Dashboard", parentKey: "/" },
	"/user": { label: "Usuarios", parentKey: "/dashboard" },
	"/user/me": { label: "Mi perfil", parentKey: "/user" },
	"/user/new": { label: "Nuevo usuario", parentKey: "/user" },
	"/user/$id": { label: "Detalles de usuario", parentKey: "/user" },
	"/user/update/$id": { label: "Editar usuario", parentKey: "/user/$id" },
	"/poll/new": { label: "Nueva encuesta", parentKey: "/dashboard" },
	"/poll/update/$slug": { label: "Editar encuesta", parentKey: "/dashboard" },
	"/poll/import": { label: "Importar encuesta", parentKey: "/dashboard" },
	"/org": { label: "Organizaciones", parentKey: "/dashboard" },
	"/org/new": { label: "Nueva organización", parentKey: "/org" },
	"/org/$orgSlug": { label: "Organización", parentKey: "/org" },
	"/org/$orgSlug/members": { label: "Miembros", parentKey: "/org/$orgSlug" },
	"/org/$orgSlug/invite": { label: "Invitar", parentKey: "/org/$orgSlug" },
	"/org/$orgSlug/polls/new": {
		label: "Nueva encuesta",
		parentKey: "/org/$orgSlug",
	},
	"/auth": { label: "Acceder", parentKey: null },
	"/p/$slug": { label: "Encuesta", parentKey: null },
	"/p/$slug/result": { label: "Resultados", parentKey: null },
	"/p/$slug/password": { label: "Contraseña", parentKey: null },
};

const hiddenRouteIds = new Set(["/_protected/dashboard"]);

export function AutoBreadcrumb() {
	const [isMounted, setIsMounted] = useState(false);
	const matches = useMatches();

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Renderizamos un contenedor vacío consistente en el servidor y primer render del cliente
	if (!isMounted) {
		return <div className="mb-4 min-h-[24px]" />;
	}

	const leafMatch = matches[matches.length - 1];
	if (!leafMatch || hiddenRouteIds.has(leafMatch.routeId)) return null;

	const rawId = leafMatch.routeId
		.replace(/^\/_protected/, "")
		.replace(/^\/_landing/, "")
		.replace(/\/$/, "");
	const currentKey = rawId || "/";
	const leafParams = leafMatch.params ?? {};

	const segments: BreadcrumbSegment[] = [];
	let cursor: string | null = currentKey;

	while (cursor) {
		const config = routeConfigs[cursor];
		if (!config) break;

		segments.unshift({
			label: config.label,
			to: cursor,
			params: { ...leafParams },
			isCurrent: cursor === currentKey,
		});

		cursor = config.parentKey;
	}

	if (segments.length === 0) return null;

	return (
		<Breadcrumb className="mb-4">
			<BreadcrumbList>
				{segments.map((seg, i) => {
					const isLast = i === segments.length - 1;

					return (
						<span key={seg.to} className="contents">
							{seg.isCurrent ? (
								<BreadcrumbItem>
									<BreadcrumbPage>{seg.label}</BreadcrumbPage>
								</BreadcrumbItem>
							) : (
								<BreadcrumbItem>
									{/* Agregamos asChild aquí para que herede el componente Link */}
									<BreadcrumbLink asChild>
										<Link
											to={seg.to}
											params={seg.params}
											className="hover:text-foreground transition-colors"
										>
											{seg.label}
										</Link>
									</BreadcrumbLink>
								</BreadcrumbItem>
							)}
							{!isLast && <BreadcrumbSeparator />}
						</span>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/common/lib/utils";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
	Map as MapComponent,
	MapControls,
	MapMarker,
	MarkerContent,
} from "@/ui/map";

interface MapFieldProps {
	value?: { lat: number; lng: number };
	onChange: (value: { lat: number; lng: number }) => void;
	error?: string | null;
}

export function MapField({ value, onChange, error }: MapFieldProps) {
	const HABANA_COORDS = { lat: 23.1136, lng: -82.3666 };
	const currentCoords = value || HABANA_COORDS;

	// 1. Un contador para forzar el re-centrado del mapa SOLO cuando sea necesario
	const [mapKey, setMapKey] = useState(0);

	// Estados de texto locales para que los inputs no se traben al escribir signos o puntos
	const [latInput, setLatInput] = useState(currentCoords.lat.toString());
	const [lngInput, setLngInput] = useState(currentCoords.lng.toString());

	// Sincronizar los inputs de texto cuando el mapa se arrastra (sin alterar el mapKey)
	useEffect(() => {
		if (parseFloat(latInput) !== currentCoords.lat)
			setLatInput(currentCoords.lat.toString());
		if (parseFloat(lngInput) !== currentCoords.lng)
			setLngInput(currentCoords.lng.toString());
	}, [currentCoords.lat, currentCoords.lng]);

	// Geolocalización inicial
	useEffect(() => {
		if (!value) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
					setMapKey((prev) => prev + 1); // Forzar que el mapa viaje a la ubicación del usuario
				},
				() => undefined,
				{ timeout: 5000 },
			);
		}
	}, []);

	const handleInputChange = (field: "lat" | "lng", val: string) => {
		if (field === "lat") setLatInput(val);
		if (field === "lng") setLngInput(val);

		const num = parseFloat(val);
		if (!Number.isNaN(num)) {
			if (field === "lat" && num >= -90 && num <= 90) {
				onChange({ ...currentCoords, lat: num });
				setMapKey((prev) => prev + 1); // ↑ Al escribir un número válido, movemos el mapa
			}
			if (field === "lng" && num >= -180 && num <= 180) {
				onChange({ ...currentCoords, lng: num });
				setMapKey((prev) => prev + 1); // ↑ Al escribir un número válido, movemos el mapa
			}
		}
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label className={cn(error && "text-destructive")}>Latitud</Label>
					<Input
						type="text"
						inputMode="decimal"
						value={latInput}
						onChange={(e) => handleInputChange("lat", e.target.value)}
						className={cn(
							error && "border-destructive focus-visible:ring-destructive",
						)}
					/>
				</div>
				<div className="space-y-2">
					<Label className={cn(error && "text-destructive")}>Longitud</Label>
					<Input
						type="text"
						inputMode="decimal"
						value={lngInput}
						onChange={(e) => handleInputChange("lng", e.target.value)}
						className={cn(
							error && "border-destructive focus-visible:ring-destructive",
						)}
					/>
				</div>
			</div>

			<div
				className={cn(
					"h-[420px] w-full rounded-md border overflow-hidden relative",
					error && "border-destructive",
				)}
			>
				{/* 
                  El key ahora depende de un ID incremental estático. No cambiará jamás mientras arrastres, 
                  por lo que el marcador se moverá suavemente a 60fps sin destruir el mapa.
                */}
				<MapComponent
					key={mapKey}
					center={[currentCoords.lng, currentCoords.lat]}
					zoom={12}
				>
					<MapMarker
						draggable
						longitude={currentCoords.lng}
						latitude={currentCoords.lat}
						// Al arrastrar, solo mutamos las coordenadas del formulario, el mapa permanece vivo
						onDrag={(lngLat) => onChange({ lat: lngLat.lat, lng: lngLat.lng })}
					>
						<MarkerContent>
							<MapPin
								className={cn(
									"stroke-white size-[28px]",
									error ? "fill-destructive" : "fill-primary",
								)}
							/>
						</MarkerContent>
					</MapMarker>
					<MapControls
						position="top-left"
						showZoom
						showCompass
						showLocate
						showFullscreen
					/>
				</MapComponent>
			</div>

			{error && (
				<em
					role="alert"
					className="text-xs text-destructive font-sg mt-1 block"
				>
					{error}
				</em>
			)}
		</div>
	);
}

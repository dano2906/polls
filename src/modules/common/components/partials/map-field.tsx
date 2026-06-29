import { MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/common/lib/utils";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import type {
	MapControls as MapControlsType,
	MapMarker as MapMarkerType,
	Map as MapType,
	MarkerContent as MarkerContentType,
} from "@/ui/map";

interface MapFieldProps {
	value?: { lat: number; lng: number };
	onChange: (value: { lat: number; lng: number }) => void;
	error?: string | null;
}

type MapModule = {
	Map: typeof MapType;
	MapControls: typeof MapControlsType;
	MapMarker: typeof MapMarkerType;
	MarkerContent: typeof MarkerContentType;
};

export function MapField({ value, onChange, error }: MapFieldProps) {
	const HABANA_COORDS = { lat: 23.1136, lng: -82.3666 };
	const currentCoords = value || HABANA_COORDS;

	const [mapKey, setMapKey] = useState(0);
	const [mapMod, setMapMod] = useState<MapModule | null>(null);
	const geolocCalledRef = useRef(false);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	const [latInput, setLatInput] = useState(currentCoords.lat.toString());
	const [lngInput, setLngInput] = useState(currentCoords.lng.toString());

	useEffect(() => {
		if (parseFloat(latInput) !== currentCoords.lat)
			setLatInput(currentCoords.lat.toString());
		if (parseFloat(lngInput) !== currentCoords.lng)
			setLngInput(currentCoords.lng.toString());
	}, [currentCoords.lat, currentCoords.lng, latInput, lngInput]);

	useEffect(() => {
		import("@/ui/map").then((mod) => setMapMod(mod));
	}, []);

	useEffect(() => {
		if (!value && !geolocCalledRef.current) {
			geolocCalledRef.current = true;
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					onChangeRef.current({
						lat: pos.coords.latitude,
						lng: pos.coords.longitude,
					});
					setMapKey((prev) => prev + 1);
				},
				() => undefined,
				{ timeout: 5000 },
			);
		}
	}, [value]);

	const handleInputChange = useCallback(
		(field: "lat" | "lng", val: string) => {
			if (field === "lat") setLatInput(val);
			if (field === "lng") setLngInput(val);

			const num = parseFloat(val);
			if (!Number.isNaN(num)) {
				if (field === "lat" && num >= -90 && num <= 90) {
					onChangeRef.current({ ...currentCoords, lat: num });
					setMapKey((prev) => prev + 1);
				}
				if (field === "lng" && num >= -180 && num <= 180) {
					onChangeRef.current({ ...currentCoords, lng: num });
					setMapKey((prev) => prev + 1);
				}
			}
		},
		[currentCoords.lat, currentCoords.lng, currentCoords],
	);

	const MapComp = mapMod?.Map;
	const ControlsComp = mapMod?.MapControls;
	const MarkerComp = mapMod?.MapMarker;
	const ContentComp = mapMod?.MarkerContent;

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
				{MapComp && ControlsComp && MarkerComp && ContentComp ? (
					<MapComp
						key={mapKey}
						center={[currentCoords.lng, currentCoords.lat]}
						zoom={12}
					>
						<MarkerComp
							draggable
							longitude={currentCoords.lng}
							latitude={currentCoords.lat}
							onDrag={(lngLat) =>
								onChange({ lat: lngLat.lat, lng: lngLat.lng })
							}
						>
							<ContentComp>
								<MapPin
									className={cn(
										"stroke-white size-[28px]",
										error ? "fill-destructive" : "fill-primary",
									)}
								/>
							</ContentComp>
						</MarkerComp>
						<ControlsComp
							position="top-left"
							showZoom
							showCompass
							showLocate
							showFullscreen
						/>
					</MapComp>
				) : (
					<div className="flex h-full items-center justify-center bg-muted animate-pulse text-muted-foreground text-sm">
						Cargando mapa…
					</div>
				)}
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

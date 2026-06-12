import { useEffect, useState } from "react";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/common/components/ui/select";

const TIME_PRESETS = [
	{ label: "Sin límite de tiempo", value: "none" },
	{ label: "5 Minutos", value: "5m", amount: 5, unit: "m" },
	{ label: "15 Minutos", value: "15m", amount: 15, unit: "m" },
	{ label: "30 Minutos", value: "30m", amount: 30, unit: "m" },
	{ label: "1 Hora", value: "1h", amount: 1, unit: "h" },
	{ label: "2 Horas", value: "2h", amount: 2, unit: "h" },
	{ label: "Personalizado...", value: "custom" },
];

interface TimeLimitPickerProps {
	value: number | undefined;
	onChange: (seconds: number | undefined) => void;
}

export function TimeLimitPicker({ value, onChange }: TimeLimitPickerProps) {
	const [preset, setPreset] = useState<string>("none");
	const [amount, setAmount] = useState<number>(0);
	const [unit, setUnit] = useState<"m" | "h">("m");

	useEffect(() => {
		if (value === null || value === undefined || value <= 0) {
			if (preset !== "custom") {
				setPreset("none");
				setAmount(0);
			}
			return;
		}

		const currentLocalSeconds = amount * (unit === "h" ? 3600 : 60);
		if (
			value === currentLocalSeconds &&
			(preset === "custom" || TIME_PRESETS.some((p) => p.value === preset))
		) {
			return;
		}

		const matchingPreset = TIME_PRESETS.find((p) => {
			if (p.value === "none" || p.value === "custom") return false;
			const presetSeconds =
				p.unit === "m" ? (p.amount ?? 0) * 60 : (p.amount ?? 0) * 3600;
			return presetSeconds === Number(value);
		});

		if (matchingPreset) {
			setPreset(matchingPreset.value);
			setAmount(matchingPreset.amount ?? 0);
			setUnit((matchingPreset.unit as "m" | "h") ?? "m");
		} else {
			setPreset("custom");
			const isHours = value % 3600 === 0;
			setUnit(isHours ? "h" : "m");
			setAmount(isHours ? value / 3600 : Math.floor(value / 60));
		}
	}, [value, amount, preset, unit]);

	const checkAndSyncPreset = (newAmount: number, newUnit: "m" | "h") => {
		const multiplier = newUnit === "h" ? 3600 : 60;
		const totalSeconds = newAmount * multiplier;

		const matchingPreset = TIME_PRESETS.find((p) => {
			if (p.value === "none" || p.value === "custom") return false;
			const presetSeconds =
				p.unit === "m" ? (p.amount ?? 0) * 60 : (p.amount ?? 0) * 3600;
			return presetSeconds === totalSeconds;
		});

		if (matchingPreset) {
			setPreset(matchingPreset.value);
		} else {
			setPreset("custom");
		}

		onChange(totalSeconds > 0 ? totalSeconds : undefined);
	};

	const handlePresetChange = (presetValue: string) => {
		setPreset(presetValue);

		if (presetValue === "none") {
			onChange(undefined);
		} else if (presetValue === "custom") {
			const currentAmount = amount > 0 ? amount : 10;
			if (amount === 0) setAmount(10);
			const multiplier = unit === "h" ? 3600 : 60;
			onChange(currentAmount * multiplier);
		} else {
			const selected = TIME_PRESETS.find((p) => p.value === presetValue);
			if (selected?.amount && selected.unit) {
				setAmount(selected.amount);
				setUnit(selected.unit as "m" | "h");
				const multiplier = selected.unit === "h" ? 3600 : 60;
				onChange(selected.amount * multiplier);
			}
		}
	};

	const handleAmountChange = (numAmount: number) => {
		const safeAmount = Math.max(0, numAmount);
		setAmount(safeAmount);
		checkAndSyncPreset(safeAmount, unit);
	};

	const handleUnitChange = (newUnit: "m" | "h") => {
		setUnit(newUnit);
		checkAndSyncPreset(amount, newUnit);
	};

	return (
		// Contenedor principal puramente vertical (flex-col) en cualquier tamaño de pantalla
		<div className="w-full flex flex-col gap-1">
			{/* Selector de Presets Principal */}
			<div className="w-full space-y-1">
				<Label htmlFor="time-preset" className="text-sm font-medium">
					Límite de tiempo para el test
				</Label>
				<Select value={preset} onValueChange={handlePresetChange}>
					<SelectTrigger id="time-preset" className="w-full">
						<SelectValue placeholder="Selecciona una duración" />
					</SelectTrigger>
					<SelectContent>
						{TIME_PRESETS.map((p) => (
							<SelectItem key={p.value} value={p.value}>
								{p.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Controles de personalización (Aparecen abajo) */}
			{preset !== "none" && (
				<div className="w-full flex flex-row gap-2 animate-in fade-in-50 slide-in-from-top-2 duration-200">
					{/* Input numérico */}
					<div className="flex-1 space-y-1">
						<Label
							htmlFor="time-amount"
							className="text-xs text-muted-foreground"
						>
							Duración
						</Label>
						<Input
							id="time-amount"
							type="number"
							min="1"
							value={amount || ""}
							onChange={(e) =>
								handleAmountChange(parseInt(e.target.value, 10) || 0)
							}
							placeholder="Ej. 15"
							className="w-full"
						/>
					</div>

					{/* Selector de Unidad */}
					<div className="flex-1 space-y-1 flex flex-col">
						<Label
							htmlFor="time-unit"
							className="text-xs text-muted-foreground"
						>
							Unidad
						</Label>
						<Select value={unit} onValueChange={handleUnitChange}>
							<SelectTrigger id="time-unit" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="m">Minutos</SelectItem>
								<SelectItem value="h">Horas</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}
		</div>
	);
}

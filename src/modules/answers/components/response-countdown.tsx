import { useEffect, useState } from "react";
import { Badge } from "@/common/components/ui/badge";

interface CountdownProps {
	startedAt: Date;
	timeLimitInSeconds: number;
	onTimeUp: () => void | Promise<void>;
}

export function ResponseCountdown({
	startedAt,
	timeLimitInSeconds,
	onTimeUp,
}: CountdownProps) {
	const [timeLeft, setTimeLeft] = useState(0);

	useEffect(() => {
		const calculateTimeLeft = () => {
			const startTime = new Date(startedAt).getTime();
			const endTime = startTime + timeLimitInSeconds * 1000;
			const now = Date.now();
			const difference = Math.max(0, Math.floor((endTime - now) / 1000));

			return difference;
		};

		// Inicializar
		setTimeLeft(calculateTimeLeft());

		const timer = setInterval(() => {
			const remaining = calculateTimeLeft();
			setTimeLeft(remaining);

			if (remaining <= 0) {
				clearInterval(timer);
				onTimeUp();
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [startedAt, timeLimitInSeconds, onTimeUp]);

	// --- NUEVA LÓGICA DE TIEMPO ---
	// 1 hora = 3600 segundos
	const hours = Math.floor(timeLeft / 3600);
	// El residuo de las horas (% 3600) se divide entre 60 para sacar los minutos reales restantes
	const minutes = Math.floor((timeLeft % 3600) / 60);
	const seconds = timeLeft % 60;

	return (
		<Badge className="text-2xl font-sgc font-semibold tracking-wide absolute top-0 right-0">
			{hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:
			{seconds.toString().padStart(2, "0")}
		</Badge>
	);
}

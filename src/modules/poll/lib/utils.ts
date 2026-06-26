import { randomUUID } from "node:crypto";

export const generateRandomCode = (): string => {
	return randomUUID().substring(0, 6).toLowerCase();
};

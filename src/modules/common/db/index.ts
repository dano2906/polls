import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import * as schemas from "./schema";

// config({ path: [".env.local", ".env", ".env.production"] });
/* PRODUCTION */ config({ path: [".env.production"] });

if (!process.env.TURSO_CONNECTION_URL) {
	throw new Error(
		"TURSO_CONNECTION_URL no está definida en las variables de entorno",
	);
}

if (!process.env.TURSO_AUTH_TOKEN && process.env.NODE_ENV === "production") {
	throw new Error(
		"TURSO_AUTH_TOKEN no está definida en las variables de entorno",
	);
}

export const db = drizzle({
	connection: {
		url: process.env.TURSO_CONNECTION_URL,
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
	schema: {
		...schemas,
	},
});

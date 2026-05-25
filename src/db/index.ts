import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import * as schemas from "./schema";

config({ path: [".env.local", ".env", ".env.production"] });

if (!process.env.TURSO_CONNECTION_URL) {
	throw new Error("DATABASE_URL no está definida en las variables de entorno");
}

export const db = drizzle({
	connection: {
		url: process.env.TURSO_CONNECTION_URL as string,
		authToken: process.env.TURSO_AUTH_TOKEN as string,
	},
	schema: {
		...schemas,
	},
});

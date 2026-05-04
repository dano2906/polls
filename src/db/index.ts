import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";

config({ path: [".env.local", ".env"] }); // or .env.local

export const db = drizzle({
	connection: {
		url: process.env.TURSO_CONNECTION_URL as string,
		authToken: process.env.TURSO_AUTH_TOKEN as string,
	},
});

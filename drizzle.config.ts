import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
config({ path: ['.env.local', '.env', '.env.production'] });
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL! || "file:local.db",
  },
});
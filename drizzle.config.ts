import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// config({ path: [".env.local", ".env", ".env.production"] });
/* PRODUCTION */ config({ path: [".env.production"] });

export default defineConfig({
  schema: './src/modules/common/db/schema.ts',
  out: './src/modules/common/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL! || 'file:local.db',
    //authToken: process.env.TURSO_AUTH_TOKEN, 
  },
});
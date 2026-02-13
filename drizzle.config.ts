import 'dotenv/config'
import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config() // loads .env
dotenv.config({ path: '.env.local', override: true }) // loads .env.local with priority

export default defineConfig({
  out: './src/market-data/migrations',
  schema: './src/market-data/schema.ts',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
})

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './src/market-data/migrations',
  schema: './src/market-data/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./local.db',
  },
})

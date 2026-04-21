import type { Client } from '@libsql/client'
import { createDb, createDbClient } from './shared.js'

let clientInstance: Client | null = null
let dbInstance: ReturnType<typeof createDb> | null = null

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL or TURSO_DATABASE_URL is not set')
  }

  return databaseUrl
}

export function getScriptDbClient() {
  if (clientInstance) {
    return clientInstance
  }

  clientInstance = createDbClient(
    getDatabaseUrl(),
    process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  )

  return clientInstance
}

export function getScriptDb() {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = createDb(getScriptDbClient())
  return dbInstance
}

import { env } from '$env/dynamic/private'
import type { Client } from '@libsql/client'
import { createDb, createDbClient } from './shared.js'

let clientInstance: Client | null = null
let dbInstance: ReturnType<typeof createDb> | null = null

function getDatabaseUrl() {
  const databaseUrl = env.DATABASE_URL || env.TURSO_DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL or TURSO_DATABASE_URL is not set')
  }

  return databaseUrl
}

export function getDbClient() {
  if (clientInstance) {
    return clientInstance
  }

  clientInstance = createDbClient(
    getDatabaseUrl(),
    env.DATABASE_AUTH_TOKEN || env.TURSO_AUTH_TOKEN,
  )

  return clientInstance
}

export function getDb() {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = createDb(getDbClient())
  return dbInstance
}

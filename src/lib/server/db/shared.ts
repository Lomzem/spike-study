import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema.js'

export function createDbClient(databaseUrl: string, authToken?: string) {
  return createClient({
    url: databaseUrl,
    authToken,
  })
}

export function createDb(client: Client) {
  return drizzle(client, { schema })
}

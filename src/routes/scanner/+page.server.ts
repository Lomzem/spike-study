import { and, asc, count, desc } from 'drizzle-orm'
import { dev } from '$app/environment'
import type { PageServerLoad } from './$types'
import { getDb } from '$lib/server/db/client.js'
import { dailyStocksTable } from '$lib/server/db/schema.js'
import { PAGE_SIZE_OPTIONS } from './scanner-types'
import type { ScannerPageData } from './scanner-types'
import { parseScannerQuery } from './scanner-query'
import { buildScannerConditions } from './scanner-query.server'
import { SORT_COLUMN_MAP } from './scanner-columns.server'

const GENERIC_DB_ERROR = 'Database is unavailable right now.'

export const load: PageServerLoad = async ({ url }) => {
  const queryState = parseScannerQuery(url)
  const shared: ScannerPageData = {
    filters: queryState.filters,
    rows: [],
    totalCount: 0,
    page: 1,
    pageSize: queryState.pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    totalPages: 1,
    sortBy: queryState.sortBy,
    sortDir: queryState.sortDir,
    hasScanned: queryState.hasScanned,
    dbError: undefined,
  }

  let db: ReturnType<typeof getDb>

  try {
    db = getDb()
  } catch (error) {
    console.error('Failed to initialize scanner database', error)

    return {
      ...shared,
      dbError: dev && error instanceof Error ? error.message : GENERIC_DB_ERROR,
    }
  }

  if (!queryState.hasScanned) {
    return shared
  }

  const whereClause = and(...buildScannerConditions(queryState.filters))

  try {
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(dailyStocksTable)
      .where(whereClause)

    if (totalCount === 0) {
      return {
        ...shared,
        totalCount,
      } satisfies ScannerPageData
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / queryState.pageSize))
    const page = Math.min(queryState.page, totalPages)
    const offset = (page - 1) * queryState.pageSize
    const orderBy = queryState.sortBy
      ? [
          queryState.sortDir === 'desc'
            ? desc(SORT_COLUMN_MAP[queryState.sortBy])
            : asc(SORT_COLUMN_MAP[queryState.sortBy]),
          ...(queryState.sortBy === 'date' ? [] : [desc(SORT_COLUMN_MAP.date)]),
          ...(queryState.sortBy === 'symbol'
            ? []
            : [asc(SORT_COLUMN_MAP.symbol)]),
        ]
      : [desc(SORT_COLUMN_MAP.date), asc(SORT_COLUMN_MAP.symbol)]

    const rows = await db
      .select({
        symbol: dailyStocksTable.symbol,
        date: dailyStocksTable.date,
        open: dailyStocksTable.open,
        close: dailyStocksTable.close,
        volume: dailyStocksTable.volume,
        gap: dailyStocksTable.gap,
        change: dailyStocksTable.change,
      })
      .from(dailyStocksTable)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(queryState.pageSize)
      .offset(offset)

    return {
      ...shared,
      rows,
      totalCount,
      page,
      totalPages,
    } satisfies ScannerPageData
  } catch (error) {
    console.error('Failed to load scanner results', error)

    return {
      ...shared,
      dbError: dev && error instanceof Error ? error.message : GENERIC_DB_ERROR,
    } satisfies ScannerPageData
  }
}

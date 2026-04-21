import { and, asc, count, desc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { getDb } from '$lib/server/db/client.js'
import { dailyStocksTable } from '$lib/server/db/schema.js'
import { PAGE_SIZE_OPTIONS } from './scanner-types'
import type { ScannerPageData } from './scanner-types'
import { buildScannerConditions, parseScannerQuery } from './scanner-query'
import { SORT_COLUMN_MAP } from './scanner-columns.server'

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

  if (!queryState.hasScanned) {
    return shared
  }

  let db: ReturnType<typeof getDb>

  try {
    db = getDb()
  } catch (error) {
    return {
      ...shared,
      dbError:
        error instanceof Error
          ? error.message
          : 'Database configuration is missing.',
    }
  }

  const whereClause = and(...buildScannerConditions(queryState.filters))
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(dailyStocksTable)
    .where(whereClause)

  const totalPages = Math.max(1, Math.ceil(totalCount / queryState.pageSize))
  const page = Math.min(queryState.page, totalPages)
  const offset = (page - 1) * queryState.pageSize

  const rows = queryState.sortBy
    ? await db
        .select()
        .from(dailyStocksTable)
        .where(whereClause)
        .orderBy(
          queryState.sortDir === 'desc'
            ? desc(SORT_COLUMN_MAP[queryState.sortBy])
            : asc(SORT_COLUMN_MAP[queryState.sortBy]),
          ...(queryState.sortBy === 'date' ? [] : [desc(SORT_COLUMN_MAP.date)]),
          ...(queryState.sortBy === 'symbol'
            ? []
            : [asc(SORT_COLUMN_MAP.symbol)]),
        )
        .limit(queryState.pageSize)
        .offset(offset)
    : await db
        .select()
        .from(dailyStocksTable)
        .where(whereClause)
        .orderBy(desc(SORT_COLUMN_MAP.date), asc(SORT_COLUMN_MAP.symbol))
        .limit(queryState.pageSize)
        .offset(offset)

  return {
    ...shared,
    rows,
    totalCount,
    page,
    totalPages,
  } satisfies ScannerPageData
}

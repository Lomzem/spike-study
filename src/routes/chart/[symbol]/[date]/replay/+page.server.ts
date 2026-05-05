import { redirect } from '@sveltejs/kit'
import { and, asc, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { getDb } from '$lib/server/db/client.js'
import { intradayStocksTable } from '$lib/server/db/schema.js'
import { toChartCandles } from '../chart-loader'
import type { ReplayPageData } from './replay-types'

function buildReplayDateHref(symbol: string, date: string) {
  return `/chart/${encodeURIComponent(symbol)}/${encodeURIComponent(date)}/replay`
}

function logReplayLoadError(context: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`[replay] ${context}`, error, error.stack)
    return
  }

  console.error(`[replay] ${context}`, error)
}

export const load: PageServerLoad = async ({ params, url }) => {
  const symbol = params.symbol.trim().toUpperCase()
  const routeDate = params.date
  const selectedDate = url.searchParams.get('selectedDate')?.trim()
  const hasValidSelectedDate =
    selectedDate != null && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)

  if (hasValidSelectedDate && selectedDate !== routeDate) {
    throw redirect(307, buildReplayDateHref(symbol, selectedDate))
  }

  let db: ReturnType<typeof getDb>

  try {
    db = getDb()
  } catch (error) {
    logReplayLoadError('failed to initialize database client', error)

    return {
      symbol,
      date: routeDate,
      availableDates: [],
      candles: [],
      dbError: 'A database error occurred.',
    } satisfies ReplayPageData
  }

  try {
    const [availableDateRows, intradayRows] = await Promise.all([
      db
        .selectDistinct({ date: intradayStocksTable.date })
        .from(intradayStocksTable)
        .where(eq(intradayStocksTable.symbol, symbol))
        .orderBy(asc(intradayStocksTable.date)),
      db
        .select()
        .from(intradayStocksTable)
        .where(
          and(
            eq(intradayStocksTable.symbol, symbol),
            eq(intradayStocksTable.date, routeDate),
          ),
        )
        .orderBy(asc(intradayStocksTable.time)),
    ])

    return {
      symbol,
      date: routeDate,
      availableDates: availableDateRows.map((row) => row.date),
      candles: toChartCandles(intradayRows),
      dbError: undefined,
    } satisfies ReplayPageData
  } catch (error) {
    logReplayLoadError('failed to load replay data', error)

    return {
      symbol,
      date: routeDate,
      availableDates: [],
      candles: [],
      dbError: 'A database error occurred.',
    } satisfies ReplayPageData
  }
}

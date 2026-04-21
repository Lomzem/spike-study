import { redirect } from '@sveltejs/kit'
import { and, asc, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { getDb } from '$lib/server/db/client.js'
import { intradayStocksTable } from '$lib/server/db/schema.js'
import { toChartCandles } from './chart-loader'
import type { ChartPageData } from './chart-types'

export const load: PageServerLoad = async ({ params, url }) => {
  const symbol = params.symbol.trim().toUpperCase()
  const routeDate = params.date
  const selectedDate = url.searchParams.get('selectedDate')?.trim()

  if (selectedDate && selectedDate !== routeDate) {
    throw redirect(307, `/chart/${encodeURIComponent(symbol)}/${selectedDate}`)
  }

  let db: ReturnType<typeof getDb>

  try {
    db = getDb()
  } catch (error) {
    return {
      symbol,
      date: routeDate,
      availableDates: [],
      candles: [],
      dbError:
        error instanceof Error
          ? error.message
          : 'Database configuration is missing.',
    } satisfies ChartPageData
  }

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

  const availableDates = availableDateRows.map((row) => row.date)

  return {
    symbol,
    date: routeDate,
    availableDates,
    candles: toChartCandles(intradayRows),
    dbError: undefined,
  } satisfies ChartPageData
}

import * as dotenv from 'dotenv'
import { and, eq } from 'drizzle-orm'
import { toDateString } from './dateUtil'
import type { IntradayStocksTableRow } from '~/market-data/schema'
import db from '~/market-data/db'
import { dailyStocksTable, intradayStocksTable } from '~/market-data/schema'

dotenv.config({ path: '.env.local' })

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY
if (!MASSIVE_API_KEY) {
  throw new Error('MASSIVE_API_KEY environment variable not set')
}

const MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT = new URL(
  'https://api.massive.com/v2/aggs/ticker/',
)
MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT.searchParams.set(
  'apiKey',
  MASSIVE_API_KEY,
)
MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT.searchParams.set('adjusted', 'true')

const TIME_MULTIPLIER = 1
const TIME_FRAME = 'minute'

interface MassiveIntradayResult {
  t: number
  c: number
  h: number
  l: number
  n?: number
  o: number
  v: number
}

interface MassiveIntradayResponse {
  adjusted: boolean
  queryCount: number
  request_id: string
  resultsCount?: number
  status: string
  results?: Array<MassiveIntradayResult>
}

async function fetchIntradayStock(symbol: string, date: Date) {
  const url = new URL(MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT)
  const dateString = toDateString(date)

  const previousDate = new Date(date)
  previousDate.setDate(date.getDate() - 1)

  url.pathname += `${symbol}/range/${TIME_MULTIPLIER}/${TIME_FRAME}/${dateString}/${dateString}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as MassiveIntradayResponse
  return data
}

function mapIntradayResults({
  symbol,
  date,
  results,
}: {
  symbol: string
  date: Date
  results: Array<MassiveIntradayResult>
}): Array<IntradayStocksTableRow> {
  return results.map((r) => ({
    symbol,
    date: toDateString(date),
    open: r.o,
    high: r.h,
    low: r.l,
    close: r.c,
    volume: r.v,
    time: r.t,
  }))
}

async function main() {
  const symbol = process.argv[process.argv.length - 2]
  const targetDate = new Date(process.argv[process.argv.length - 1])

  if (!symbol || isNaN(targetDate.getTime())) {
    console.error('Usage: fetchIntradayStock.ts <symbol> <date>')
    return
  }

  const data = await fetchIntradayStock(symbol, targetDate)

  if (!data.results || data.resultsCount === 0) {
    console.error(`No results for ${toDateString(targetDate)}`)
    console.error(data)
    return
  }

  const intradayRows = mapIntradayResults({
    symbol,
    date: targetDate,
    results: data.results,
  })

  await db.transaction(async (tx) => {
    await tx
      .insert(intradayStocksTable)
      .values(intradayRows)
      .onConflictDoNothing()

    await tx
      .update(dailyStocksTable)
      .set({ hasIntraday: true })
      .where(
        and(
          eq(dailyStocksTable.date, toDateString(targetDate)),
          eq(dailyStocksTable.symbol, symbol),
        ),
      )
  })
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

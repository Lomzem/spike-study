import db from '~/market-data/db'
import {
  dailyStocksTable,
  type DailyStocksTableRow,
} from '~/market-data/schema'
import { dateString } from './dateUtil'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY
if (!MASSIVE_API_KEY) {
  throw new Error('MASSIVE_API_KEY environment variable not set')
}

const MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT = new URL(
  'https://api.massive.com/v2/aggs/grouped/locale/us/market/stocks',
)
MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT.searchParams.set(
  'apiKey',
  MASSIVE_API_KEY,
)
MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT.searchParams.set('adjusted', 'true')
MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT.searchParams.set('include_otc', 'false')

interface MassiveDailyMarketSummaryResult {
  T: string
  c: number
  h: number
  l: number
  n?: number
  o: number
  t: number
  v: number
}

interface MassiveDailyMarketSummaryResponse {
  queryCount: number
  request_id: string
  resultsCount?: number
  status: string
  results?: MassiveDailyMarketSummaryResult[]
}

/**
 * Fetches the Massive API daily market summary for the specified date.
 *
 * @param date - The target date whose summary will be requested (used in the request path as a YYYY-MM-DD date string).
 * @returns The parsed MassiveDailyMarketSummaryResponse returned by the API.
 * @throws Error if the HTTP response has a non-OK status; the error message includes the status code and status text.
 */
async function fetchDailyStocks(date: Date) {
  const url = new URL(MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT)
  url.pathname += `/${dateString(date)}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as MassiveDailyMarketSummaryResponse
  return data
}

const CHUNK_SIZE = 1000

/**
 * Persists Massive API daily stock summaries for a given date into the daily stocks table.
 *
 * Transforms each API result into a DailyStocksTableRow (computing `range` as `high / low - 1` and `change` as `close / open - 1`, using `0` when the divisor is `0`), inserts the rows into the database in manageable chunks, and logs insertion progress.
 *
 * @param date - The date to associate with each inserted row (used as the row `date` value)
 * @param results - Array of MassiveDailyMarketSummaryResult objects to transform and insert
 */
async function insertDailyStocks({
  date,
  results,
}: {
  date: Date
  results: MassiveDailyMarketSummaryResult[]
}) {
  const rowsWithCalculations: DailyStocksTableRow[] = results.map((r) => ({
    date: dateString(date),
    symbol: r.T,
    open: r.o,
    high: r.h,
    low: r.l,
    close: r.c,
    volume: r.v,
    trades: r.n ?? null,
    gap: null,
    range: r.l !== 0 ? r.h / r.l - 1 : 0,
    change: r.o !== 0 ? r.c / r.o - 1 : 0,
  }))

  // Insert in chunks to avoid stack overflow
  for (let i = 0; i < rowsWithCalculations.length; i += CHUNK_SIZE) {
    const chunk = rowsWithCalculations.slice(i, i + CHUNK_SIZE)
    await db.insert(dailyStocksTable).values(chunk)
    console.log(
      `Inserted ${i + chunk.length} / ${rowsWithCalculations.length} stocks`,
    )
  }
}

/**
 * Fetches the US market daily summaries for 2026-02-20 and persists them to the daily stocks table.
 *
 * If no results are returned for the target date, logs the response and returns early; otherwise transforms
 * and inserts the retrieved summaries into the database.
 */
async function main() {
  const targetDate = new Date(2026, 0, 20)

  const data = await fetchDailyStocks(targetDate)

  if (!data.results || data?.resultsCount === 0) {
    console.error(`No results for ${dateString(targetDate)}`)
    console.error(data)
    return
  }

  await insertDailyStocks({
    date: targetDate,
    results: data.results,
  })
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

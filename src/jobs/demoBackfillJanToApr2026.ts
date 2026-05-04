import * as dotenv from 'dotenv'
import { and, eq, gte, lte } from 'drizzle-orm'
import { toDateString } from './dateUtil'
import type {
  DailyStocksRow,
  IntradayStocksRow,
} from '../lib/server/db/schema.js'
import {
  dailyStocksTable,
  intradayStocksTable,
} from '../lib/server/db/schema.js'
import {
  getScriptDb,
  getScriptDbClient,
} from '../lib/server/db/script-client.js'

dotenv.config({ path: '.env.local' })

const db = getScriptDb()
const client = getScriptDbClient()

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY
if (!MASSIVE_API_KEY) {
  throw new Error('MASSIVE_API_KEY environment variable not set')
}

const START_DATE = '2026-01-01'
const END_DATE = '2026-04-20'
const MIN_GAP = 0.25
const CHUNK_SIZE = 1000
const REQUEST_LIMIT = 5
const REQUEST_WINDOW_MS = 60_000
const TIME_MULTIPLIER = 1
const TIME_FRAME = 'minute'

const MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT = new URL(
  'https://api.massive.com/v2/aggs/grouped/locale/us/market/stocks',
)
MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT.searchParams.set(
  'apiKey',
  MASSIVE_API_KEY,
)
MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT.searchParams.set('adjusted', 'true')
MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT.searchParams.set('include_otc', 'false')

const MASSIVE_INTRADAY_ENDPOINT = new URL(
  'https://api.massive.com/v2/aggs/ticker/',
)
MASSIVE_INTRADAY_ENDPOINT.searchParams.set('apiKey', MASSIVE_API_KEY)
MASSIVE_INTRADAY_ENDPOINT.searchParams.set('adjusted', 'true')

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
  results?: Array<MassiveDailyMarketSummaryResult>
}

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

const requestTimestamps: Array<number> = []

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseUtcDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate
}

function isWeekend(date: Date) {
  const dayOfWeek = date.getUTCDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

function getRateLimitDelayMs(now: number = Date.now()) {
  while (
    requestTimestamps.length > 0 &&
    now - requestTimestamps[0] >= REQUEST_WINDOW_MS
  ) {
    requestTimestamps.shift()
  }

  if (requestTimestamps.length < REQUEST_LIMIT) {
    return 0
  }

  return REQUEST_WINDOW_MS - (now - requestTimestamps[0])
}

async function waitForRequestSlot() {
  const delayMs = getRateLimitDelayMs()

  if (delayMs > 0) {
    const sleepMs = delayMs + 250
    console.log(
      `Rate limit reached, sleeping ${Math.ceil(sleepMs / 1000)}s for cooldown`,
    )
    await sleep(sleepMs)
  }
}

async function fetchMassiveJson<T>(url: URL): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await waitForRequestSlot()
    requestTimestamps.push(Date.now())

    const response = await fetch(url)

    if (response.status === 429) {
      if (attempt === 1) {
        throw new Error('Massive API returned 429 after retry')
      }

      const retryDelayMs =
        Math.max(getRateLimitDelayMs(), REQUEST_WINDOW_MS) + 250
      console.warn(
        `Massive API returned 429, retrying once after ${Math.ceil(retryDelayMs / 1000)}s`,
      )
      await sleep(retryDelayMs)
      continue
    }

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      )
    }

    return (await response.json()) as T
  }

  throw new Error('Unreachable retry loop exit')
}

async function fetchDailyStocks(date: Date) {
  const url = new URL(MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT)
  url.pathname += `/${toDateString(date)}`
  return fetchMassiveJson<MassiveDailyMarketSummaryResponse>(url)
}

async function fetchIntradayStock(symbol: string, date: Date) {
  const url = new URL(MASSIVE_INTRADAY_ENDPOINT)
  const dateString = toDateString(date)

  url.pathname += `${symbol}/range/${TIME_MULTIPLIER}/${TIME_FRAME}/${dateString}/${dateString}`

  return fetchMassiveJson<MassiveIntradayResponse>(url)
}

function mapDailyRows({
  date,
  results,
}: {
  date: Date
  results: Array<MassiveDailyMarketSummaryResult>
}): Array<DailyStocksRow> {
  return results.map((result) => ({
    date: toDateString(date),
    symbol: result.T,
    open: result.o,
    high: result.h,
    low: result.l,
    close: result.c,
    volume: result.v,
    trades: result.n ?? null,
    gap: null,
    range: result.l !== 0 ? result.h / result.l - 1 : 0,
    change: result.o !== 0 ? result.c / result.o - 1 : 0,
    hasIntraday: false,
  }))
}

function mapIntradayRows({
  symbol,
  date,
  results,
}: {
  symbol: string
  date: Date
  results: Array<MassiveIntradayResult>
}): Array<IntradayStocksRow> {
  return results.map((result) => ({
    symbol,
    date: toDateString(date),
    open: result.o,
    high: result.h,
    low: result.l,
    close: result.c,
    volume: result.v,
    time: result.t,
  }))
}

async function insertDailyRows(rows: Array<DailyStocksRow>) {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)
    await db.insert(dailyStocksTable).values(chunk).onConflictDoNothing()
  }
}

async function hasDailyRowsForDate(dateString: string) {
  const existingRows = await db
    .select({ symbol: dailyStocksTable.symbol })
    .from(dailyStocksTable)
    .where(eq(dailyStocksTable.date, dateString))
    .limit(1)

  return existingRows.length > 0
}

async function hasIntradayRowsForSymbolDate(symbol: string, date: string) {
  const existingRows = await db
    .select({ time: intradayStocksTable.time })
    .from(intradayStocksTable)
    .where(
      and(
        eq(intradayStocksTable.symbol, symbol),
        eq(intradayStocksTable.date, date),
      ),
    )
    .limit(1)

  return existingRows.length > 0
}

async function markDailyHasIntraday(symbol: string, date: string) {
  await db
    .update(dailyStocksTable)
    .set({ hasIntraday: true })
    .where(
      and(eq(dailyStocksTable.symbol, symbol), eq(dailyStocksTable.date, date)),
    )
}

async function importDailyRange() {
  const startDate = parseUtcDate(START_DATE)
  const endDate = parseUtcDate(END_DATE)

  for (
    let currentDate = startDate;
    currentDate <= endDate;
    currentDate = addUtcDays(currentDate, 1)
  ) {
    if (isWeekend(currentDate)) {
      console.log(`Skipping weekend ${toDateString(currentDate)}`)
      continue
    }

    const dateString = toDateString(currentDate)

    if (await hasDailyRowsForDate(dateString)) {
      console.log(`Skipping existing daily data for ${dateString}`)
      continue
    }

    console.log(`Fetching daily data for ${dateString}`)

    try {
      const data = await fetchDailyStocks(currentDate)

      if (!data.results || data.resultsCount === 0) {
        console.log(`No daily results for ${dateString}`)
        continue
      }

      const rows = mapDailyRows({
        date: currentDate,
        results: data.results,
      })

      await insertDailyRows(rows)
      console.log(`Processed ${rows.length} daily rows for ${dateString}`)
    } catch (error) {
      console.error(`Failed daily fetch for ${dateString}:`, error)
    }
  }
}

async function backfillGaps() {
  console.log('Backfilling daily gaps')

  const result = await client.execute(`
    UPDATE daily_stocks_table AS current
    SET gap = (
      SELECT (current.open / previous.close - 1)
      FROM daily_stocks_table AS previous
      WHERE previous.symbol = current.symbol
        AND previous.date < current.date
        AND previous.close IS NOT NULL
        AND previous.close != 0
      ORDER BY previous.date DESC
      LIMIT 1
    )
    WHERE gap IS NULL
      AND current.open IS NOT NULL
      AND current.date >= '${START_DATE}'
      AND current.date <= '${END_DATE}';
  `)

  console.log(
    `Gap backfill complete. Rows affected: ${result.rowsAffected ?? 0}`,
  )
}

async function fetchIntradayForGappers() {
  const candidates = await db
    .select({
      symbol: dailyStocksTable.symbol,
      date: dailyStocksTable.date,
      gap: dailyStocksTable.gap,
    })
    .from(dailyStocksTable)
    .where(
      and(
        gte(dailyStocksTable.date, START_DATE),
        lte(dailyStocksTable.date, END_DATE),
        gte(dailyStocksTable.gap, MIN_GAP),
        eq(dailyStocksTable.hasIntraday, false),
      ),
    )

  console.log(`Found ${candidates.length} intraday candidates with gap >= 25%`)

  let successCount = 0
  let emptyCount = 0
  let failureCount = 0
  let skippedExistingCount = 0

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index]

    if (await hasIntradayRowsForSymbolDate(candidate.symbol, candidate.date)) {
      skippedExistingCount += 1
      await markDailyHasIntraday(candidate.symbol, candidate.date)
      console.log(
        `Skipping existing intraday data for ${candidate.symbol} ${candidate.date}`,
      )
      continue
    }

    console.log(
      `Fetching intraday ${index + 1}/${candidates.length}: ${candidate.symbol} ${candidate.date} (${((candidate.gap ?? 0) * 100).toFixed(2)}%)`,
    )

    try {
      const targetDate = parseUtcDate(candidate.date)
      const data = await fetchIntradayStock(candidate.symbol, targetDate)

      if (!data.results || data.resultsCount === 0) {
        emptyCount += 1
        console.log(
          `No intraday results for ${candidate.symbol} ${candidate.date}`,
        )
        continue
      }

      const rows = mapIntradayRows({
        symbol: candidate.symbol,
        date: targetDate,
        results: data.results,
      })

      await db.transaction(async (tx) => {
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE)
          await tx
            .insert(intradayStocksTable)
            .values(chunk)
            .onConflictDoNothing()
        }

        await tx
          .update(dailyStocksTable)
          .set({ hasIntraday: true })
          .where(
            and(
              eq(dailyStocksTable.symbol, candidate.symbol),
              eq(dailyStocksTable.date, candidate.date),
            ),
          )
      })

      successCount += 1
      console.log(
        `Stored ${rows.length} intraday rows for ${candidate.symbol} ${candidate.date}`,
      )
    } catch (error) {
      failureCount += 1
      console.error(
        `Failed intraday fetch for ${candidate.symbol} ${candidate.date}:`,
        error,
      )
    }
  }

  console.log(
    `Intraday import complete. Successes: ${successCount}, skipped existing: ${skippedExistingCount}, empty: ${emptyCount}, failures: ${failureCount}`,
  )
}

async function main() {
  console.log(`Starting demo backfill for ${START_DATE} through ${END_DATE}`)

  await importDailyRange()
  await backfillGaps()
  await fetchIntradayForGappers()

  console.log('Demo backfill complete')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

import db from '~/market-data/db'
import {
  dailyStocksTable,
  type DailyStocksTableRow,
} from '~/market-data/schema'
import { dateString } from './dateUtil'

const MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT = new URL(
  'https://api.massive.com/v2/aggs/grouped/locale/us/market/stocks',
)
MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT.searchParams.set(
  'apiKey',
  process.env.MASSIVE_API_KEY!,
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

async function fetchDailyStocks(date: Date) {
  const url = new URL(MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT)
  url.pathname += `/${dateString(date)}`

  const response = await fetch(url)

  const data = (await response.json()) as MassiveDailyMarketSummaryResponse
  return data
}

const CHUNK_SIZE = 1000

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
    range: r.h / r.l - 1,
    change: r.c / r.o - 1,
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

async function main() {
  const targetDate = new Date(2026, 1, 20)

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

main()

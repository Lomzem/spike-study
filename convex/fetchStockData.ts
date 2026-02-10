import { internalAction, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

const MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT = new URL(
  'https://api.massive.com/v2/aggs/grouped/locale/us/market/stocks',
)!
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
  resultsCount: number
  status: string
  results: MassiveDailyMarketSummaryResult[]
}

const MassiveDailyMarketSummaryResultValidator = v.object({
  symbol: v.string(),
  close: v.number(),
  high: v.number(),
  low: v.number(),
  trades: v.optional(v.number()),
  open: v.number(),
  volume: v.number(),
  gap: v.optional(v.number()), // may not have stored previous day
  range: v.number(),
  change: v.number(),
})

function dateToString(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function previousDate(date: { year: number; month: number; day: number }) {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day))
  d.setUTCDate(d.getUTCDate() - 1)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  }
}

const CHUNK_SIZE = 500

async function fetchDaily(date: { year: number; month: number; day: number }) {
  const url = new URL(MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT)
  url.pathname += `/${dateToString(date.year, date.month, date.day)}`

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error('Fetch failed')

  const data = (await response.json()) as MassiveDailyMarketSummaryResponse
  return data
}

export const fetchDailyMarketSummary = internalAction({
  args: {
    year: v.number(),
    month: v.number(),
    day: v.number(),
  },
  handler: async (ctx, args) => {
    const today = args
    const yesterday = previousDate(args)

    const [todayResponse, yesterdayResponse] = await Promise.all([
      fetchDaily(today),
      fetchDaily(yesterday),
    ])

    // Symbol to previous close
    const prevClose = new Map<string, number>()
    for (const result of yesterdayResponse.results) {
      prevClose.set(result.T, result.c)
    }

    for (let i = 0; i < todayResponse.results.length; i += CHUNK_SIZE) {
      const chunk = todayResponse.results.slice(i, i + CHUNK_SIZE)
      await ctx.runMutation(internal.fetchStockData.insertDailyStockData, {
        year: args.year,
        month: args.month,
        day: args.day,
        stockResults: chunk.map((chunk) => ({
          symbol: chunk.T,
          close: chunk.c,
          high: chunk.h,
          low: chunk.l,
          open: chunk.o,
          volume: chunk.v,
          trades: chunk.n,
          change: chunk.c / chunk.o - 1,
          range: chunk.h / chunk.l - 1,
          gap: prevClose.get(chunk.T)
            ? chunk.o / prevClose.get(chunk.T)! - 1
            : undefined,
        })),
      })
    }
  },
})

export const insertDailyStockData = internalMutation({
  args: {
    year: v.number(),
    month: v.number(),
    day: v.number(),
    stockResults: v.array(MassiveDailyMarketSummaryResultValidator),
  },
  handler: async (ctx, args) => {
    for (const result of args.stockResults) {
      await ctx.db.insert('dailyStocks', {
        date: dateToString(args.year, args.month, args.day),
        symbol: result.symbol,
        open: result.open,
        high: result.high,
        low: result.low,
        close: result.close,
        volume: result.volume,
        trades: result.trades,
        gap: result.gap,
        range: result.range,
        change: result.change,
      })
    }
  },
})

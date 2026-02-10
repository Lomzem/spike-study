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
})

function dateToString(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const CHUNK_SIZE = 500

export const fetchDailyMarketSummary = internalAction({
  args: {
    year: v.number(),
    month: v.number(),
    day: v.number(),
  },
  handler: async (ctx, args) => {
    const url = new URL(MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT)
    const date = dateToString(args.year, args.month, args.day)
    url.pathname += `/${date}`
    const response = await fetch(url.toString())
    if (!response.ok)
      throw new Error(
        `Failed to fetch daily market summary: ${response.status} ${response.statusText}`,
      )

    const data = (await response.json()) as MassiveDailyMarketSummaryResponse

    for (let i = 0; i < data.results.length; i += CHUNK_SIZE) {
      const chunk = data.results.slice(i, i + CHUNK_SIZE)
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
        date: `${args.year}-${args.month}-${args.day}`,
        symbol: result.symbol,
        open: result.open,
        high: result.high,
        low: result.low,
        close: result.close,
        volume: result.volume,
        trades: result.trades,
      })
    }
  },
})

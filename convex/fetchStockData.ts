import {
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { vv } from './schema'

const apiKey = process.env.MASSIVE_API_KEY
if (!apiKey) {
  throw new Error('MASSIVE_API_KEY environment variable is not set')
}

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

function previousDate(date: { year: number; month: number; day: number }) {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day))
  d.setUTCDate(d.getUTCDate() - 1)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  }
}

const CHUNK_SIZE = 100

async function fetchDaily(date: { year: number; month: number; day: number }) {
  const url = new URL(MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT)
  url.pathname += `/${dateToString(date.year, date.month, date.day)}`

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error('Fetch failed')

  const data = (await response.json()) as MassiveDailyMarketSummaryResponse
  return data
}

export const fetchAndInsertDailyMarketSummary = internalAction({
  args: {
    year: v.number(),
    month: v.number(),
    day: v.number(),
  },
  handler: async (ctx, args) => {
    const today = args
    const todayResponse = await fetchDaily(today)
    todayResponse.results = todayResponse.results.filter((r) => r.T === 'AAPL')

    // for (let i = 0; i < todayResponse.results.length; i += CHUNK_SIZE) {
    for (let i = 0; i < 100; i += CHUNK_SIZE) {
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
      const yesterday = previousDate({
        year: args.year,
        month: args.month,
        day: args.day,
      })
      const yesterdayString = dateToString(
        yesterday.year,
        yesterday.month,
        yesterday.day,
      )
      const prevDayClose = await ctx.db
        .query('dailyStocks')
        .withIndex('by_date_symbol', (q) =>
          q.eq('date', yesterdayString).eq('symbol', result.symbol),
        )
        .unique()

      const gap = prevDayClose
        ? result.open / prevDayClose.close - 1
        : undefined

      await ctx.db.insert('dailyStocks', {
        date: dateToString(args.year, args.month, args.day),
        symbol: result.symbol,
        open: result.open,
        high: result.high,
        low: result.low,
        close: result.close,
        volume: result.volume,
        trades: result.trades,
        gap: gap,
        range: result.high / result.low - 1,
        change: result.close / result.open - 1,
        needsBackfill: gap === undefined,
      })
    }
  },
})

const BATCH_SIZE = 100

export const listNeedsBackfill = internalQuery({
  args: {
    year: v.number(),
    month: v.number(),
    day: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const targetDate = dateToString(args.year, args.month, args.day)
    const results = await ctx.db
      .query('dailyStocks')
      .withIndex('by_date_needsBackfill', (q) =>
        q.eq('date', targetDate).eq('needsBackfill', true),
      )
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor ?? null })
    return results
  },
})

export const processBackfill = internalMutation({
  args: {
    records: v.array(vv.doc('dailyStocks')),
    date: v.object({
      year: v.number(),
      month: v.number(),
      day: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const yesterday = previousDate(args.date)
    const yesterdayString = dateToString(
      yesterday.year,
      yesterday.month,
      yesterday.day,
    )
    for (const record of args.records) {
      const prevDayClose = await ctx.db
        .query('dailyStocks')
        .withIndex('by_date_symbol', (q) =>
          q.eq('date', yesterdayString).eq('symbol', record.symbol),
        )
        .unique()
      if (!prevDayClose) return
      await ctx.db.patch('dailyStocks', record._id, {
        gap: record.open / prevDayClose.close - 1,
        needsBackfill: false,
      })
    }
  },
})

export const backfillGapAction = internalAction({
  args: {
    year: v.number(),
    month: v.number(),
    day: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runQuery(
      internal.fetchStockData.listNeedsBackfill,
      {
        year: args.year,
        month: args.month,
        day: args.day,
        cursor: args.cursor,
      },
    )
    if (result.page.length === 0) {
      console.log('Backfill gap action done')
      return
    }

    await ctx.runMutation(internal.fetchStockData.processBackfill, {
      records: result.page,
      date: {
        year: args.year,
        month: args.month,
        day: args.day,
      },
    })

    if (!result.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.fetchStockData.backfillGapAction,
        {
          year: args.year,
          month: args.month,
          day: args.day,
          cursor: result.continueCursor,
        },
      )
    }
  },
})

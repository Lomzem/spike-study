import type { intradayStocksTable } from '$lib/server/db/schema.js'
import type { InferSelectModel } from 'drizzle-orm'
import type { UTCTimestamp } from 'lightweight-charts'

export type IntradayRow = InferSelectModel<typeof intradayStocksTable>

export interface ChartCandle {
  time: UTCTimestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ChartPageData {
  symbol: string
  date: string
  availableDates: Array<string>
  intradayRows: Array<IntradayRow>
  candles: Array<ChartCandle>
  dbError?: string
}

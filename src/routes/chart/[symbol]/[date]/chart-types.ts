import type { UTCTimestamp } from 'lightweight-charts'

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
  candles: Array<ChartCandle>
  dbError?: string
}

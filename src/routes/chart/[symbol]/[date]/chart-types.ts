import type { UTCTimestamp } from 'lightweight-charts'
import type { SavedPriceLine } from './chart-user-price-lines'

export interface ChartCandle {
  time: UTCTimestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ChartIndicatorState {
  showSma: boolean
  showEma: boolean
  showVwap: boolean
}

export interface ChartDrawingState {
  symbol: string
  priceLines: Array<SavedPriceLine>
}

export interface ChartPageData {
  symbol: string
  date: string
  availableDates: Array<string>
  candles: Array<ChartCandle>
  dbError?: string
}

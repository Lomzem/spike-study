import type { UTCTimestamp } from 'lightweight-charts'
import type { DrawingDefaults, SavedDrawing } from './drawings/types'

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
  drawings: Array<SavedDrawing>
}

export interface ChartDrawingDefaultsState {
  defaults: DrawingDefaults
}

export interface ChartPageData {
  symbol: string
  date: string
  availableDates: Array<string>
  candles: Array<ChartCandle>
  dbError?: string
}

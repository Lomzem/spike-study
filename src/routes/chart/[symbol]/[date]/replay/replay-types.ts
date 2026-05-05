import type { ChartCandle } from '../chart-types'

export const REPLAY_SPEEDS = [1, 2, 4, 10] as const
export const REPLAY_STARTING_CASH = 25_000

export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number]
export type ReplayOrderAction = 'buy' | 'sell-short' | 'close'
export type ReplayPositionSide = 'long' | 'short'

export interface ReplayPosition {
  side: ReplayPositionSide
  shares: number
  averagePrice: number
  openedAt: number
}

export interface ReplayPendingOrder {
  id: string
  action: ReplayOrderAction
  shares: number
  submittedAt: number
}

export interface ReplayFill {
  id: string
  orderId: string
  action: ReplayOrderAction
  shares: number
  price: number
  time: number
  realizedPnl: number
}

export interface ReplayClosedTrade {
  id: string
  side: ReplayPositionSide
  shares: number
  entryPrice: number
  exitPrice: number
  openedAt: number
  closedAt: number
  realizedPnl: number
}

export interface ReplaySnapshot {
  version: 1
  symbol: string
  date: string
  currentTime: number
  revealedCandleIndex: number
  speed: ReplaySpeed
  isPlaying: boolean
  cash: number
  position: ReplayPosition | null
  pendingOrders: Array<ReplayPendingOrder>
  fills: Array<ReplayFill>
  closedTrades: Array<ReplayClosedTrade>
  updatedAt: number
}

export interface ReplayStorageKey {
  symbol: string
  date: string
}

export interface ReplayStorage {
  load(key: ReplayStorageKey): ReplaySnapshot | null
  save(key: ReplayStorageKey, snapshot: ReplaySnapshot): void
  clear(key: ReplayStorageKey): void
}

export interface ReplayPageData {
  symbol: string
  date: string
  availableDates: Array<string>
  candles: Array<ChartCandle>
  dbError?: string
}

export interface ReplayOrderResult {
  ok: boolean
  snapshot: ReplaySnapshot
  error?: string
}

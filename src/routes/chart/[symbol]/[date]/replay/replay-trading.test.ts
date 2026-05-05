import { describe, expect, it } from 'vitest'
import type { ChartCandle } from '../chart-types'
import { buildInitialReplaySnapshot } from './replay-session'
import {
  applyReplayTradingToRange,
  calculateReplayEquity,
  getReplayRealizedPnl,
  getReplayUnrealizedPnl,
  submitReplayOrder,
} from './replay-trading'

function candleAt({
  timestampSeconds,
  open,
  close = open,
}: {
  timestampSeconds: number
  open: number
  close?: number
}): ChartCandle {
  return {
    time: timestampSeconds as ChartCandle['time'],
    open,
    high: Math.max(open, close),
    low: Math.min(open, close),
    close,
    volume: 1_000,
  }
}

describe('replay-trading', () => {
  it('fills a long market order on the next minute open', () => {
    const candles = [
      candleAt({
        timestampSeconds: Date.UTC(2024, 0, 2, 14, 30) / 1000,
        open: 10,
      }),
      candleAt({
        timestampSeconds: Date.UTC(2024, 0, 2, 14, 31) / 1000,
        open: 11,
      }),
    ]
    const initialSnapshot = buildInitialReplaySnapshot({
      symbol: 'AAPL',
      date: '2024-01-02',
      candles,
    })

    const orderResult = submitReplayOrder({
      snapshot: initialSnapshot,
      action: 'buy',
      shares: 100,
      submittedAt: candles[0].time + 30,
      referencePrice: candles[0].close,
    })
    expect(orderResult.ok).toBe(true)

    const filledSnapshot = applyReplayTradingToRange(
      {
        ...orderResult.snapshot,
        revealedCandleIndex: 1,
        currentTime: candles[1].time,
      },
      candles,
      0,
      1,
    )

    expect(filledSnapshot.pendingOrders).toHaveLength(0)
    expect(filledSnapshot.position).toMatchObject({
      side: 'long',
      shares: 100,
      averagePrice: 11,
    })
    expect(filledSnapshot.cash).toBe(23_900)
  })

  it('tracks realized and unrealized pnl for a short replay trade', () => {
    const candles = [
      candleAt({
        timestampSeconds: Date.UTC(2024, 0, 2, 14, 30) / 1000,
        open: 10,
      }),
      candleAt({
        timestampSeconds: Date.UTC(2024, 0, 2, 14, 31) / 1000,
        open: 10,
        close: 9,
      }),
      candleAt({
        timestampSeconds: Date.UTC(2024, 0, 2, 14, 32) / 1000,
        open: 8,
      }),
    ]
    const initialSnapshot = buildInitialReplaySnapshot({
      symbol: 'AAPL',
      date: '2024-01-02',
      candles,
    })

    const shortOrder = submitReplayOrder({
      snapshot: initialSnapshot,
      action: 'sell-short',
      shares: 50,
      submittedAt: candles[0].time + 15,
      referencePrice: candles[0].close,
    })
    expect(shortOrder.ok).toBe(true)

    const openedShort = applyReplayTradingToRange(
      {
        ...shortOrder.snapshot,
        revealedCandleIndex: 1,
        currentTime: candles[1].time,
      },
      candles,
      0,
      1,
    )

    expect(getReplayUnrealizedPnl(openedShort.position, candles[1].close)).toBe(
      50,
    )
    expect(calculateReplayEquity(openedShort, candles[1].close)).toBe(25_050)

    const closeOrder = submitReplayOrder({
      snapshot: openedShort,
      action: 'close',
      shares: 0,
      submittedAt: candles[1].time + 5,
      referencePrice: candles[1].close,
    })
    expect(closeOrder.ok).toBe(true)

    const closedShort = applyReplayTradingToRange(
      {
        ...closeOrder.snapshot,
        revealedCandleIndex: 2,
        currentTime: candles[2].time,
      },
      candles,
      1,
      2,
    )

    expect(closedShort.position).toBeNull()
    expect(closedShort.cash).toBe(25_100)
    expect(getReplayRealizedPnl(closedShort)).toBe(100)
  })
})

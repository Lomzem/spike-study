import { describe, expect, it } from 'vitest'
import type { ChartCandle } from '../chart-types'
import {
  buildInitialReplaySnapshot,
  restoreReplaySnapshot,
} from './replay-session'
import {
  findReplayStartIndex,
  getReplayEndTime,
  getReplayStartTime,
  getRevealedCandles,
  getRevealedCandleIndex,
} from './replay-time'

function candleAt(timestampSeconds: number): ChartCandle {
  return {
    time: timestampSeconds as ChartCandle['time'],
    open: 10,
    high: 11,
    low: 9,
    close: 10,
    volume: 1_000,
  }
}

describe('replay-time', () => {
  it('starts at the first 9:30-or-later candle while keeping premarket candles available', () => {
    const candles = [
      candleAt(Date.UTC(2024, 0, 2, 13, 0) / 1000),
      candleAt(Date.UTC(2024, 0, 2, 14, 29) / 1000),
      candleAt(Date.UTC(2024, 0, 2, 14, 30) / 1000),
      candleAt(Date.UTC(2024, 0, 2, 14, 31) / 1000),
    ]

    expect(findReplayStartIndex(candles)).toBe(2)
    expect(getReplayStartTime(candles)).toBe(candles[2].time)
    expect(getRevealedCandleIndex(candles, candles[2].time)).toBe(2)
    expect(getRevealedCandles(candles, 2)).toEqual([candles[2]])
  })

  it('keeps replay progression within the same loaded day', () => {
    const candles = [
      candleAt(Date.UTC(2024, 0, 2, 14, 30) / 1000),
      candleAt(Date.UTC(2024, 0, 2, 21, 0) / 1000),
      candleAt(Date.UTC(2024, 0, 2, 23, 0) / 1000),
    ]

    expect(getReplayEndTime(candles)).toBe(candles[2].time)
    expect(getRevealedCandleIndex(candles, candles[2].time)).toBe(2)
  })

  it('starts fresh again when the saved replay already reached the last candle', () => {
    const candles = [
      candleAt(Date.UTC(2024, 0, 2, 14, 30) / 1000),
      candleAt(Date.UTC(2024, 0, 2, 14, 31) / 1000),
      candleAt(Date.UTC(2024, 0, 2, 14, 32) / 1000),
    ]
    const completedSnapshot = {
      ...buildInitialReplaySnapshot({
        symbol: 'AAPL',
        date: '2024-01-02',
        candles,
      }),
      currentTime: candles[2].time,
      revealedCandleIndex: 2,
    }

    const restoredSnapshot = restoreReplaySnapshot({
      symbol: 'AAPL',
      date: '2024-01-02',
      candles,
      snapshot: completedSnapshot,
    })

    expect(restoredSnapshot.currentTime).toBe(candles[0].time)
    expect(restoredSnapshot.revealedCandleIndex).toBe(0)
    expect(restoredSnapshot.isPlaying).toBe(false)
  })
})

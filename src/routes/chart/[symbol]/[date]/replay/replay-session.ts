import type { ChartCandle } from '../chart-types'
import {
  REPLAY_SPEEDS,
  REPLAY_STARTING_CASH,
  type ReplaySnapshot,
  type ReplaySpeed,
} from './replay-types'
import {
  clampReplayTime,
  getReplayEndTime,
  getReplayStartTime,
  getRevealedCandleIndex,
} from './replay-time'

interface ReplaySnapshotOptions {
  symbol: string
  date: string
  candles: Array<ChartCandle>
}

export function buildInitialReplaySnapshot({
  symbol,
  date,
  candles,
}: ReplaySnapshotOptions): ReplaySnapshot {
  const startTime = getReplayStartTime(candles)

  return {
    version: 1,
    symbol,
    date,
    currentTime: startTime,
    revealedCandleIndex: getRevealedCandleIndex(candles, startTime),
    speed: 1,
    isPlaying: false,
    cash: REPLAY_STARTING_CASH,
    position: null,
    pendingOrders: [],
    fills: [],
    closedTrades: [],
    updatedAt: Date.now(),
  }
}

export function restoreReplaySnapshot({
  symbol,
  date,
  candles,
  snapshot,
}: ReplaySnapshotOptions & { snapshot: ReplaySnapshot | null }) {
  if (!snapshot || snapshot.symbol !== symbol || snapshot.date !== date) {
    return buildInitialReplaySnapshot({ symbol, date, candles })
  }

  const currentTime = clampReplayTime(candles, snapshot.currentTime)
  const endTime = getReplayEndTime(candles)

  if (currentTime >= endTime) {
    return buildInitialReplaySnapshot({ symbol, date, candles })
  }

  return {
    ...snapshot,
    symbol,
    date,
    currentTime,
    revealedCandleIndex: getRevealedCandleIndex(candles, currentTime),
    speed: isReplaySpeed(snapshot.speed) ? snapshot.speed : 1,
  }
}

export function advanceReplaySnapshot(
  snapshot: ReplaySnapshot,
  candles: Array<ChartCandle>,
  elapsedMs: number,
) {
  if (!snapshot.isPlaying || candles.length === 0 || elapsedMs <= 0) {
    return snapshot
  }

  const endTime = getReplayEndTime(candles)
  const nextTime = Math.min(
    snapshot.currentTime + (elapsedMs / 1000) * snapshot.speed,
    endTime,
  )

  return {
    ...snapshot,
    currentTime: nextTime,
    revealedCandleIndex: getRevealedCandleIndex(candles, nextTime),
    isPlaying: nextTime < endTime,
  }
}

export function setReplayPlaying(
  snapshot: ReplaySnapshot,
  candles: Array<ChartCandle>,
  isPlaying: boolean,
) {
  if (candles.length === 0) {
    return snapshot
  }

  const endTime = getReplayEndTime(candles)

  return {
    ...snapshot,
    isPlaying: isPlaying && snapshot.currentTime < endTime,
  }
}

export function setReplaySpeed(snapshot: ReplaySnapshot, speed: ReplaySpeed) {
  return {
    ...snapshot,
    speed,
  }
}

export function resetReplaySnapshot(options: ReplaySnapshotOptions) {
  return buildInitialReplaySnapshot(options)
}

function isReplaySpeed(value: number): value is ReplaySpeed {
  return REPLAY_SPEEDS.includes(value as ReplaySpeed)
}

import { browser } from '$app/environment'
import type {
  ReplaySnapshot,
  ReplayStorage,
  ReplayStorageKey,
} from './replay-types'
import { buildReplayStorageKey } from './replay-persistence'

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isReplayOrderAction(
  value: unknown,
): value is ReplaySnapshot['pendingOrders'][number]['action'] {
  return value === 'buy' || value === 'sell-short' || value === 'close'
}

function isReplayPositionSide(
  value: unknown,
): value is NonNullable<ReplaySnapshot['position']>['side'] {
  return value === 'long' || value === 'short'
}

function isReplayPosition(
  value: unknown,
): value is NonNullable<ReplaySnapshot['position']> {
  if (!value || typeof value !== 'object') {
    return false
  }

  const position = value as NonNullable<ReplaySnapshot['position']>
  return (
    isReplayPositionSide(position.side) &&
    isFiniteNumber(position.shares) &&
    isFiniteNumber(position.averagePrice) &&
    isFiniteNumber(position.openedAt)
  )
}

function isReplayPendingOrder(
  value: unknown,
): value is ReplaySnapshot['pendingOrders'][number] {
  if (!value || typeof value !== 'object') {
    return false
  }

  const order = value as ReplaySnapshot['pendingOrders'][number]
  return (
    typeof order.id === 'string' &&
    isReplayOrderAction(order.action) &&
    isFiniteNumber(order.shares) &&
    isFiniteNumber(order.submittedAt)
  )
}

function isReplayFill(
  value: unknown,
): value is ReplaySnapshot['fills'][number] {
  if (!value || typeof value !== 'object') {
    return false
  }

  const fill = value as ReplaySnapshot['fills'][number]
  return (
    typeof fill.id === 'string' &&
    typeof fill.orderId === 'string' &&
    isReplayOrderAction(fill.action) &&
    isFiniteNumber(fill.shares) &&
    isFiniteNumber(fill.price) &&
    isFiniteNumber(fill.time) &&
    isFiniteNumber(fill.realizedPnl)
  )
}

function isReplayClosedTrade(
  value: unknown,
): value is ReplaySnapshot['closedTrades'][number] {
  if (!value || typeof value !== 'object') {
    return false
  }

  const trade = value as ReplaySnapshot['closedTrades'][number]
  return (
    typeof trade.id === 'string' &&
    isReplayPositionSide(trade.side) &&
    isFiniteNumber(trade.shares) &&
    isFiniteNumber(trade.entryPrice) &&
    isFiniteNumber(trade.exitPrice) &&
    isFiniteNumber(trade.openedAt) &&
    isFiniteNumber(trade.closedAt) &&
    isFiniteNumber(trade.realizedPnl)
  )
}

function isReplaySnapshot(value: unknown): value is ReplaySnapshot {
  if (!value || typeof value !== 'object') {
    return false
  }

  const snapshot = value as Partial<ReplaySnapshot>
  return (
    snapshot.version === 1 &&
    typeof snapshot.symbol === 'string' &&
    typeof snapshot.date === 'string' &&
    isFiniteNumber(snapshot.currentTime) &&
    isFiniteNumber(snapshot.revealedCandleIndex) &&
    isFiniteNumber(snapshot.speed) &&
    typeof snapshot.isPlaying === 'boolean' &&
    isFiniteNumber(snapshot.cash) &&
    (snapshot.position === null || isReplayPosition(snapshot.position)) &&
    Array.isArray(snapshot.pendingOrders) &&
    snapshot.pendingOrders.every((order) => isReplayPendingOrder(order)) &&
    Array.isArray(snapshot.fills) &&
    snapshot.fills.every((fill) => isReplayFill(fill)) &&
    Array.isArray(snapshot.closedTrades) &&
    snapshot.closedTrades.every((trade) => isReplayClosedTrade(trade)) &&
    isFiniteNumber(snapshot.updatedAt)
  )
}

export function createLocalReplayStorage(): ReplayStorage {
  return {
    load(key: ReplayStorageKey) {
      if (!browser) {
        return null
      }

      try {
        const rawValue = window.localStorage.getItem(buildReplayStorageKey(key))
        if (!rawValue) {
          return null
        }

        const parsedValue = JSON.parse(rawValue) as unknown
        return isReplaySnapshot(parsedValue) ? parsedValue : null
      } catch {
        return null
      }
    },

    save(key: ReplayStorageKey, snapshot: ReplaySnapshot) {
      if (!browser) {
        return
      }

      try {
        window.localStorage.setItem(
          buildReplayStorageKey(key),
          JSON.stringify(snapshot),
        )
      } catch {
        // Ignore storage write failures in MVP mode.
      }
    },

    clear(key: ReplayStorageKey) {
      if (!browser) {
        return
      }

      try {
        window.localStorage.removeItem(buildReplayStorageKey(key))
      } catch {
        // Ignore storage delete failures in MVP mode.
      }
    },
  }
}

import { browser } from '$app/environment'
import type {
  ReplaySnapshot,
  ReplayStorage,
  ReplayStorageKey,
} from './replay-types'
import { buildReplayStorageKey } from './replay-persistence'

function isReplaySnapshot(value: unknown): value is ReplaySnapshot {
  if (!value || typeof value !== 'object') {
    return false
  }

  const snapshot = value as Partial<ReplaySnapshot>
  return (
    snapshot.version === 1 &&
    typeof snapshot.symbol === 'string' &&
    typeof snapshot.date === 'string' &&
    typeof snapshot.currentTime === 'number' &&
    typeof snapshot.revealedCandleIndex === 'number' &&
    typeof snapshot.speed === 'number' &&
    typeof snapshot.isPlaying === 'boolean' &&
    typeof snapshot.cash === 'number' &&
    Array.isArray(snapshot.pendingOrders) &&
    Array.isArray(snapshot.fills) &&
    Array.isArray(snapshot.closedTrades) &&
    typeof snapshot.updatedAt === 'number'
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

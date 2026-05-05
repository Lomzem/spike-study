import type {
  ReplaySnapshot,
  ReplayStorage,
  ReplayStorageKey,
} from './replay-types'

export function buildReplayStorageKey(key: ReplayStorageKey) {
  return `replay:${key.symbol}:${key.date}`
}

export function saveReplaySnapshot(
  storage: ReplayStorage,
  key: ReplayStorageKey,
  snapshot: ReplaySnapshot,
) {
  storage.save(key, {
    ...snapshot,
    updatedAt: Date.now(),
  })
}

import { cloneDrawingDefaults } from './defaults'
import type { DrawingDefaults } from './types'

interface LiveDrawingDefaultsOptions {
  normalizedDefaults: DrawingDefaults
  normalizedDefaultsKey: string
  optimisticDefaults: DrawingDefaults | null
  pendingDefaults: DrawingDefaults | null
  awaitingRemoteDefaultsKey: string | null
}

export function buildDrawingDefaultsKey(defaults: DrawingDefaults) {
  return JSON.stringify(defaults)
}

export function getLiveDrawingDefaults({
  normalizedDefaults,
  normalizedDefaultsKey,
  optimisticDefaults,
  pendingDefaults,
  awaitingRemoteDefaultsKey,
}: LiveDrawingDefaultsOptions): DrawingDefaults {
  if (pendingDefaults !== null) {
    return cloneDrawingDefaults(pendingDefaults)
  }

  if (
    optimisticDefaults !== null &&
    awaitingRemoteDefaultsKey !== null &&
    normalizedDefaultsKey !== awaitingRemoteDefaultsKey
  ) {
    return cloneDrawingDefaults(optimisticDefaults)
  }

  return cloneDrawingDefaults(normalizedDefaults)
}

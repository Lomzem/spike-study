import { browser } from '$app/environment'
import { env as publicEnv } from '$env/dynamic/public'
import { useConvexClient, useQuery } from 'convex-svelte'
import { useClerkContext } from 'svelte-clerk'
import { fromStore } from 'svelte/store'
import { api } from '../../../../../../convex/_generated/api.js'
import { useConvexAuthReady } from '$lib/client/convex-auth'
import { cloneDrawingDefaults, DEFAULT_DRAWING_DEFAULTS } from './defaults'
import { normalizeDrawingDefaults, normalizeSavedDrawings } from './normalize'
import type { DrawingDefaults, SavedDrawing } from './types'

interface DrawingPersistenceData {
  symbol: string
  dbError?: string
}

export function createDrawingPersistence(
  getData: () => DrawingPersistenceData,
) {
  if (!browser || !publicEnv.PUBLIC_CONVEX_URL) {
    return {
      get defaults() {
        return cloneDrawingDefaults(DEFAULT_DRAWING_DEFAULTS)
      },
      get drawings() {
        return null
      },
      async saveDefaults() {},
      async saveDrawings() {},
    }
  }

  const clerk = useClerkContext()
  const convex = useConvexClient()
  const convexAuthReady = fromStore(useConvexAuthReady())

  const canAccessDrawings = $derived(
    !getData().dbError &&
      clerk.isLoaded &&
      Boolean(clerk.session) &&
      convexAuthReady.current,
  )

  const savedDrawings = useQuery(api.userDrawings.getForSymbol, () =>
    canAccessDrawings ? { symbol: getData().symbol } : 'skip',
  )
  const savedDefaults = useQuery(api.userDrawings.getDefaults, () =>
    canAccessDrawings ? {} : 'skip',
  )

  const normalizedDrawings = $derived(
    normalizeSavedDrawings(savedDrawings.data) ?? [],
  )
  const normalizedDefaults = $derived(
    normalizeDrawingDefaults(savedDefaults.data) ??
      cloneDrawingDefaults(DEFAULT_DRAWING_DEFAULTS),
  )

  async function saveDrawings(drawings: Array<SavedDrawing>) {
    if (!canAccessDrawings) {
      return
    }

    await convex.mutation(api.userDrawings.saveForSymbol, {
      symbol: getData().symbol,
      drawings,
    })
  }

  async function saveDefaults(defaults: DrawingDefaults) {
    if (!canAccessDrawings) {
      return
    }

    await convex.mutation(api.userDrawings.saveDefaults, {
      defaults,
    })
  }

  return {
    get defaults() {
      return normalizedDefaults
    },
    get drawings() {
      return canAccessDrawings
        ? { symbol: getData().symbol, drawings: normalizedDrawings }
        : null
    },
    saveDefaults,
    saveDrawings,
  }
}

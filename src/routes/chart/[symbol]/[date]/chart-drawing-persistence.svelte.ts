import { browser } from '$app/environment'
import { env as publicEnv } from '$env/dynamic/public'
import { useConvexClient, useQuery } from 'convex-svelte'
import { useClerkContext } from 'svelte-clerk'
import { fromStore } from 'svelte/store'
import { api } from '../../../../../convex/_generated/api.js'
import { useConvexAuthReady } from '$lib/client/convex-auth'
import { normalizeSavedPriceLines } from './chart-drawings'
import type { SavedPriceLine } from './chart-drawing-types'
import type { ChartDrawingState, ChartPageData } from './chart-types'

export function createChartDrawingPersistence(getData: () => ChartPageData) {
  if (!browser || !publicEnv.PUBLIC_CONVEX_URL) {
    return {
      get drawings() {
        return null
      },
      async saveDrawings() {},
    }
  }

  const clerk = useClerkContext()
  const convex = useConvexClient()
  const convexAuthReady = fromStore(useConvexAuthReady())

  const canAccessDrawings = $derived(
    !getData().dbError &&
      clerk.isLoaded &&
      Boolean(clerk.auth.userId) &&
      convexAuthReady.current,
  )

  const savedDrawings = useQuery(api.userDrawings.getForSymbol, () =>
    canAccessDrawings ? { symbol: getData().symbol } : 'skip',
  )

  const normalizedDrawings = $derived(
    normalizeSavedPriceLines(savedDrawings.data),
  )

  const drawings = $derived<ChartDrawingState | null>(
    normalizedDrawings
      ? { symbol: getData().symbol, priceLines: normalizedDrawings }
      : null,
  )

  async function saveDrawings(priceLines: Array<SavedPriceLine>) {
    if (!canAccessDrawings) {
      return
    }

    await convex.mutation(api.userDrawings.saveForSymbol, {
      symbol: getData().symbol,
      priceLines,
    })
  }

  return {
    get drawings() {
      return drawings
    },
    saveDrawings,
  }
}

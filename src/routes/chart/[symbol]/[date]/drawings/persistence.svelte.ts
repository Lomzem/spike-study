import { browser } from '$app/environment'
import { env as publicEnv } from '$env/dynamic/public'
import { useConvexClient, useQuery } from 'convex-svelte'
import { useClerkContext } from 'svelte-clerk'
import { api } from '../../../../../../convex/_generated/api.js'
import { useConvexAuthReady } from '$lib/client/convex-auth'
import { cloneSavedDrawings } from './clone'
import {
  buildDrawingDefaultsKey,
  getLiveDrawingDefaults,
} from './default-persistence'
import { cloneDrawingDefaults, DEFAULT_DRAWING_DEFAULTS } from './defaults'
import { normalizeDrawingDefaults, normalizeSavedDrawings } from './normalize'
import { buildDrawingStateKey } from './state-key'
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
  const convexAuthReady = useConvexAuthReady()

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

  let localDrawings = $state<Array<SavedDrawing>>([])
  let pendingSave = $state<Array<SavedDrawing> | null>(null)
  let awaitingRemoteKey = $state<string | null>(null)
  let optimisticDefaults = $state.raw<DrawingDefaults | null>(null)
  let pendingDefaults = $state.raw<DrawingDefaults | null>(null)
  let awaitingRemoteDefaultsKey = $state<string | null>(null)
  let flushingSave = false
  let flushingDefaultsSave = false
  let pendingSaveRetryTimer: number | null = null

  function getDrawingsKey(drawings: Array<SavedDrawing>) {
    return buildDrawingStateKey(getData().symbol, drawings)
  }

  const normalizedDrawingsKey = $derived(getDrawingsKey(normalizedDrawings))
  const normalizedDefaultsKey = $derived(
    buildDrawingDefaultsKey(normalizedDefaults),
  )
  const liveDrawings = $derived.by(() => {
    if (pendingSave !== null) {
      return pendingSave
    }

    if (
      awaitingRemoteKey !== null &&
      normalizedDrawingsKey !== awaitingRemoteKey
    ) {
      return localDrawings
    }

    return normalizedDrawings
  })
  const liveDefaults = $derived.by(() =>
    getLiveDrawingDefaults({
      normalizedDefaults,
      normalizedDefaultsKey,
      optimisticDefaults,
      pendingDefaults,
      awaitingRemoteDefaultsKey,
    }),
  )

  $effect(() => {
    if (canAccessDrawings && pendingSave !== null && !flushingSave) {
      void flushPendingSave()
    }
  })

  $effect(() => {
    if (
      canAccessDrawings &&
      pendingDefaults !== null &&
      !flushingDefaultsSave
    ) {
      void flushPendingDefaultsSave()
    }
  })

  $effect(() => {
    if (
      awaitingRemoteDefaultsKey !== null &&
      normalizedDefaultsKey === awaitingRemoteDefaultsKey
    ) {
      awaitingRemoteDefaultsKey = null
      optimisticDefaults = null
    }
  })

  function startPendingSaveRetry() {
    if (pendingSaveRetryTimer !== null) {
      return
    }

    pendingSaveRetryTimer = window.setInterval(() => {
      if (pendingSave === null) {
        stopPendingSaveRetry()
        return
      }

      if (!flushingSave) {
        void flushPendingSave()
      }
    }, 500)
  }

  function stopPendingSaveRetry() {
    if (pendingSaveRetryTimer !== null) {
      window.clearInterval(pendingSaveRetryTimer)
      pendingSaveRetryTimer = null
    }
  }

  async function flushPendingSave() {
    if (!canAccessDrawings || pendingSave === null || flushingSave) {
      if (pendingSave !== null) {
        startPendingSaveRetry()
      }
      return
    }

    flushingSave = true

    try {
      while (canAccessDrawings && pendingSave !== null) {
        const drawingsToSave = cloneSavedDrawings(pendingSave)
        const drawingsKey = getDrawingsKey(drawingsToSave)

        try {
          await convex.mutation(api.userDrawings.saveForSymbol, {
            symbol: getData().symbol,
            drawings: drawingsToSave,
          })
        } catch (error) {
          console.warn('Unable to persist chart drawings to Convex', error)
          startPendingSaveRetry()
          return
        }

        if (
          pendingSave !== null &&
          getDrawingsKey(pendingSave) === drawingsKey
        ) {
          pendingSave = null
        }
      }
    } finally {
      flushingSave = false

      if (pendingSave === null) {
        stopPendingSaveRetry()
      }
    }
  }

  async function saveDrawings(drawings: Array<SavedDrawing>) {
    localDrawings = cloneSavedDrawings(drawings)
    pendingSave = cloneSavedDrawings(drawings)
    awaitingRemoteKey = getDrawingsKey(drawings)

    if (canAccessDrawings) {
      await flushPendingSave()
      return
    }

    startPendingSaveRetry()
  }

  async function flushPendingDefaultsSave() {
    if (
      !canAccessDrawings ||
      pendingDefaults === null ||
      flushingDefaultsSave
    ) {
      return
    }

    flushingDefaultsSave = true

    try {
      while (canAccessDrawings && pendingDefaults !== null) {
        const defaultsToSave = cloneDrawingDefaults(pendingDefaults)
        const defaultsKey = buildDrawingDefaultsKey(defaultsToSave)

        try {
          await convex.mutation(api.userDrawings.saveDefaults, {
            defaults: defaultsToSave,
          })
        } catch (error) {
          pendingDefaults = null
          awaitingRemoteDefaultsKey = null
          optimisticDefaults = null
          console.warn('Unable to persist drawing defaults to Convex', error)
          return
        }

        if (
          pendingDefaults !== null &&
          buildDrawingDefaultsKey(pendingDefaults) === defaultsKey
        ) {
          pendingDefaults = null
        }
      }
    } finally {
      flushingDefaultsSave = false
    }
  }

  async function saveDefaults(defaults: DrawingDefaults) {
    const nextDefaults = cloneDrawingDefaults(defaults)

    optimisticDefaults = nextDefaults
    pendingDefaults = nextDefaults
    awaitingRemoteDefaultsKey = buildDrawingDefaultsKey(nextDefaults)

    if (canAccessDrawings) {
      await flushPendingDefaultsSave()
    }
  }

  const drawings = $derived({
    symbol: getData().symbol,
    drawings: liveDrawings,
  })

  return {
    get defaults() {
      return liveDefaults
    },
    get drawings() {
      return drawings
    },
    saveDefaults,
    saveDrawings,
  }
}

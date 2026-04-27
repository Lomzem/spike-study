import { browser } from '$app/environment'
import { env as publicEnv } from '$env/dynamic/public'
import { useConvexClient, useQuery } from 'convex-svelte'
import { useClerkContext } from 'svelte-clerk'
import { fromStore } from 'svelte/store'
import { api } from '../../../../../../convex/_generated/api.js'
import { useConvexAuthReady } from '$lib/client/convex-auth'
import { cloneDrawingDefaults, DEFAULT_DRAWING_DEFAULTS } from './defaults'
import { normalizeDrawingDefaults, normalizeSavedDrawings } from './normalize'
import { buildDrawingStateKey } from './state-key'
import type {
  DiagonalLineDrawing,
  DrawingDefaults,
  FibRetracementDrawing,
  HorizontalLineDrawing,
  SavedDrawing,
} from './types'

interface DrawingPersistenceData {
  symbol: string
  dbError?: string
}

function cloneDrawingTime(time: SavedDrawing['anchors'][number]['time']) {
  return typeof time === 'object' && time !== null ? { ...time } : time
}

function cloneSavedDrawings(drawings: Array<SavedDrawing>) {
  return drawings.map((drawing) => {
    switch (drawing.type) {
      case 'horizontal-line': {
        const anchors: HorizontalLineDrawing['anchors'] = [
          {
            time: cloneDrawingTime(drawing.anchors[0].time),
            price: drawing.anchors[0].price,
          },
        ]

        return {
          id: drawing.id,
          type: drawing.type,
          anchors,
          color: drawing.color,
          lineWidth: drawing.lineWidth,
          lineStyle: drawing.lineStyle,
          extendLeft: drawing.extendLeft,
          extendRight: drawing.extendRight,
        } satisfies SavedDrawing
      }
      case 'diagonal-line': {
        const anchors: DiagonalLineDrawing['anchors'] = [
          {
            time: cloneDrawingTime(drawing.anchors[0].time),
            price: drawing.anchors[0].price,
          },
          {
            time: cloneDrawingTime(drawing.anchors[1].time),
            price: drawing.anchors[1].price,
          },
        ]

        return {
          id: drawing.id,
          type: drawing.type,
          anchors,
          color: drawing.color,
          lineWidth: drawing.lineWidth,
          lineStyle: drawing.lineStyle,
          extendLeft: drawing.extendLeft,
          extendRight: drawing.extendRight,
        } satisfies SavedDrawing
      }
      case 'fib-retracement': {
        const anchors: FibRetracementDrawing['anchors'] = [
          {
            time: cloneDrawingTime(drawing.anchors[0].time),
            price: drawing.anchors[0].price,
          },
          {
            time: cloneDrawingTime(drawing.anchors[1].time),
            price: drawing.anchors[1].price,
          },
        ]

        return {
          id: drawing.id,
          type: drawing.type,
          anchors,
          color: drawing.color,
          lineWidth: drawing.lineWidth,
          lineStyle: drawing.lineStyle,
          extendLeft: drawing.extendLeft,
          extendRight: drawing.extendRight,
          showPrices: drawing.showPrices,
          showPercentages: drawing.showPercentages,
          levels: drawing.levels.map((level) => ({
            id: level.id,
            value: level.value,
            color: level.color,
            visible: level.visible,
          })),
        } satisfies SavedDrawing
      }
    }
  })
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
  const convexAuthReadyStore = useConvexAuthReady()
  const convexAuthReady = fromStore(convexAuthReadyStore)

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
  let flushingSave = false
  let pendingSaveRetryTimer: number | null = null

  function getDrawingsKey(drawings: Array<SavedDrawing>) {
    return buildDrawingStateKey(getData().symbol, drawings)
  }

  const normalizedDrawingsKey = $derived(getDrawingsKey(normalizedDrawings))
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

  convexAuthReadyStore.subscribe(() => {
    if (pendingSave !== null) {
      void flushPendingSave()
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
        } catch {
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

  async function saveDefaults(defaults: DrawingDefaults) {
    if (!canAccessDrawings) {
      return
    }

    await convex.mutation(api.userDrawings.saveDefaults, {
      defaults,
    })
  }

  const drawings = $derived({
    symbol: getData().symbol,
    drawings: liveDrawings,
  })

  return {
    get defaults() {
      return normalizedDefaults
    },
    get drawings() {
      return drawings
    },
    saveDefaults,
    saveDrawings,
  }
}

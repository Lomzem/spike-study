import { browser } from '$app/environment'
import { createDrawingPersistence } from '../drawings/persistence.svelte'
import type { ChartCandle } from '../chart-types'
import { saveReplaySnapshot } from './replay-persistence'
import { createLocalReplayStorage } from './replay-storage.local'
import {
  advanceReplaySnapshot,
  resetReplaySnapshot,
  restoreReplaySnapshot,
  setReplayPlaying,
  setReplaySpeed,
} from './replay-session'
import { formatReplayClock, getRevealedCandles } from './replay-time'
import {
  applyReplayTradingToRange,
  calculateReplayEquity,
  getReplayRealizedPnl,
  getReplayUnrealizedPnl,
  submitReplayOrder,
} from './replay-trading'
import type {
  ReplayOrderAction,
  ReplayPageData,
  ReplaySnapshot,
  ReplaySpeed,
} from './replay-types'

export function createReplayPageState(getData: () => ReplayPageData) {
  const drawingPersistence = createDrawingPersistence(getData)
  const storage = createLocalReplayStorage()
  function getStorageKey() {
    return {
      symbol: getData().symbol,
      date: getData().date,
    }
  }

  const storageKey = getStorageKey()
  const persistedSnapshot = restoreReplaySnapshot({
    symbol: storageKey.symbol,
    date: storageKey.date,
    candles: getData().candles,
    snapshot: storage.load(storageKey),
  })

  const candles = $derived(getData().candles)
  const availableDates = $derived(getData().availableDates)
  const currentDateIndex = $derived(availableDates.indexOf(getData().date))
  const previousDate = $derived(
    currentDateIndex > 0 ? availableDates[currentDateIndex - 1] : null,
  )
  const nextDate = $derived(
    currentDateIndex >= 0 && currentDateIndex < availableDates.length - 1
      ? availableDates[currentDateIndex + 1]
      : null,
  )
  const drawings = $derived(drawingPersistence.drawings)
  const drawingDefaults = $derived(drawingPersistence.defaults)

  let snapshot = $state.raw<ReplaySnapshot>(persistedSnapshot)
  let activeCandle = $state<ChartCandle | null>(
    getData().candles[persistedSnapshot.revealedCandleIndex] ?? null,
  )
  let orderError = $state<string | null>(null)
  let lastTickMs = 0

  const revealedCandles = $derived(
    getRevealedCandles(candles, snapshot.revealedCandleIndex),
  )
  const currentPrice = $derived(revealedCandles.at(-1)?.close ?? null)
  const simulatedClockLabel = $derived(formatReplayClock(snapshot.currentTime))
  const equity = $derived(calculateReplayEquity(snapshot, currentPrice))
  const unrealizedPnl = $derived(
    getReplayUnrealizedPnl(snapshot.position, currentPrice),
  )
  const realizedPnl = $derived(getReplayRealizedPnl(snapshot))
  const pendingOrder = $derived(snapshot.pendingOrders[0] ?? null)

  $effect(() => {
    if (!browser || !snapshot.isPlaying) {
      return
    }

    lastTickMs = performance.now()

    const intervalId = window.setInterval(() => {
      const now = performance.now()
      const elapsedMs = now - lastTickMs
      lastTickMs = now
      tickReplay(elapsedMs)
    }, 250)

    return () => {
      window.clearInterval(intervalId)
    }
  })

  $effect(() => {
    if (!browser || !snapshot.isPlaying) {
      return
    }

    const intervalId = window.setInterval(() => {
      persistNow()
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  })

  function updateSnapshot(nextSnapshot: ReplaySnapshot, persist = false) {
    snapshot = nextSnapshot
    activeCandle = candles[nextSnapshot.revealedCandleIndex] ?? null

    if (persist) {
      persistNow(nextSnapshot)
    }
  }

  function persistNow(targetSnapshot = snapshot) {
    if (!browser) {
      return
    }

    saveReplaySnapshot(storage, getStorageKey(), targetSnapshot)
  }

  function tickReplay(elapsedMs: number) {
    if (candles.length === 0) {
      return
    }

    const previousSnapshot = snapshot
    const advancedSnapshot = advanceReplaySnapshot(
      previousSnapshot,
      candles,
      elapsedMs,
    )

    if (
      advancedSnapshot.currentTime === previousSnapshot.currentTime &&
      advancedSnapshot.revealedCandleIndex ===
        previousSnapshot.revealedCandleIndex &&
      advancedSnapshot.isPlaying === previousSnapshot.isPlaying
    ) {
      return
    }

    const nextSnapshot = applyReplayTradingToRange(
      advancedSnapshot,
      candles,
      previousSnapshot.revealedCandleIndex,
      advancedSnapshot.revealedCandleIndex,
    )

    updateSnapshot(nextSnapshot)

    if (previousSnapshot.isPlaying && !nextSnapshot.isPlaying) {
      persistNow(nextSnapshot)
    }
  }

  function togglePlayback() {
    orderError = null
    const nextSnapshot = setReplayPlaying(
      snapshot,
      candles,
      !snapshot.isPlaying,
    )
    updateSnapshot(nextSnapshot, true)
  }

  function resetReplay() {
    orderError = null
    storage.clear(getStorageKey())

    const nextSnapshot = resetReplaySnapshot({
      symbol: getData().symbol,
      date: getData().date,
      candles,
    })

    updateSnapshot(nextSnapshot, true)
  }

  function setSpeed(speed: ReplaySpeed) {
    updateSnapshot(setReplaySpeed(snapshot, speed), true)
  }

  function submitOrder(action: ReplayOrderAction, shares = 0) {
    orderError = null

    if (snapshot.revealedCandleIndex >= candles.length - 1) {
      orderError = 'The replay has reached the last candle for this day.'
      return
    }

    const result = submitReplayOrder({
      snapshot,
      action,
      shares,
      submittedAt: snapshot.currentTime,
      referencePrice: currentPrice,
    })

    if (!result.ok) {
      orderError = result.error ?? 'Unable to place the order.'
      return
    }

    updateSnapshot(result.snapshot, true)
  }

  function setActiveCandle(candle: ChartCandle | null) {
    activeCandle = candle ?? revealedCandles.at(-1) ?? null
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      persistNow()
    }
  }

  function handlePageHide() {
    persistNow()
  }

  return {
    get activeCandle() {
      return activeCandle
    },
    get availableDates() {
      return availableDates
    },
    get drawingDefaults() {
      return drawingDefaults
    },
    get drawings() {
      return drawings
    },
    get equity() {
      return equity
    },
    get nextDate() {
      return nextDate
    },
    get orderError() {
      return orderError
    },
    get pendingOrder() {
      return pendingOrder
    },
    get previousDate() {
      return previousDate
    },
    get realizedPnl() {
      return realizedPnl
    },
    get replaySnapshot() {
      return snapshot
    },
    get revealedCandles() {
      return revealedCandles
    },
    get simulatedClockLabel() {
      return simulatedClockLabel
    },
    get unrealizedPnl() {
      return unrealizedPnl
    },
    get currentPrice() {
      return currentPrice
    },
    handlePageHide,
    handleVisibilityChange,
    resetReplay,
    saveDefaults: drawingPersistence.saveDefaults,
    saveDrawings: drawingPersistence.saveDrawings,
    setActiveCandle,
    setSpeed,
    submitOrder,
    togglePlayback,
  }
}

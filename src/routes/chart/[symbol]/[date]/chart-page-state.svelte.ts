import { useConvexClient, useQuery } from 'convex-svelte'
import { useClerkContext } from 'svelte-clerk'
import { fromStore } from 'svelte/store'
import { api } from '../../../../../convex/_generated/api.js'
import { useConvexAuthReady } from '$lib/client/convex-auth'
import { normalizeSavedPriceLines } from './chart-drawings'
import type {
  ChartCandle,
  ChartDrawingState,
  ChartIndicatorState,
  ChartPageData,
} from './chart-types'
import type { SavedPriceLine } from './chart-user-price-lines'

export function createChartPageState(getData: () => ChartPageData) {
  const clerk = useClerkContext()
  const convex = useConvexClient()
  const convexAuthReady = fromStore(useConvexAuthReady())

  let activeCandle = $state<ChartCandle | null>(
    getData().candles.at(-1) ?? null,
  )
  let showSma = $state(false)
  let showEma = $state(false)
  let showVwap = $state(false)

  const savedDrawings = useQuery(api.userDrawings.getForSymbol, () =>
    !getData().dbError &&
    clerk.isLoaded &&
    clerk.auth.userId &&
    convexAuthReady.current
      ? { symbol: getData().symbol }
      : 'skip',
  )

  const normalizedDrawings = $derived(
    normalizeSavedPriceLines(savedDrawings.data),
  )
  const drawings = $derived<ChartDrawingState | null>(
    normalizedDrawings
      ? { symbol: getData().symbol, priceLines: normalizedDrawings }
      : null,
  )
  const availableDates = $derived(getData().availableDates)
  const indicators = $derived<ChartIndicatorState>({
    showSma,
    showEma,
    showVwap,
  })

  const currentDateIndex = $derived(availableDates.indexOf(getData().date))
  const previousDate = $derived(
    currentDateIndex > 0 ? availableDates[currentDateIndex - 1] : null,
  )
  const nextDate = $derived(
    currentDateIndex >= 0 && currentDateIndex < availableDates.length - 1
      ? availableDates[currentDateIndex + 1]
      : null,
  )

  async function saveDrawings(priceLines: Array<SavedPriceLine>) {
    await convex.mutation(api.userDrawings.saveForSymbol, {
      symbol: getData().symbol,
      priceLines,
    })
  }

  function setActiveCandle(candle: ChartCandle | null) {
    activeCandle = candle
  }

  return {
    get activeCandle() {
      return activeCandle
    },
    get availableDates() {
      return availableDates
    },
    get drawings() {
      return drawings
    },
    get indicators() {
      return indicators
    },
    get nextDate() {
      return nextDate
    },
    get previousDate() {
      return previousDate
    },
    saveDrawings,
    setActiveCandle,
    get showEma() {
      return showEma
    },
    set showEma(value: boolean) {
      showEma = value
    },
    get showSma() {
      return showSma
    },
    set showSma(value: boolean) {
      showSma = value
    },
    get showVwap() {
      return showVwap
    },
    set showVwap(value: boolean) {
      showVwap = value
    },
  }
}

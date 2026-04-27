import { createDrawingPersistence } from './drawings/persistence.svelte'
import type {
  ChartCandle,
  ChartIndicatorState,
  ChartPageData,
} from './chart-types'

export function createChartPageState(getData: () => ChartPageData) {
  const drawingPersistence = createDrawingPersistence(getData)
  const candles = $derived(getData().candles)

  let activeCandle = $derived<ChartCandle | null>(candles.at(-1) ?? null)
  let showSma = $state(false)
  let showEma = $state(false)
  let showVwap = $state(false)
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
      return drawingPersistence.drawings
    },
    get drawingDefaults() {
      return drawingPersistence.defaults
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
    saveDefaults: drawingPersistence.saveDefaults,
    saveDrawings: drawingPersistence.saveDrawings,
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

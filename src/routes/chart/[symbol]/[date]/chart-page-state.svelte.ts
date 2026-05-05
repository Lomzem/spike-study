import { createDrawingPersistence } from './drawings/persistence.svelte'
import type { ChartCandle, ChartPageData } from './chart-types'

export function createChartPageState(getData: () => ChartPageData) {
  const drawingPersistence = createDrawingPersistence(getData)
  const candles = $derived(getData().candles)
  const drawings = $derived(drawingPersistence.drawings)
  const drawingDefaults = $derived(drawingPersistence.defaults)

  let activeCandle = $derived<ChartCandle | null>(candles.at(-1) ?? null)
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
    get drawingDefaults() {
      return drawingDefaults
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
  }
}

import type { Attachment } from 'svelte/attachments'
import { ChartController } from '../chart-controller'
import type {
  ChartCandle,
  ChartDrawingState,
  ChartIndicatorState,
} from '../chart-types'
import type { SavedPriceLine } from '../chart-drawing-types'

interface ChartCanvasState {
  candles: Array<ChartCandle>
  indicators: ChartIndicatorState
  drawings: ChartDrawingState | null
  onDrawingsChange?: (priceLines: Array<SavedPriceLine>) => void
  onActiveCandleChange?: (candle: ChartCandle | null) => void
}

export function attachChartCanvas(
  getState: () => ChartCanvasState,
): Attachment<HTMLDivElement> {
  return (element) => {
    const initialState = getState()
    const state = $derived.by(getState)
    const controller = new ChartController({
      element,
      candles: initialState.candles,
      indicators: initialState.indicators,
      drawings: initialState.drawings ?? undefined,
      onDrawingsChange: initialState.onDrawingsChange,
      onActiveCandleChange: initialState.onActiveCandleChange,
    })

    $effect(() => {
      controller.candles = state.candles
    })

    $effect(() => {
      controller.indicators = state.indicators
    })

    $effect(() => {
      controller.drawings = state.drawings
    })

    return () => {
      controller.destroy()
    }
  }
}

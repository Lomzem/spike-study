<script lang="ts">
  import { attachChartCanvas } from './chart-canvas-attachment.svelte.js'
  import type {
    ChartCandle,
    ChartDrawingState,
    ChartIndicatorState,
  } from '../chart-types'
  import type { SavedPriceLine } from '../chart-drawing-types'

  let {
    candles,
    indicators,
    drawings,
    onDrawingsChange,
    onActiveCandleChange,
  }: {
    candles: Array<ChartCandle>
    indicators: ChartIndicatorState
    drawings: ChartDrawingState | null
    onDrawingsChange?: (priceLines: Array<SavedPriceLine>) => void
    onActiveCandleChange?: (candle: ChartCandle | null) => void
  } = $props()
</script>

<div
  class="min-h-0 flex-1 self-stretch"
  {@attach attachChartCanvas(() => ({
    candles,
    indicators,
    drawings,
    onDrawingsChange,
    onActiveCandleChange,
  }))}
></div>

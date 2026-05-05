<script lang="ts">
  import type { Logical, LogicalRange } from 'lightweight-charts'
  import ChartCanvas from '../../components/chart-canvas.svelte'
  import type { ChartCandle, ChartDrawingState } from '../../chart-types'
  import type { DrawingDefaults, SavedDrawing } from '../../drawings/types'

  let {
    symbol,
    candles,
    drawings,
    drawingDefaults,
    onDefaultsChange,
    onDrawingsChange,
    onActiveCandleChange,
  }: {
    symbol: string
    candles: Array<ChartCandle>
    drawings: ChartDrawingState | null
    drawingDefaults: DrawingDefaults
    onDefaultsChange?: (defaults: DrawingDefaults) => void | Promise<void>
    onDrawingsChange?: (drawings: Array<SavedDrawing>) => void | Promise<void>
    onActiveCandleChange?: (candle: ChartCandle | null) => void
  } = $props()

  let visibleLogicalRange = $state<LogicalRange | null>(null)
  let lastRenderedCandleCount = $state(0)

  const chartKey = $derived(candles.at(-1)?.time ?? 'empty')
  const initialVisibleLogicalRange = $derived.by(() =>
    preserveVisibleLogicalRangeOnRemount({
      currentRange: visibleLogicalRange,
      previousCandleCount: lastRenderedCandleCount,
      nextCandleCount: candles.length,
    }),
  )

  $effect(() => {
    if (lastRenderedCandleCount !== candles.length) {
      lastRenderedCandleCount = candles.length
    }
  })

  function handleVisibleLogicalRangeChange(range: LogicalRange | null) {
    visibleLogicalRange = range
  }

  function preserveVisibleLogicalRangeOnRemount({
    currentRange,
    previousCandleCount,
    nextCandleCount,
  }: {
    currentRange: LogicalRange | null
    previousCandleCount: number
    nextCandleCount: number
  }) {
    if (!currentRange || previousCandleCount === 0 || nextCandleCount === 0) {
      return currentRange
    }

    const candleGrowth = nextCandleCount - previousCandleCount
    if (candleGrowth <= 0) {
      return currentRange
    }

    const previousLastIndex = previousCandleCount - 1
    const rightOffset = previousLastIndex - currentRange.to

    if (rightOffset > 1) {
      return currentRange
    }

    return {
      from: (currentRange.from + candleGrowth) as Logical,
      to: (currentRange.to + candleGrowth) as Logical,
    } satisfies LogicalRange
  }
</script>

{#key chartKey}
  <ChartCanvas
    {symbol}
    {candles}
    initialVisibleLogicalRange={initialVisibleLogicalRange}
    indicators={{ showSma: false, showEma: false, showVwap: false }}
    {drawings}
    {drawingDefaults}
    {onDefaultsChange}
    {onDrawingsChange}
    {onActiveCandleChange}
    onVisibleLogicalRangeChange={handleVisibleLogicalRangeChange}
  />
{/key}

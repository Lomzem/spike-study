<script lang="ts">
  import { onMount } from 'svelte'
  import { ChartController } from '../chart-controller'
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

  let element: HTMLDivElement
  let controller: ChartController | null = null

  onMount(() => {
    controller = new ChartController({
      element,
      candles,
      indicators,
      drawings: drawings ?? undefined,
      onDrawingsChange,
      onActiveCandleChange,
    })

    return () => {
      controller?.destroy()
      controller = null
    }
  })

  $effect(() => {
    if (!controller) {
      return
    }

    controller.candles = candles
  })

  $effect(() => {
    if (!controller) {
      return
    }

    controller.indicators = indicators
  })

  $effect(() => {
    if (!controller) {
      return
    }

    controller.drawings = drawings
  })
</script>

<div bind:this={element} class="min-h-0 flex-1 self-stretch"></div>

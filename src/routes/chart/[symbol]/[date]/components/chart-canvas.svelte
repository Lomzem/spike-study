<script lang="ts">
  import { onMount } from 'svelte'
  import {
    ChartController,
    type ChartControllerCandle,
    type ChartDrawingState,
    type ChartIndicatorState,
  } from '$lib/client/chart/chart-controller'
  import type { SavedPriceLine } from '$lib/client/chart/user-price-lines'

  let {
    candles,
    indicators,
    drawings,
    onDrawingsChange,
    onActiveCandleChange,
  }: {
    candles: Array<ChartControllerCandle>
    indicators: ChartIndicatorState
    drawings: ChartDrawingState | null
    onDrawingsChange?: (priceLines: Array<SavedPriceLine>) => void
    onActiveCandleChange?: (candle: ChartControllerCandle | null) => void
  } = $props()

  let container = $state<HTMLElement | null>(null)
  let controller = $state<ChartController | null>(null)

  onMount(() => {
    if (!container) {
      return
    }

    controller = new ChartController({
      element: container,
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
    controller?.setData(candles)
  })

  $effect(() => {
    controller?.setIndicators(indicators)
  })

  $effect(() => {
    controller?.setDrawings(drawings)
  })
</script>

<div bind:this={container} class="min-h-0 flex-1 self-stretch"></div>

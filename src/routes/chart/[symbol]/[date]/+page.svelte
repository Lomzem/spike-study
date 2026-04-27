<script lang="ts">
  import type { PageProps } from './$types'
  import ChartCanvas from './components/chart-canvas.svelte'
  import ChartDbErrorState from './components/chart-db-error-state.svelte'
  import ChartEmptyState from './components/chart-empty-state.svelte'
  import ChartHeader from './components/chart-header.svelte'
  import { createChartPageState } from './chart-page-state.svelte.js'

  let { data }: PageProps = $props()
  const chartPage = createChartPageState(() => data)
</script>

<svelte:head>
  <title>{data.symbol} {data.date}</title>
</svelte:head>

<main
  class="relative flex h-[calc(100dvh-3rem)] flex-col overflow-hidden"
  style="background: #1a1610; --forest-gold: #c4a46a; --forest-green: #5a8a5c; --forest-amber: #c4783a; --forest-bark: #2a2318; --forest-moss: #8b7e6a; --forest-canopy: #1a1610; --forest-mist: rgba(139, 126, 106, 0.15); --forest-cream: #e8dcc8;"
>
  <div
    class="pointer-events-none absolute inset-0 opacity-[0.03]"
    style="background-image: url('data:image/svg+xml,<svg viewBox=&quot;0 0 256 256&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><filter id=&quot;n&quot;><feTurbulence type=&quot;fractalNoise&quot; baseFrequency=&quot;0.9&quot; numOctaves=&quot;4&quot; stitchTiles=&quot;stitch&quot;/></filter><rect width=&quot;100%25&quot; height=&quot;100%25&quot; filter=&quot;url(%23n)&quot;/></svg>'); background-repeat: repeat; background-size: 256px 256px;"
  ></div>

  <ChartHeader
    symbol={data.symbol}
    date={data.date}
    availableDates={chartPage.availableDates}
    activeCandle={chartPage.activeCandle}
    bind:showSma={chartPage.showSma}
    bind:showEma={chartPage.showEma}
    bind:showVwap={chartPage.showVwap}
  />

  {#if data.dbError}
    <ChartDbErrorState message={data.dbError} />
  {:else if data.candles.length === 0}
    <ChartEmptyState
      symbol={data.symbol}
      date={data.date}
      previousDate={chartPage.previousDate}
      nextDate={chartPage.nextDate}
    />
  {:else}
    <section
      class="relative flex min-h-0 flex-1 flex-col bg-background/65 backdrop-blur-sm"
    >
      <ChartCanvas
        candles={data.candles}
        indicators={chartPage.indicators}
        drawings={chartPage.drawings}
        drawingDefaults={chartPage.drawingDefaults}
        onDefaultsChange={chartPage.saveDefaults}
        onDrawingsChange={chartPage.saveDrawings}
        onActiveCandleChange={chartPage.setActiveCandle}
      />
    </section>
  {/if}

  <div
    class="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-primary/70 to-transparent"
  ></div>
</main>

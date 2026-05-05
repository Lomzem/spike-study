<script lang="ts">
  import type { PageProps } from './$types'
  import ChartDbErrorState from '../components/chart-db-error-state.svelte'
  import ChartEmptyState from '../components/chart-empty-state.svelte'
  import ReplayAccountSummary from './components/replay-account-summary.svelte'
  import ReplayChartCanvas from './components/replay-chart-canvas.svelte'
  import ReplayHeader from './components/replay-header.svelte'
  import ReplayOrderTicket from './components/replay-order-ticket.svelte'
  import ReplayTradeLog from './components/replay-trade-log.svelte'
  import { createReplayPageState } from './replay-page-state.svelte.js'

  let { data }: PageProps = $props()
  const replayPage = createReplayPageState(() => data)
</script>

<svelte:head>
  <title>{data.symbol} {data.date} Replay</title>
</svelte:head>

<svelte:document onvisibilitychange={replayPage.handleVisibilityChange} />
<svelte:window onpagehide={replayPage.handlePageHide} />

<main
  class="relative flex h-[calc(100dvh-3rem)] flex-col overflow-hidden"
  style="background: #1a1610; --forest-gold: #c4a46a; --forest-green: #5a8a5c; --forest-amber: #c4783a; --forest-bark: #2a2318; --forest-moss: #8b7e6a; --forest-canopy: #1a1610; --forest-mist: rgba(139, 126, 106, 0.15); --forest-cream: #e8dcc8;"
>
  <div
    class="pointer-events-none absolute inset-0 opacity-[0.03]"
    style="background-image: url('data:image/svg+xml,<svg viewBox=&quot;0 0 256 256&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><filter id=&quot;n&quot;><feTurbulence type=&quot;fractalNoise&quot; baseFrequency=&quot;0.9&quot; numOctaves=&quot;4&quot; stitchTiles=&quot;stitch&quot;/></filter><rect width=&quot;100%25&quot; height=&quot;100%25&quot; filter=&quot;url(%23n)&quot;/></svg>'); background-repeat: repeat; background-size: 256px 256px;"
  ></div>

  <ReplayHeader
    symbol={data.symbol}
    date={data.date}
    activeCandle={replayPage.activeCandle}
    simulatedClockLabel={replayPage.simulatedClockLabel}
    isPlaying={replayPage.replaySnapshot.isPlaying}
    speed={replayPage.replaySnapshot.speed}
    onTogglePlayback={replayPage.togglePlayback}
    onReset={replayPage.resetReplay}
    onSetSpeed={replayPage.setSpeed}
  />

  {#if data.dbError}
    <ChartDbErrorState message={data.dbError} />
  {:else if data.candles.length === 0}
    <ChartEmptyState
      symbol={data.symbol}
      date={data.date}
      previousDate={replayPage.previousDate}
      nextDate={replayPage.nextDate}
    />
  {:else}
    <section class="grid min-h-0 flex-1 gap-4 overflow-hidden bg-background/65 p-4 backdrop-blur-sm lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div class="flex min-h-0 overflow-hidden rounded-xl border border-border/70 bg-background/45">
        <ReplayChartCanvas
          symbol={data.symbol}
          candles={replayPage.revealedCandles}
          drawings={replayPage.drawings}
          drawingDefaults={replayPage.drawingDefaults}
          onDefaultsChange={replayPage.saveDefaults}
          onDrawingsChange={replayPage.saveDrawings}
          onActiveCandleChange={replayPage.setActiveCandle}
        />
      </div>

      <div class="min-h-0 space-y-4 overflow-y-auto pr-1">
        <ReplayAccountSummary
          cash={replayPage.replaySnapshot.cash}
          equity={replayPage.equity}
          realizedPnl={replayPage.realizedPnl}
          unrealizedPnl={replayPage.unrealizedPnl}
          position={replayPage.replaySnapshot.position}
          pendingOrder={replayPage.pendingOrder}
        />

        <ReplayOrderTicket
          currentPrice={replayPage.currentPrice}
          position={replayPage.replaySnapshot.position}
          pendingOrder={replayPage.pendingOrder}
          orderError={replayPage.orderError}
          onBuy={(shares) => replayPage.submitOrder('buy', shares)}
          onSellShort={(shares) => replayPage.submitOrder('sell-short', shares)}
          onClose={() => replayPage.submitOrder('close')}
        />

        <ReplayTradeLog
          fills={replayPage.replaySnapshot.fills}
          closedTrades={replayPage.replaySnapshot.closedTrades}
        />
      </div>
    </section>
  {/if}

  <div class="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-primary/70 to-transparent"></div>
</main>

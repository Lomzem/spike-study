<script lang="ts">
  import type { PageProps } from './$types'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { useClerkContext } from 'svelte-clerk'
  import { Button } from '$lib/components/ui/button/index.js'
  import { api } from '../../../../../convex/_generated/api.js'
  import { convexAuthReady } from '$lib/client/convex-auth'
  import type { SavedPriceLine } from '$lib/client/chart/user-price-lines'
  import ChartCanvas from './components/chart-canvas.svelte'
  import ChartEmptyState from './components/chart-empty-state.svelte'
  import ChartHeader from './components/chart-header.svelte'
  import { normalizeSavedPriceLines } from './chart-drawings'
  import type { ChartCandle } from './chart-types'

  let { data }: PageProps = $props()
  const clerk = useClerkContext()
  const convex = useConvexClient()
  let activeCandle = $state<ChartCandle | null>(null)
  let showSma = $state(false)
  let showEma = $state(false)
  let showVwap = $state(false)
  const savedDrawings = useQuery(
    api.userDrawings.getForSymbol,
    () =>
      !data.dbError && clerk.isLoaded && clerk.auth.userId && $convexAuthReady
        ? { symbol: data.symbol }
        : 'skip',
  )
  const normalizedDrawings = $derived(
    normalizeSavedPriceLines(savedDrawings.data),
  )
  const availableDates = $derived(data.availableDates as Array<string>)

  const currentDateIndex = $derived(availableDates.indexOf(data.date))
  const previousDate = $derived(
    currentDateIndex > 0 ? availableDates[currentDateIndex - 1] : null,
  )
  const nextDate = $derived(
    currentDateIndex >= 0 && currentDateIndex < availableDates.length - 1
      ? availableDates[currentDateIndex + 1]
      : null,
  )

  $effect(() => {
    activeCandle = data.candles.at(-1) ?? null
  })

  async function handleDrawingsChange(priceLines: Array<SavedPriceLine>) {
    await convex.mutation(api.userDrawings.saveForSymbol, {
      symbol: data.symbol,
      priceLines,
    })
  }
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
      {availableDates}
      {activeCandle}
      bind:showSma
      bind:showEma
      bind:showVwap
    />

  {#if data.dbError}
    <div class="flex flex-1 items-center justify-center px-6 py-10">
      <section class="w-full max-w-xl rounded-2xl border border-border/70 bg-card/80 p-8 shadow-sm backdrop-blur-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Database Setup
        </p>
        <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          Chart is waiting for a database connection
        </h2>
        <p class="mt-3 text-sm leading-6 text-muted-foreground">
          {data.dbError}. Set `DATABASE_URL` or `TURSO_DATABASE_URL` and reload the app.
        </p>
        <div class="mt-6">
          <Button href="/scanner" variant="outline">Back to scanner</Button>
        </div>
      </section>
    </div>
  {:else if data.candles.length === 0}
    <ChartEmptyState
      symbol={data.symbol}
      date={data.date}
      previousDate={previousDate}
      nextDate={nextDate}
    />
  {:else}
    <section class="relative flex min-h-0 flex-1 flex-col bg-background/65 backdrop-blur-sm">
      <ChartCanvas
        candles={data.candles}
        indicators={{ showSma, showEma, showVwap }}
        drawings={normalizedDrawings ? { symbol: data.symbol, priceLines: normalizedDrawings } : null}
        onDrawingsChange={handleDrawingsChange}
        onActiveCandleChange={(candle) => (activeCandle = candle)}
      />
    </section>
  {/if}

  <div class="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-primary/70 to-transparent"></div>
</main>

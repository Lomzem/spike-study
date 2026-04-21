<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { buildChartDateHref } from '../chart-navigation'

  let {
    symbol,
    date,
    previousDate,
    nextDate,
  }: {
    symbol: string
    date: string
    previousDate: string | null
    nextDate: string | null
  } = $props()
</script>

<div class="flex flex-1 items-center justify-center px-6 py-10">
  <section class="w-full max-w-md rounded-2xl border border-border/70 bg-card/80 p-8 shadow-sm backdrop-blur-sm">
    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">No Data</p>
    <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">No intraday rows for {symbol}</h2>
    <p class="mt-3 text-sm leading-6 text-muted-foreground">No intraday data exists for {date}. Try a nearby date with available candles.</p>

    <div class="mt-6 flex flex-wrap gap-2">
      {#if previousDate}
        <Button href={buildChartDateHref(symbol, previousDate)} variant="outline">
          {previousDate}
        </Button>
      {/if}
      {#if nextDate}
        <Button href={buildChartDateHref(symbol, nextDate)} variant="outline">
          {nextDate}
        </Button>
      {/if}
    </div>
  </section>
</div>

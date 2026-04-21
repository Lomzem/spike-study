<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'

  let {
    symbol,
    date,
    availableDates,
    previousDate,
    nextDate,
  }: {
    symbol: string
    date: string
    availableDates: Array<string>
    previousDate: string | null
    nextDate: string | null
  } = $props()

  let dateForm = $state<HTMLFormElement | null>(null)

  function buildChartHref(nextDate: string) {
    return `/chart/${encodeURIComponent(symbol)}/${nextDate}`
  }

  function submitDateForm() {
    dateForm?.requestSubmit()
  }
</script>

<header class="flex flex-wrap items-center gap-3 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur-sm">
  <div class="mr-2 flex items-baseline gap-3">
    <h1 class="text-2xl font-semibold tracking-tight text-primary">{symbol}</h1>
    <span class="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Chart</span>
  </div>

  <div class="flex items-center gap-2">
    <Button href={previousDate ? buildChartHref(previousDate) : undefined} variant="outline" size="sm" aria-disabled={!previousDate} class={!previousDate ? 'pointer-events-none opacity-40' : ''}>
      Prev
    </Button>

    <form method="GET" action="." class="flex items-center gap-2" bind:this={dateForm}>
      <label class="sr-only" for="chart-date-select">Chart date</label>
      <select
        id="chart-date-select"
        name="selectedDate"
        class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onchange={() => submitDateForm()}
      >
        {#each availableDates as availableDate (availableDate)}
          <option value={availableDate} selected={availableDate === date}>{availableDate}</option>
        {/each}
      </select>
    </form>

    <Button href={nextDate ? buildChartHref(nextDate) : undefined} variant="outline" size="sm" aria-disabled={!nextDate} class={!nextDate ? 'pointer-events-none opacity-40' : ''}>
      Next
    </Button>
  </div>
</header>

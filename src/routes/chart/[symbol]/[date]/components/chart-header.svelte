<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import ChartDatePicker from './chart-date-picker.svelte'
  import { formatPrice, formatVolume } from '../chart-formatters'
  import type { ChartCandle } from '../chart-types'

  let {
    symbol,
    date,
    availableDates,
    activeCandle,
    showSma,
    showEma,
    showVwap,
    onToggleSma,
    onToggleEma,
    onToggleVwap,
  }: {
    symbol: string
    date: string
    availableDates: Array<string>
    activeCandle: ChartCandle | null
    showSma: boolean
    showEma: boolean
    showVwap: boolean
    onToggleSma?: () => void
    onToggleEma?: () => void
    onToggleVwap?: () => void
  } = $props()

  const replayHref = $derived(
    `/chart/${encodeURIComponent(symbol)}/${encodeURIComponent(date)}/replay`,
  )

</script>

<header class="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur-sm">
  <div class="mr-2 flex items-center gap-3">
    <h1 class="text-2xl font-semibold tracking-tight text-primary">{symbol}</h1>
    <ChartDatePicker {symbol} {date} {availableDates} />
  </div>

  <div class="flex min-w-[20rem] flex-1 flex-wrap items-center gap-x-4 gap-y-2 text-sm">
    {#each [
      ['O', formatPrice(activeCandle?.open)],
      ['H', formatPrice(activeCandle?.high)],
      ['L', formatPrice(activeCandle?.low)],
      ['C', formatPrice(activeCandle?.close)],
      ['Vol', formatVolume(activeCandle?.volume)],
    ] as [label, value] (label)}
      <div class="flex items-center gap-1.5">
        <span class="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        <span class="font-mono tabular-nums text-foreground">{value}</span>
      </div>
    {/each}
  </div>

  <div class="ml-auto flex flex-wrap items-center gap-2">
    <Button href={replayHref} variant="outline" size="sm">Replay</Button>

    <Popover.Root>
      <Popover.Trigger>
        {#snippet child({ props })}
          <Button variant="outline" size="sm" {...props}>Indicators</Button>
        {/snippet}
      </Popover.Trigger>

      <Popover.Content class="w-44 p-2" align="end">
        <div class="space-y-1">
          <Button
            type="button"
            variant={showSma ? 'default' : 'outline'}
            size="sm"
            class="w-full justify-start"
            aria-pressed={showSma}
            aria-label="Toggle SMA 9 indicator"
            onclick={onToggleSma}
          >
            SMA 9
          </Button>

          <Button
            type="button"
            variant={showEma ? 'default' : 'outline'}
            size="sm"
            class="w-full justify-start"
            aria-pressed={showEma}
            aria-label="Toggle EMA 9 indicator"
            onclick={onToggleEma}
          >
            EMA 9
          </Button>

          <Button
            type="button"
            variant={showVwap ? 'default' : 'outline'}
            size="sm"
            class="w-full justify-start"
            aria-pressed={showVwap}
            aria-label="Toggle VWAP indicator"
            onclick={onToggleVwap}
          >
            VWAP
          </Button>
        </div>
      </Popover.Content>
    </Popover.Root>
  </div>
</header>

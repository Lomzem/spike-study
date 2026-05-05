<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { formatPrice, formatVolume } from '../../chart-formatters'
  import type { ChartCandle } from '../../chart-types'
  import { REPLAY_SPEEDS, type ReplaySpeed } from '../replay-types'

  let {
    symbol,
    date,
    activeCandle,
    simulatedClockLabel,
    isPlaying,
    speed,
    onTogglePlayback,
    onReset,
    onSetSpeed,
  }: {
    symbol: string
    date: string
    activeCandle: ChartCandle | null
    simulatedClockLabel: string
    isPlaying: boolean
    speed: ReplaySpeed
    onTogglePlayback?: () => void
    onReset?: () => void
    onSetSpeed?: (speed: ReplaySpeed) => void
  } = $props()

  const chartHref = $derived(
    `/chart/${encodeURIComponent(symbol)}/${encodeURIComponent(date)}`,
  )
</script>

<header class="flex flex-wrap items-center gap-3 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur-sm">
  <div class="mr-3 flex items-center gap-3">
    <div>
      <div class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest-gold)]">
        Replay Mode
      </div>
      <h1 class="text-2xl font-semibold tracking-tight text-primary">{symbol}</h1>
    </div>

    <div class="rounded-md border border-border/70 bg-background/70 px-3 py-2 text-sm">
      <div class="text-xs uppercase tracking-[0.16em] text-muted-foreground">Sim Time</div>
      <div class="font-mono text-base tabular-nums text-foreground">{simulatedClockLabel} ET</div>
    </div>
  </div>

  <div class="flex min-w-[18rem] flex-1 flex-wrap items-center gap-x-4 gap-y-2 text-sm">
    {#each [
      ['Date', date],
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
    {#each REPLAY_SPEEDS as speedOption (speedOption)}
      <Button
        type="button"
        size="sm"
        variant={speed === speedOption ? 'default' : 'outline'}
        onclick={() => onSetSpeed?.(speedOption)}
      >
        {speedOption}x
      </Button>
    {/each}

    <Button type="button" size="sm" onclick={onTogglePlayback}>
      {isPlaying ? 'Pause' : 'Play'}
    </Button>
    <Button type="button" size="sm" variant="outline" onclick={onReset}>Reset</Button>
    <Button href={chartHref} size="sm" variant="outline">Back to Chart</Button>
  </div>
</header>

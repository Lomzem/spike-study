<script lang="ts">
  import { formatPrice, formatVolume } from '../chart-formatters'
  import type { ChartCandle } from '../chart-types'

  let {
    activeCandle,
  }: {
    activeCandle: ChartCandle | null
  } = $props()
</script>

<div class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/70 px-4 py-3 text-sm">
  {#each [
    ['O', formatPrice(activeCandle?.open)],
    ['H', formatPrice(activeCandle?.high)],
    ['L', formatPrice(activeCandle?.low)],
    ['C', formatPrice(activeCandle?.close)],
  ] as [label, value] (`${label}-${value}`)}
    <div class="flex items-center gap-1.5">
      <span class="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <span class="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  {/each}

  <div class="h-4 w-px bg-border/70"></div>

  <div class="flex items-center gap-1.5">
    <span class="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Vol</span>
    <span class="font-mono tabular-nums text-foreground">{formatVolume(activeCandle?.volume)}</span>
  </div>
</div>

<script lang="ts">
  import ChevronLeft from '@lucide/svelte/icons/chevron-left'
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import { Button } from '$lib/components/ui/button/index.js'

  let {
    startRow,
    endRow,
    totalCount,
    page,
    totalPages,
    previousHref,
    nextHref,
  }: {
    startRow: number
    endRow: number
    totalCount: number
    page: number
    totalPages: number
    previousHref: string
    nextHref: string
  } = $props()

  const countFormatter = new Intl.NumberFormat('en-US')
  const previousDisabled = $derived(page <= 1)
  const nextDisabled = $derived(page >= totalPages || totalCount === 0)
</script>

<section class="flex shrink-0 items-center justify-between border-b border-border/70 bg-card/70 px-5 py-3 backdrop-blur-sm">
  <div class="flex items-baseline gap-3">
    <span class="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      Results
    </span>
    {#if totalCount > 0}
      <span class="text-xs tabular-nums text-foreground">{countFormatter.format(totalCount)}</span>
      <span class="text-[0.6875rem] text-muted-foreground">showing {startRow}-{endRow}</span>
    {/if}
  </div>

  <div class="flex items-center gap-3">
    {#if totalCount > 0}
      <span class="text-[0.6875rem] tabular-nums text-muted-foreground">{page}/{totalPages}</span>
    {/if}
    <div class="flex items-center gap-1">
      <Button
        href={previousHref}
        variant="outline"
        size="icon-sm"
        aria-disabled={previousDisabled}
        class={previousDisabled ? 'pointer-events-none opacity-40' : ''}
      >
        <ChevronLeft size={14} />
      </Button>
      <Button
        href={nextHref}
        variant="outline"
        size="icon-sm"
        aria-disabled={nextDisabled}
        class={nextDisabled ? 'pointer-events-none opacity-40' : ''}
      >
        <ChevronRight size={14} />
      </Button>
    </div>
  </div>
</section>

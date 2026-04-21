<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'

  let {
    showSma = $bindable(false),
    showEma = $bindable(false),
    showVwap = $bindable(false),
  }: {
    showSma: boolean
    showEma: boolean
    showVwap: boolean
  } = $props()
</script>

<div class="flex flex-wrap items-center gap-2 border-b border-border/70 px-4 py-3">
  <span class="mr-1 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
    Indicators
  </span>

  <Button
    type="button"
    variant={showSma ? 'default' : 'outline'}
    size="sm"
    onclick={() => (showSma = !showSma)}
  >
    SMA 9
  </Button>

  <Button
    type="button"
    variant={showEma ? 'default' : 'outline'}
    size="sm"
    onclick={() => (showEma = !showEma)}
  >
    EMA 9
  </Button>

  <Button
    type="button"
    variant={showVwap ? 'default' : 'outline'}
    size="sm"
    onclick={() => (showVwap = !showVwap)}
  >
    VWAP
  </Button>
</div>

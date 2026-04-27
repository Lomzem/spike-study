<script lang="ts">
  let {
    hasScanned,
  }: {
    hasScanned: boolean
  } = $props()
</script>

<div class="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
  <div class="h-px w-16 bg-border"></div>
  <p class="max-w-sm text-sm text-muted-foreground">
    {#if hasScanned}
      No rows match the current scan.
    {:else}
      Set your filters and run a scan to explore historical setups.
    {/if}
  </p>
  <div class="h-px w-16 bg-border"></div>
</div>

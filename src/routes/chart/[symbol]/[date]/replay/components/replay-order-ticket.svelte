<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { formatCurrency } from '../replay-formatters'
  import type { ReplayPendingOrder, ReplayPosition } from '../replay-types'

  let {
    currentPrice,
    position,
    pendingOrder,
    orderError,
    onBuy,
    onSellShort,
    onClose,
  }: {
    currentPrice: number | null
    position: ReplayPosition | null
    pendingOrder: ReplayPendingOrder | null
    orderError: string | null
    onBuy?: (shares: number) => void
    onSellShort?: (shares: number) => void
    onClose?: () => void
  } = $props()

  let shareSize = $state('100')
  const hasPendingOrder = $derived(pendingOrder !== null)

  function submitBuy() {
    onBuy?.(Number(shareSize))
  }

  function submitSellShort() {
    onSellShort?.(Number(shareSize))
  }
</script>

<Card class="border-border/70 bg-background/70 shadow-sm backdrop-blur-sm">
  <CardHeader class="pb-3">
    <CardTitle class="text-base">Order Ticket</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <div class="rounded-md border border-border/70 bg-background/60 p-3 text-sm">
      <div class="text-xs uppercase tracking-[0.16em] text-muted-foreground">Last Visible Price</div>
      <div class="mt-1 font-mono text-lg tabular-nums text-foreground">{formatCurrency(currentPrice)}</div>
    </div>

    <div class="space-y-2">
      <label class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" for="replay-share-size">
        Share Size
      </label>
      <Input id="replay-share-size" type="number" min="1" step="1" bind:value={shareSize} />
    </div>

    <div class="grid grid-cols-2 gap-2">
      <Button type="button" disabled={hasPendingOrder || position?.side === 'short'} onclick={submitBuy}>
        Buy Market
      </Button>
      <Button type="button" variant="outline" disabled={hasPendingOrder || position?.side === 'long'} onclick={submitSellShort}>
        Sell Short
      </Button>
      <Button
        type="button"
        variant="secondary"
        class="col-span-2"
        disabled={hasPendingOrder || !position}
        onclick={onClose}
      >
        Close Position
      </Button>
    </div>

    {#if hasPendingOrder}
      <p class="text-sm text-muted-foreground">
        Pending orders fill on the next revealed minute open.
      </p>
    {/if}

    {#if orderError}
      <div class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {orderError}
      </div>
    {/if}
  </CardContent>
</Card>

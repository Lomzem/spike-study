<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card/index.js'
  import { formatSignedCurrency, formatCurrency } from '../replay-formatters'
  import type { ReplayPendingOrder, ReplayPosition } from '../replay-types'

  let {
    cash,
    equity,
    realizedPnl,
    unrealizedPnl,
    position,
    pendingOrder,
  }: {
    cash: number
    equity: number
    realizedPnl: number
    unrealizedPnl: number
    position: ReplayPosition | null
    pendingOrder: ReplayPendingOrder | null
  } = $props()
</script>

<Card class="border-border/70 bg-background/70 shadow-sm backdrop-blur-sm">
  <CardHeader class="pb-3">
    <CardTitle class="text-base">Account</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="rounded-md border border-border/70 bg-background/60 p-3">
        <div class="text-xs uppercase tracking-[0.16em] text-muted-foreground">Cash</div>
        <div class="mt-1 font-mono text-lg tabular-nums text-foreground">{formatCurrency(cash)}</div>
      </div>
      <div class="rounded-md border border-border/70 bg-background/60 p-3">
        <div class="text-xs uppercase tracking-[0.16em] text-muted-foreground">Equity</div>
        <div class="mt-1 font-mono text-lg tabular-nums text-foreground">{formatCurrency(equity)}</div>
      </div>
      <div class="rounded-md border border-border/70 bg-background/60 p-3">
        <div class="text-xs uppercase tracking-[0.16em] text-muted-foreground">Realized P&amp;L</div>
        <div class="mt-1 font-mono text-lg tabular-nums text-foreground">{formatSignedCurrency(realizedPnl)}</div>
      </div>
      <div class="rounded-md border border-border/70 bg-background/60 p-3">
        <div class="text-xs uppercase tracking-[0.16em] text-muted-foreground">Unrealized P&amp;L</div>
        <div class="mt-1 font-mono text-lg tabular-nums text-foreground">{formatSignedCurrency(unrealizedPnl)}</div>
      </div>
    </div>

    <div class="space-y-2 text-sm">
      <div class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Open Position
      </div>
      {#if position}
        <div class="rounded-md border border-border/70 bg-background/60 p-3 font-mono tabular-nums text-foreground">
          <div>{position.side === 'long' ? 'Long' : 'Short'} {position.shares} shares</div>
          <div class="mt-1 text-sm text-muted-foreground">Avg {formatCurrency(position.averagePrice)}</div>
        </div>
      {:else}
        <div class="rounded-md border border-dashed border-border/70 bg-background/40 p-3 text-muted-foreground">
          No open position
        </div>
      {/if}
    </div>

    <div class="space-y-2 text-sm">
      <div class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Pending Order
      </div>
      {#if pendingOrder}
        <div class="rounded-md border border-border/70 bg-background/60 p-3 font-mono tabular-nums text-foreground">
          {pendingOrder.action} {pendingOrder.shares} shares
        </div>
      {:else}
        <div class="rounded-md border border-dashed border-border/70 bg-background/40 p-3 text-muted-foreground">
          No pending order
        </div>
      {/if}
    </div>
  </CardContent>
</Card>

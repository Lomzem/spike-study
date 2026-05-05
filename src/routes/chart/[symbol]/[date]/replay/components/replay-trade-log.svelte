<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card/index.js'
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '$lib/components/ui/table/index.js'
  import { formatReplayClock } from '../replay-time'
  import { formatCurrency, formatSignedCurrency } from '../replay-formatters'
  import type { ReplayClosedTrade, ReplayFill } from '../replay-types'

  let {
    fills,
    closedTrades,
  }: {
    fills: Array<ReplayFill>
    closedTrades: Array<ReplayClosedTrade>
  } = $props()

  const recentFills = $derived([...fills].reverse().slice(0, 8))
  const recentClosedTrades = $derived([...closedTrades].reverse().slice(0, 8))
</script>

<Card class="border-border/70 bg-background/70 shadow-sm backdrop-blur-sm">
  <CardHeader class="pb-3">
    <CardTitle class="text-base">Trade Log</CardTitle>
  </CardHeader>
  <CardContent class="space-y-5">
    <div class="space-y-2">
      <div class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Fills</div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Action</TableHead>
            <TableHead class="text-right">Shares</TableHead>
            <TableHead class="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#if recentFills.length === 0}
            <TableRow>
              <TableCell colspan={4} class="text-muted-foreground">No fills yet</TableCell>
            </TableRow>
          {:else}
            {#each recentFills as fill (fill.id)}
              <TableRow>
                <TableCell>{formatReplayClock(fill.time)}</TableCell>
                <TableCell class="uppercase">{fill.action}</TableCell>
                <TableCell class="text-right font-mono tabular-nums">{fill.shares}</TableCell>
                <TableCell class="text-right font-mono tabular-nums">{formatCurrency(fill.price)}</TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </div>

    <div class="space-y-2">
      <div class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Closed Trades</div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exit</TableHead>
            <TableHead>Side</TableHead>
            <TableHead class="text-right">Shares</TableHead>
            <TableHead class="text-right">P&amp;L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#if recentClosedTrades.length === 0}
            <TableRow>
              <TableCell colspan={4} class="text-muted-foreground">No closed trades yet</TableCell>
            </TableRow>
          {:else}
            {#each recentClosedTrades as trade (trade.id)}
              <TableRow>
                <TableCell>{formatReplayClock(trade.closedAt)}</TableCell>
                <TableCell class="uppercase">{trade.side}</TableCell>
                <TableCell class="text-right font-mono tabular-nums">{trade.shares}</TableCell>
                <TableCell class="text-right font-mono tabular-nums">{formatSignedCurrency(trade.realizedPnl)}</TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>

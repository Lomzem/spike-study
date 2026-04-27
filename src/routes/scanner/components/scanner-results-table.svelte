<script lang="ts">
  import * as Table from '$lib/components/ui/table/index.js'
  import type { ScannerRow, SortDirection, SortableColumn } from '../scanner-types'
  import { SORT_LABELS } from '../scanner-columns'
  import {
    formatScannerPercent,
    formatScannerPrice,
    formatScannerVolume,
  } from '../scanner-formatters'

  let {
    rows,
    sortBy,
    sortDir,
    buildSortHref,
  }: {
    rows: Array<ScannerRow>
    sortBy?: SortableColumn
    sortDir?: SortDirection
    buildSortHref: (column: SortableColumn) => string
  } = $props()

  function getSortArrow(column: SortableColumn) {
    if (sortBy !== column) {
      return ''
    }

    return sortDir === 'asc' ? '▲' : '▼'
  }

  function getAriaSort(column: SortableColumn) {
    if (sortBy !== column) {
      return 'none'
    }

    return sortDir === 'asc' ? 'ascending' : 'descending'
  }

  const NUMERIC_COLUMNS = new Set<SortableColumn>([
    'open',
    'close',
    'volume',
    'gap',
    'change',
  ])
</script>

<div class="min-h-0 flex-1 overflow-auto">
  <Table.Root class="min-w-[760px] text-sm">
    <Table.Header class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
      <Table.Row class="border-border/70">
        {#each ['symbol', 'date', 'open', 'close', 'volume', 'gap', 'change'] as column (column)}
          <Table.Head
            class={NUMERIC_COLUMNS.has(column as SortableColumn) ? '!text-right' : ''}
            aria-sort={getAriaSort(column as SortableColumn)}
          >
            <a
              class="inline-flex items-center gap-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
              href={buildSortHref(column as SortableColumn)}
            >
              {SORT_LABELS[column as SortableColumn]}
              <span class="text-[0.6rem] text-primary">{getSortArrow(column as SortableColumn)}</span>
            </a>
          </Table.Head>
        {/each}
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each rows as row (`${row.date}-${row.symbol}`)}
        <Table.Row class="border-border/60 hover:bg-muted/25">
          <Table.Cell>
            <a href={`/chart/${encodeURIComponent(row.symbol)}/${row.date}`} class="font-semibold tracking-wide text-primary hover:underline">
              {row.symbol}
            </a>
          </Table.Cell>
          <Table.Cell class="font-mono text-muted-foreground">{row.date}</Table.Cell>
          <Table.Cell class="text-right font-mono">{formatScannerPrice(row.open)}</Table.Cell>
          <Table.Cell class="text-right font-mono">{formatScannerPrice(row.close)}</Table.Cell>
          <Table.Cell class="text-right font-mono">{formatScannerVolume(row.volume)}</Table.Cell>
          <Table.Cell class="text-right font-mono">{formatScannerPercent(row.gap)}</Table.Cell>
          <Table.Cell class="text-right font-mono">{formatScannerPercent(row.change)}</Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>

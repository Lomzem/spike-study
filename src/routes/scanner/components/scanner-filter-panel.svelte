<script lang="ts">
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal'
  import type {
    ScannerFilterValues,
    SortDirection,
    SortableColumn,
  } from '../scanner-types'
  import { SORTABLE_COLUMNS } from '../scanner-types'
  import { SORT_LABELS } from '../scanner-columns'

  let {
    filters,
    sortBy,
    sortDir,
    pageSize,
    pageSizeOptions,
  }: {
    filters: ScannerFilterValues
    sortBy?: SortableColumn
    sortDir?: SortDirection
    pageSize: number
    pageSizeOptions: ReadonlyArray<number>
  } = $props()

  let mobileOpen = $state(false)
</script>

{#snippet filterFields()}
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      <label class="grid gap-1.5">
        <span class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Start date</span>
        <Input name="startDate" type="date" value={filters.startDate} />
      </label>

      <label class="grid gap-1.5">
        <span class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">End date</span>
        <Input name="endDate" type="date" value={filters.endDate} />
      </label>
    </div>

    <label class="grid gap-1.5">
      <span class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Min volume</span>
      <Input name="minVolume" type="number" inputmode="numeric" placeholder="Any" value={filters.minVolume} />
    </label>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      <label class="grid gap-1.5">
        <span class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Min open</span>
        <Input name="minOpen" type="number" step="0.01" inputmode="decimal" placeholder="Any" value={filters.minOpen} />
      </label>

      <label class="grid gap-1.5">
        <span class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Max open</span>
        <Input name="maxOpen" type="number" step="0.01" inputmode="decimal" placeholder="Any" value={filters.maxOpen} />
      </label>
    </div>

    <label class="grid gap-1.5">
      <span class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Min gap %</span>
      <Input name="minGap" type="number" step="0.01" inputmode="decimal" placeholder="Any" value={filters.minGap} />
    </label>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      <label class="grid gap-1.5">
        <span class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sort by</span>
        <select name="sortBy" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">Default</option>
          {#each SORTABLE_COLUMNS as column (column)}
            <option value={column} selected={sortBy === column}>{SORT_LABELS[column]}</option>
          {/each}
        </select>
      </label>

      <label class="grid gap-1.5">
        <span class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Direction</span>
        <select name="sortDir" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">Default</option>
          <option value="asc" selected={sortDir === 'asc'}>Ascending</option>
          <option value="desc" selected={sortDir === 'desc'}>Descending</option>
        </select>
      </label>
    </div>

    <label class="grid gap-1.5">
      <span class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Rows per page</span>
      <select name="pageSize" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
        {#each pageSizeOptions as option (option)}
          <option value={option} selected={pageSize === option}>{option}</option>
        {/each}
      </select>
    </label>

    <input type="hidden" name="page" value="1" />
  </div>
{/snippet}

{#snippet filterForm()}
  <form method="GET" class="flex h-full min-h-0 flex-col gap-5">
    <div class="min-h-0 flex-1 overflow-auto pr-1">{@render filterFields()}</div>

    <div class="grid gap-2 border-t border-border/70 pt-4">
      <Button type="submit" class="w-full">Run scan</Button>
      <Button href="/scanner" variant="ghost" class="w-full">Reset filters</Button>
    </div>
  </form>
{/snippet}

<div class="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 lg:hidden">
  <div>
    <p class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Scanner</p>
    <p class="text-sm text-foreground">Filters and results</p>
  </div>

  <Sheet.Root bind:open={mobileOpen}>
    <Sheet.Trigger
      class={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
    >
      <SlidersHorizontal size={16} />
    </Sheet.Trigger>
    <Sheet.Content side="left" class="flex w-[22rem] max-w-[88vw] flex-col gap-4 border-border bg-card px-0">
      <Sheet.Header class="px-5">
        <Sheet.Title>Scanner Filters</Sheet.Title>
        <Sheet.Description>Adjust the scan, then rerun it.</Sheet.Description>
      </Sheet.Header>
      <div class="min-h-0 flex-1 px-5 pb-5">{@render filterForm()}</div>
    </Sheet.Content>
  </Sheet.Root>
</div>

<aside class="hidden w-80 shrink-0 border-r border-border/70 bg-card/60 lg:flex lg:flex-col">
  <div class="border-b border-border/70 px-5 py-4">
    <p class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Scanner</p>
    <h1 class="mt-2 text-xl font-semibold tracking-tight text-foreground">Filter the market history</h1>
    <p class="mt-2 text-sm leading-6 text-muted-foreground">
      Scan for setups with intraday data, then jump directly into the chart.
    </p>
  </div>
  <div class="min-h-0 flex-1 px-5 py-5">{@render filterForm()}</div>
</aside>

<script lang="ts">
  import { buttonVariants } from '$lib/components/ui/button/index.js'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal'
  import ScannerFilterForm from './scanner-filter-form.svelte'
  import type {
    ScannerFilterValues,
    SortDirection,
    SortableColumn,
  } from '../scanner-types'

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

<div
  class="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 lg:hidden"
>
  <div>
    <p
      class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
    >
      Scanner
    </p>
    <p class="text-sm text-foreground">Filters and results</p>
  </div>

  <Sheet.Root bind:open={mobileOpen}>
    <Sheet.Trigger
      class={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
    >
      <SlidersHorizontal size={16} />
    </Sheet.Trigger>
    <Sheet.Content
      side="left"
      class="flex w-[22rem] max-w-[88vw] flex-col gap-4 border-border bg-card px-0"
    >
      <Sheet.Header class="px-5">
        <Sheet.Title>Scanner Filters</Sheet.Title>
        <Sheet.Description>Adjust the scan, then rerun it.</Sheet.Description>
      </Sheet.Header>
      <div class="min-h-0 flex-1 px-5 pb-5">
        <ScannerFilterForm
          {filters}
          {sortBy}
          {sortDir}
          {pageSize}
          {pageSizeOptions}
        />
      </div>
    </Sheet.Content>
  </Sheet.Root>
</div>

<aside
  class="hidden w-80 shrink-0 border-r border-border/70 bg-card/60 lg:flex lg:flex-col"
>
  <div class="min-h-0 flex-1 px-5 py-5">
    <ScannerFilterForm
      {filters}
      {sortBy}
      {sortDir}
      {pageSize}
      {pageSizeOptions}
    />
  </div>
</aside>

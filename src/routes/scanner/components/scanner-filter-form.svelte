<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import ScannerFilterFields from './scanner-filter-fields.svelte'
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
</script>

<form method="GET" class="flex h-full min-h-0 flex-col gap-5">
  <div class="min-h-0 flex-1 overflow-auto pr-1">
    <ScannerFilterFields
      {filters}
      {sortBy}
      {sortDir}
      {pageSize}
      {pageSizeOptions}
    />
  </div>

  <div class="grid gap-2 border-t border-border/70 pt-4">
    <Button type="submit" class="w-full">Run scan</Button>
    <Button href="/scanner" variant="ghost" class="w-full">Reset filters</Button>
  </div>
</form>

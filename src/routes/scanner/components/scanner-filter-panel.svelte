<script lang="ts">
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal'
  import ScannerDatePicker from './scanner-date-picker.svelte'
  import ScannerRadioDropdown from './scanner-radio-dropdown.svelte'
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
  let selectedSortBy = $state('')
  let selectedSortDir = $state('')
  let selectedPageSize = $state('')

  const sortByOptions = [
    { value: '', label: 'Default' },
    ...SORTABLE_COLUMNS.map((column) => ({
      value: column,
      label: SORT_LABELS[column],
    })),
  ]
  const sortDirOptions = [
    { value: '', label: 'Default' },
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ]
  const pageSizeOptionsList = $derived(
    pageSizeOptions.map((option) => ({
      value: String(option),
      label: String(option),
    })),
  )

  $effect(() => {
    selectedSortBy = sortBy ?? ''
    selectedSortDir = sortDir ?? ''
    selectedPageSize = String(pageSize)
  })
</script>

{#snippet filterFields()}
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      <ScannerDatePicker
        name="startDate"
        label="Start date"
        value={filters.startDate}
      />

      <ScannerDatePicker
        name="endDate"
        label="End date"
        value={filters.endDate}
      />
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
      <Input name="minGap" type="number" step="0.1" inputmode="decimal" placeholder="Any" value={filters.minGap} />
    </label>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      <ScannerRadioDropdown
        name="sortBy"
        label="Sort by"
        bind:value={selectedSortBy}
        options={sortByOptions}
      />

      <ScannerRadioDropdown
        name="sortDir"
        label="Direction"
        bind:value={selectedSortDir}
        options={sortDirOptions}
      />
    </div>

    <ScannerRadioDropdown
      name="pageSize"
      label="Rows per page"
      bind:value={selectedPageSize}
      options={pageSizeOptionsList}
    />

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
  <div class="min-h-0 flex-1 px-5 py-5">{@render filterForm()}</div>
</aside>

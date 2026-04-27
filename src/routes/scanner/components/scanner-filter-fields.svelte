<script lang="ts">
  import { Input } from '$lib/components/ui/input/index.js'
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

  const pageSizeDropdownOptions = $derived(
    pageSizeOptions.map((option) => ({
      value: String(option),
      label: String(option),
    })),
  )
</script>

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
    <span
      class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
    >Min volume</span>
    <Input
      name="minVolume"
      type="number"
      inputmode="numeric"
      placeholder="Any"
      value={filters.minVolume}
    />
  </label>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
    <label class="grid gap-1.5">
      <span
        class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
      >Min open</span>
      <Input
        name="minOpen"
        type="number"
        step="0.01"
        inputmode="decimal"
        placeholder="Any"
        value={filters.minOpen}
      />
    </label>

    <label class="grid gap-1.5">
      <span
        class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
      >Max open</span>
      <Input
        name="maxOpen"
        type="number"
        step="0.01"
        inputmode="decimal"
        placeholder="Any"
        value={filters.maxOpen}
      />
    </label>
  </div>

  <label class="grid gap-1.5">
    <span
      class="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
    >Min gap %</span>
    <Input
      name="minGap"
      type="number"
      step="0.1"
      inputmode="decimal"
      placeholder="Any"
      value={filters.minGap}
    />
  </label>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
    <ScannerRadioDropdown
      name="sortBy"
      label="Sort by"
      value={sortBy ?? ''}
      options={sortByOptions}
    />

    <ScannerRadioDropdown
      name="sortDir"
      label="Direction"
      value={sortDir ?? ''}
      options={sortDirOptions}
    />
  </div>

  <ScannerRadioDropdown
    name="pageSize"
    label="Rows per page"
    value={String(pageSize)}
    options={pageSizeDropdownOptions}
  />

  <input type="hidden" name="page" value="1" />
</div>

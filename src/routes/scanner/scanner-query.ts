import {
  PAGE_SIZE_OPTIONS,
  SORTABLE_COLUMNS,
  type ScannerFilterValues,
  type ScannerQueryState,
  type SortDirection,
  type SortableColumn,
} from './scanner-types'

function getTrimmedValue(
  searchParams: URLSearchParams,
  key: keyof ScannerFilterValues,
) {
  return searchParams.get(key)?.trim() ?? ''
}

function toPositiveInteger(value: string | null | undefined) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined
}

function parseSortBy(value: string | null): SortableColumn | undefined {
  return SORTABLE_COLUMNS.includes(value as SortableColumn)
    ? (value as SortableColumn)
    : undefined
}

function parseSortDirection(value: string | null): SortDirection | undefined {
  return value === 'asc' || value === 'desc' ? value : undefined
}

function hasScannerQuery(searchParams: URLSearchParams) {
  return [
    'startDate',
    'endDate',
    'minVolume',
    'minOpen',
    'maxOpen',
    'minGap',
    'sortBy',
    'sortDir',
    'page',
    'pageSize',
  ].some((key) => searchParams.has(key))
}

export function parseScannerQuery(url: URL): ScannerQueryState {
  const filters = {
    startDate: getTrimmedValue(url.searchParams, 'startDate'),
    endDate: getTrimmedValue(url.searchParams, 'endDate'),
    minVolume: getTrimmedValue(url.searchParams, 'minVolume'),
    minOpen: getTrimmedValue(url.searchParams, 'minOpen'),
    maxOpen: getTrimmedValue(url.searchParams, 'maxOpen'),
    minGap: getTrimmedValue(url.searchParams, 'minGap'),
  }

  const requestedPageSize = toPositiveInteger(url.searchParams.get('pageSize'))
  const pageSize = PAGE_SIZE_OPTIONS.includes(
    requestedPageSize as (typeof PAGE_SIZE_OPTIONS)[number],
  )
    ? (requestedPageSize as (typeof PAGE_SIZE_OPTIONS)[number])
    : 25

  return {
    filters,
    sortBy: parseSortBy(url.searchParams.get('sortBy')),
    sortDir: parseSortDirection(url.searchParams.get('sortDir')),
    page: toPositiveInteger(url.searchParams.get('page')) ?? 1,
    pageSize,
    hasScanned: hasScannerQuery(url.searchParams),
  }
}

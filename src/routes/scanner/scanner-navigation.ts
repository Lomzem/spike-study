import type {
  ScannerFilterValues,
  SortDirection,
  SortableColumn,
} from './scanner-types'
import { buildScannerSearchParams } from './scanner-url'

interface ScannerNavigationState {
  filters: ScannerFilterValues
  sortBy?: SortableColumn
  sortDir?: SortDirection
  pageSize: number
}

export function buildScannerPageHref(
  state: ScannerNavigationState,
  page: number,
) {
  return `/scanner?${buildScannerSearchParams({
    filters: state.filters,
    sortBy: state.sortBy,
    sortDir: state.sortDir,
    page,
    pageSize: state.pageSize,
  }).toString()}`
}

export function buildScannerSortHref(
  state: ScannerNavigationState,
  column: SortableColumn,
) {
  const nextDirection =
    state.sortBy === column && state.sortDir === 'asc' ? 'desc' : 'asc'

  return `/scanner?${buildScannerSearchParams({
    filters: state.filters,
    sortBy: column,
    sortDir: nextDirection,
    page: 1,
    pageSize: state.pageSize,
  }).toString()}`
}

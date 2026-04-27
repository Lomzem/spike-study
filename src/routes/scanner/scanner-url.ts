import type {
  ScannerFilterValues,
  SortDirection,
  SortableColumn,
} from './scanner-types'

export function buildScannerSearchParams(state: {
  filters: ScannerFilterValues
  sortBy?: SortableColumn
  sortDir?: SortDirection
  page?: number
  pageSize: number
}) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(state.filters)) {
    if (value) {
      searchParams.set(key, value)
    }
  }

  if (state.sortBy) {
    searchParams.set('sortBy', state.sortBy)
  }

  if (state.sortDir) {
    searchParams.set('sortDir', state.sortDir)
  }

  searchParams.set('pageSize', `${state.pageSize}`)

  if (state.page != null) {
    searchParams.set('page', `${state.page}`)
  }

  return searchParams
}

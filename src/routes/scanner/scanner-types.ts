export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export const SORTABLE_COLUMNS = [
  'symbol',
  'date',
  'open',
  'close',
  'volume',
  'gap',
  'change',
] as const

export type SortableColumn = (typeof SORTABLE_COLUMNS)[number]
export type SortDirection = 'asc' | 'desc'

export interface ScannerFilterValues {
  startDate: string
  endDate: string
  minVolume: string
  minOpen: string
  maxOpen: string
  minGap: string
}

export interface ScannerQueryState {
  filters: ScannerFilterValues
  sortBy?: SortableColumn
  sortDir?: SortDirection
  page: number
  pageSize: (typeof PAGE_SIZE_OPTIONS)[number]
  hasScanned: boolean
}

export interface ScannerRow {
  symbol: string
  date: string
  open: number
  close: number
  volume: number
  gap: number | null
  change: number | null
}

export interface ScannerPageData {
  filters: ScannerFilterValues
  rows: Array<ScannerRow>
  totalCount: number
  page: number
  pageSize: (typeof PAGE_SIZE_OPTIONS)[number]
  pageSizeOptions: typeof PAGE_SIZE_OPTIONS
  totalPages: number
  sortBy?: SortableColumn
  sortDir?: SortDirection
  hasScanned: boolean
  dbError?: string
}

import type { SQL } from 'drizzle-orm'
import { eq, gte, lte } from 'drizzle-orm'
import { dailyStocksTable } from '$lib/server/db/schema.js'
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

function toFiniteNumber(value: string) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
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
    hasScanned: url.searchParams.has('page'),
  }
}

export function buildScannerConditions(
  filters: ScannerFilterValues,
): Array<SQL> {
  const conditions: Array<SQL> = [eq(dailyStocksTable.hasIntraday, true)]

  if (filters.startDate) {
    conditions.push(gte(dailyStocksTable.date, filters.startDate))
  }

  if (filters.endDate) {
    conditions.push(lte(dailyStocksTable.date, filters.endDate))
  }

  const minVolume = toFiniteNumber(filters.minVolume)
  if (minVolume != null) {
    conditions.push(gte(dailyStocksTable.volume, minVolume))
  }

  const minOpen = toFiniteNumber(filters.minOpen)
  if (minOpen != null) {
    conditions.push(gte(dailyStocksTable.open, minOpen))
  }

  const maxOpen = toFiniteNumber(filters.maxOpen)
  if (maxOpen != null) {
    conditions.push(lte(dailyStocksTable.open, maxOpen))
  }

  const minGap = toFiniteNumber(filters.minGap)
  if (minGap != null) {
    conditions.push(gte(dailyStocksTable.gap, minGap / 100))
  }

  return conditions
}

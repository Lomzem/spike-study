import type { SQL } from 'drizzle-orm'
import { eq, gte, lte } from 'drizzle-orm'
import { dailyStocksTable } from '$lib/server/db/schema.js'
import type { ScannerFilterValues } from './scanner-types'

function isValidScannerDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const normalizedYear = String(date.getUTCFullYear()).padStart(4, '0')
  const normalizedMonth = String(date.getUTCMonth() + 1).padStart(2, '0')
  const normalizedDay = String(date.getUTCDate()).padStart(2, '0')

  return `${normalizedYear}-${normalizedMonth}-${normalizedDay}` === value
}

function toFiniteNumber(value: string) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function buildScannerConditions(
  filters: ScannerFilterValues,
): Array<SQL> {
  const conditions: Array<SQL> = [eq(dailyStocksTable.hasIntraday, true)]

  if (filters.startDate && isValidScannerDate(filters.startDate)) {
    conditions.push(gte(dailyStocksTable.date, filters.startDate))
  }

  if (filters.endDate && isValidScannerDate(filters.endDate)) {
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

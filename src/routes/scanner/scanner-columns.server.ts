import { dailyStocksTable } from '$lib/server/db/schema.js'
import type { SortableColumn } from './scanner-types'

export const SORT_COLUMN_MAP = {
  symbol: dailyStocksTable.symbol,
  date: dailyStocksTable.date,
  open: dailyStocksTable.open,
  close: dailyStocksTable.close,
  volume: dailyStocksTable.volume,
  gap: dailyStocksTable.gap,
  change: dailyStocksTable.change,
} satisfies Record<SortableColumn, unknown>

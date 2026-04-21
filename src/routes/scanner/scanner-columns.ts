import type { SortableColumn } from './scanner-types'

export const SORT_LABELS = {
  symbol: 'Symbol',
  date: 'Date',
  open: 'Open',
  close: 'Close',
  volume: 'Volume',
  gap: 'Gap %',
  change: 'Change %',
} satisfies Record<SortableColumn, string>

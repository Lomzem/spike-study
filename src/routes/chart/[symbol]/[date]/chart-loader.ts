import type { ChartCandle } from './chart-types'

interface IntradayRow {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function toChartTimestamp(rawTime: number) {
  // Values at or above 10^10 are millisecond timestamps.
  return Math.floor(rawTime >= 10_000_000_000 ? rawTime / 1000 : rawTime)
}

export function toChartCandles(rows: Array<IntradayRow>): Array<ChartCandle> {
  return rows.map((row) => ({
    time: toChartTimestamp(row.time) as ChartCandle['time'],
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }))
}

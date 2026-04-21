import type { IntradayRow, ChartCandle } from './chart-types'

function toChartTimestamp(rawTime: number) {
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

import { UserPriceLines } from './chart-user-price-lines'
import type { SavedPriceLine } from './chart-drawing-types'
import type { ChartDrawingState } from './chart-types'
import type { IChartApi, ISeriesApi } from 'lightweight-charts'

export function buildDrawingStateKey(drawings: ChartDrawingState | null) {
  if (!drawings) {
    return null
  }

  const stablePriceLines = drawings.priceLines.map((priceLine) => [
    priceLine.id,
    priceLine.price,
    priceLine.color,
    priceLine.lineWidth,
    priceLine.lineStyle,
  ])

  return `${drawings.symbol}:${JSON.stringify(stablePriceLines)}`
}

export class DrawingSaveQueue {
  private onFlush?: (priceLines: Array<SavedPriceLine>) => void
  private saveTimeout: number | null = null
  private pendingPriceLines: Array<SavedPriceLine> | null = null

  constructor(onFlush?: (priceLines: Array<SavedPriceLine>) => void) {
    this.onFlush = onFlush
  }

  schedule(priceLines: Array<SavedPriceLine>) {
    if (this.saveTimeout !== null) {
      window.clearTimeout(this.saveTimeout)
    }

    this.pendingPriceLines = priceLines
    this.saveTimeout = window.setTimeout(() => {
      if (this.pendingPriceLines) {
        this.onFlush?.(this.pendingPriceLines)
      }
      this.pendingPriceLines = null
      this.saveTimeout = null
    }, 500)
  }

  flush() {
    if (this.saveTimeout === null || this.pendingPriceLines === null) {
      return
    }

    const priceLines = this.pendingPriceLines
    window.clearTimeout(this.saveTimeout)
    this.saveTimeout = null
    this.pendingPriceLines = null
    this.onFlush?.(priceLines)
  }

  cancel() {
    if (this.saveTimeout !== null) {
      window.clearTimeout(this.saveTimeout)
    }

    this.saveTimeout = null
    this.pendingPriceLines = null
  }
}

export function createUserPriceLines(
  chart: IChartApi,
  series: ISeriesApi<'Candlestick'>,
  onChange: (priceLines: Array<SavedPriceLine>) => void,
) {
  return new UserPriceLines(chart, series, {
    color: '#4c9aff',
    onChange,
  })
}

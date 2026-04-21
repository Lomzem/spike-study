import { LineStyle } from 'lightweight-charts'
import type { IPriceLine, ISeriesApi } from 'lightweight-charts'
import type { SavedPriceLine } from './chart-drawing-types'

export interface UserPriceLineRecord {
  line: IPriceLine
  state: SavedPriceLine
}

interface BuildLineStateOptions {
  color: string
  lineWidth: 1 | 2 | 3 | 4
  lineStyle: LineStyle
}

export function createLineId() {
  return crypto.randomUUID()
}

export function isFiniteNumber(value: number) {
  return Number.isFinite(value)
}

export function normalizeLineWidth(lineWidth: number): 1 | 2 | 3 | 4 {
  if (
    Number.isFinite(lineWidth) &&
    Number.isInteger(lineWidth) &&
    (lineWidth === 1 || lineWidth === 2 || lineWidth === 3 || lineWidth === 4)
  ) {
    return lineWidth
  }

  return 1
}

export function findLineNearCoordinate(
  lines: Array<UserPriceLineRecord>,
  series: ISeriesApi<'Candlestick'>,
  y: number,
  hitTolerancePx: number,
) {
  for (const record of lines) {
    const coordinate = series.priceToCoordinate(record.state.price)
    if (coordinate !== null && Math.abs(coordinate - y) <= hitTolerancePx) {
      return record
    }
  }

  return null
}

export function buildLineStateFromCoordinate(
  series: ISeriesApi<'Candlestick'>,
  y: number,
  options: BuildLineStateOptions,
): SavedPriceLine | null {
  const price = series.coordinateToPrice(y)
  if (price === null) {
    return null
  }

  return {
    id: createLineId(),
    price,
    color: options.color,
    lineWidth: options.lineWidth,
    lineStyle: options.lineStyle,
  }
}

export function isTextInputEventTarget(event: KeyboardEvent) {
  return event
    .composedPath()
    .some(
      (element) =>
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement ||
        (element instanceof HTMLElement && element.isContentEditable),
    )
}

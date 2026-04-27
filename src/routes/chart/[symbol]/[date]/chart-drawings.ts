import type {
  SavedLineStyle,
  SavedLineWidth,
  SavedPriceLine,
} from './chart-drawing-types'
import { normalizeLineWidth } from './chart-user-price-line-utils'

export function normalizeSavedPriceLines(
  priceLines:
    | Array<{
        id: string
        price: number
        color: string
        lineWidth: number
        lineStyle: number
      }>
    | null
    | undefined,
): Array<SavedPriceLine> | null {
  if (!priceLines) {
    return null
  }

  return priceLines
    .filter(
      (priceLine): priceLine is SavedPriceLine =>
        Number.isFinite(priceLine.price) &&
        Number.isFinite(priceLine.lineWidth) &&
        Number.isInteger(priceLine.lineWidth) &&
        priceLine.lineWidth >= 1 &&
        priceLine.lineWidth <= 4 &&
        Number.isInteger(priceLine.lineStyle) &&
        priceLine.lineStyle >= 0 &&
        priceLine.lineStyle <= 4,
    )
    .map((priceLine) => ({
      ...priceLine,
      lineWidth: normalizeLineWidth(priceLine.lineWidth) as SavedLineWidth,
      lineStyle: priceLine.lineStyle as SavedLineStyle,
    }))
}

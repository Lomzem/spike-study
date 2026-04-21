import type { SavedLineStyle, SavedPriceLine } from './chart-drawing-types'

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
        Number.isInteger(priceLine.lineStyle) &&
        priceLine.lineStyle >= 0 &&
        priceLine.lineStyle <= 4,
    )
    .map((priceLine) => ({
      ...priceLine,
      lineStyle: priceLine.lineStyle as SavedLineStyle,
    }))
}

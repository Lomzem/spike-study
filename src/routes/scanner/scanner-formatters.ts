const SCANNER_NUMBER_FORMATTER = new Intl.NumberFormat('en-US')
const SCANNER_PRICE_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatScannerPrice(value: number) {
  return SCANNER_PRICE_FORMATTER.format(value)
}

export function formatScannerVolume(value: number) {
  return SCANNER_NUMBER_FORMATTER.format(value)
}

export function formatScannerPercent(value: number | null) {
  if (value == null) {
    return '--'
  }

  if (!Number.isFinite(value)) {
    return '--'
  }

  return `${(value * 100).toFixed(2)}%`
}

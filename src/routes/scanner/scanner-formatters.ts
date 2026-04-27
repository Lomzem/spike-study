const SCANNER_NUMBER_FORMATTER = new Intl.NumberFormat('en-US')

export function formatScannerPrice(value: number) {
  return value.toFixed(2)
}

export function formatScannerVolume(value: number) {
  return SCANNER_NUMBER_FORMATTER.format(value)
}

export function formatScannerPercent(value: number | null) {
  if (value == null) {
    return '--'
  }

  return `${(value * 100).toFixed(2)}%`
}

export function formatScannerPrice(value: number) {
  return value.toFixed(2)
}

export function formatScannerVolume(value: number) {
  return value.toLocaleString()
}

export function formatScannerPercent(value: number | null) {
  if (value == null) {
    return '--'
  }

  return `${(value * 100).toFixed(2)}%`
}

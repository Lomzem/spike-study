export function formatPrice(value: number | null | undefined) {
  if (value == null) {
    return '--'
  }

  return value.toFixed(2)
}

export function formatVolume(value: number | null | undefined) {
  if (value == null) {
    return '--'
  }

  const absoluteValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absoluteValue >= 1_000_000) {
    return `${sign}${(absoluteValue / 1_000_000).toFixed(2)}M`
  }

  if (absoluteValue >= 1_000) {
    return `${sign}${(absoluteValue / 1_000).toFixed(1)}K`
  }

  return `${sign}${absoluteValue.toLocaleString('en-US')}`
}

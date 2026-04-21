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

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }

  return value.toLocaleString()
}

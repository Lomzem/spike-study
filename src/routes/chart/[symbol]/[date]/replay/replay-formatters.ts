const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return '--'
  }

  return currencyFormatter.format(value)
}

export function formatSignedCurrency(value: number | null | undefined) {
  if (value == null) {
    return '--'
  }

  const formatted = formatCurrency(Math.abs(value))

  if (value > 0) {
    return `+${formatted}`
  }

  if (value < 0) {
    return `-${formatted}`
  }

  return formatted
}

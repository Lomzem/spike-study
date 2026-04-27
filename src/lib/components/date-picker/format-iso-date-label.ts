export function formatIsoDateLabel(
  value: string | undefined,
  emptyLabel = 'Select date',
) {
  if (!value) {
    return emptyLabel
  }

  const isoDate = value.slice(0, 10)
  const date = new Date(`${isoDate}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

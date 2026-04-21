export function formatIsoDateLabel(
  value: string | undefined,
  emptyLabel = 'Select date',
) {
  if (!value) {
    return emptyLabel
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

/**
 * Format a Date as a calendar date string in YYYY-MM-DD format.
 *
 * Uses the date's UTC year, month, and day components.
 *
 * @param date - The Date to format (UTC is used)
 * @returns The formatted date string in `YYYY-MM-DD` form
 */
export function toDateString(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

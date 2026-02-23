/**
 * Format a Date as a calendar date string in YYYY-MM-DD format.
 *
 * Uses the date's local year, month, and day components.
 *
 * @param date - The Date to format (local time is used)
 * @returns The formatted date string in `YYYY-MM-DD` form
 */
export function toDateString(date: Date) {
  return `${date.toISOString().split('T')[0]}`
}

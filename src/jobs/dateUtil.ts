/**
 * Format a Date as a calendar date string in YYYY-MM-DD format.
 *
 * Uses the date's local year, month, and day components.
 *
 * @param date - The Date to format (local time is used)
 * @returns The formatted date string in `YYYY-MM-DD` form
 */
export function dateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
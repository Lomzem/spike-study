/**
 * Formats a Date as a string in the form YYYY-MM-DD.
 *
 * @param date - The Date to format.
 * @returns The formatted date string, using a zero-based month (January is `00`) and two-digit day/month padding.
 */
export function dateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
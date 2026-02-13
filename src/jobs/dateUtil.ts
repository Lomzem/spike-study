export function dateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

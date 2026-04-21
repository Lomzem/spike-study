export function buildChartDateHref(symbol: string, date: string) {
  return `/chart/${encodeURIComponent(symbol)}/${date}`
}

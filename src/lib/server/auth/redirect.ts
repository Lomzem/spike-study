const DEFAULT_REDIRECT_TARGET = '/scanner'

export function sanitizeRedirectTarget(value: string | null | undefined) {
  if (!value?.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_REDIRECT_TARGET
  }

  return value
}

export function buildRedirectTarget(url: URL) {
  return `${url.pathname}${url.search}`
}

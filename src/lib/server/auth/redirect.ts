const DEFAULT_REDIRECT_TARGET = '/scanner'

function hasControlCharacters(value: string) {
  for (const char of value) {
    const code = char.charCodeAt(0)
    if (code <= 31 || code === 127) {
      return true
    }
  }

  return false
}

export function sanitizeRedirectTarget(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_REDIRECT_TARGET
  }

  const trimmedValue = value.trim()

  if (trimmedValue.length === 0 || trimmedValue.includes('\\')) {
    return DEFAULT_REDIRECT_TARGET
  }

  if (hasControlCharacters(trimmedValue)) {
    return DEFAULT_REDIRECT_TARGET
  }

  try {
    const parsed = new URL(trimmedValue, 'http://localhost')

    if (
      parsed.origin !== 'http://localhost' ||
      !trimmedValue.startsWith('/') ||
      trimmedValue.startsWith('//')
    ) {
      return DEFAULT_REDIRECT_TARGET
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return DEFAULT_REDIRECT_TARGET
  }
}

export function buildRedirectTarget(url: URL) {
  return `${url.pathname}${url.search}`
}

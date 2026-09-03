/**
 * Normalize a user-entered URL:
 *  - trims whitespace
 *  - auto-prepends https:// when no protocol is present
 *  - returns empty string when the input is empty
 */
export function normalizeUrl(raw) {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/**
 * Validate and normalize a URL field.
 * Returns { url, error } — error is null when valid.
 */
export function validateUrl(raw, { required = false, fieldName = 'URL' } = {}) {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) {
    return required ? { url: '', error: `${fieldName} is required.` } : { url: '', error: null }
  }
  const normalized = normalizeUrl(trimmed)
  try {
    const parsed = new URL(normalized)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { url: normalized, error: `${fieldName} must use HTTP or HTTPS.` }
    }
    if (!parsed.hostname.includes('.')) {
      return { url: normalized, error: `Please enter a valid ${fieldName.toLowerCase()} (e.g. example.com).` }
    }
    return { url: normalized, error: null }
  } catch {
    return { url: normalized, error: `Please enter a valid ${fieldName.toLowerCase()} (e.g. example.com).` }
  }
}

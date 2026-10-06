/** Pages Chrome never lets extensions script, or that have nothing to analyze. */

const STORE_HOSTS = ['chromewebstore.google.com', 'microsoftedge.microsoft.com']

export function isRestrictedUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) return false // unknown: we simply lack permission to see the URL yet
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return true
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true
  if (STORE_HOSTS.includes(url.hostname)) return true
  if (url.hostname === 'chrome.google.com' && url.pathname.startsWith('/webstore')) return true
  return false
}

export function displayUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return rawUrl
    const path = url.pathname === '/' ? '' : url.pathname
    return `${url.hostname.replace(/^www\./, '')}${path}`
  } catch {
    return rawUrl
  }
}

/** Cache key: ignores #fragments and a trailing slash. */
export function normalizePageUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    url.hash = ''
    return url.href.replace(/\/$/, '')
  } catch {
    return rawUrl
  }
}

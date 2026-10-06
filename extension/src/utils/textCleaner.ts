/** Pure text helpers shared by the content script and the side panel. */

export function normalizeWhitespace(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/[  -​  　]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
}

const GENERIC_ANCHORS = new Set([
  'click here',
  'click',
  'here',
  'read more',
  'more',
  'learn more',
  'this',
  'link',
  'this link',
  'go',
  'continue',
  'continue reading',
  'details',
  'more info',
  'see more',
])

export function isGenericAnchorText(text: string): boolean {
  return GENERIC_ANCHORS.has(text.toLowerCase().replace(/[^a-z ]/g, '').trim())
}

/** Hostname without a leading "www." so example.com and www.example.com match. */
export function bareHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '')
}

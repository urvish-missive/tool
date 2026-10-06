import { describe, expect, it } from 'vitest'
import { runPageChecks } from '../src/services/pageChecks'
import { isRestrictedUrl, normalizePageUrl } from '../src/utils/restrictedUrls'
import type { PageContent } from '../src/types/page'

const base: PageContent = {
  url: 'https://example.com/a',
  title: '',
  metaDescription: '',
  canonical: '',
  language: '',
  robots: 'noindex, follow',
  viewport: '',
  headings: [
    { level: 2, text: 'Intro' },
    { level: 4, text: 'Deep' },
  ],
  blocks: [],
  content: '',
  wordCount: 120,
  paragraphCount: 0,
  contentLength: 0,
  contentRoot: 'body',
  links: [],
  linkTotals: { internal: 0, external: 0, empty: 2, generic: 0 },
  images: [],
  imageTotals: { total: 4, withAlt: 1, missingAlt: 3, decorative: 0 },
  openGraph: {},
  twitter: {},
  structuredData: [],
  structuredDataTypes: [],
  html: null,
  limits: { blocksCapped: false, linksCapped: false, imagesCapped: false },
  extractedAt: '',
}

describe('runPageChecks', () => {
  it('flags the common on-page problems', () => {
    const byId = Object.fromEntries(runPageChecks(base).map((c) => [c.id, c.status]))
    expect(byId).toMatchObject({
      title: 'fail',
      'meta-description': 'fail',
      robots: 'fail',
      h1: 'fail',
      hierarchy: 'warning',
      'word-count': 'warning',
      'empty-anchors': 'warning',
      'alt-text': 'fail',
      schema: 'warning',
    })
  })
})

describe('restricted URLs', () => {
  it('blocks browser and store pages but not unknown URLs', () => {
    expect(isRestrictedUrl('chrome://settings')).toBe(true)
    expect(isRestrictedUrl('https://chromewebstore.google.com/detail/x')).toBe(true)
    expect(isRestrictedUrl('file:///C:/a.html')).toBe(true)
    expect(isRestrictedUrl('https://example.com')).toBe(false)
    expect(isRestrictedUrl(undefined)).toBe(false)
  })

  it('normalizes cache keys', () => {
    expect(normalizePageUrl('https://example.com/a/#top')).toBe('https://example.com/a')
  })
})

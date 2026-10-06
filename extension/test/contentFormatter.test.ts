import { describe, expect, it } from 'vitest'
import { blockToMarkdown, buildAnalyzeRequest, detectTemplate, formatContent } from '../src/utils/contentFormatter'
import type { ContentBlock, PageContent } from '../src/types/page'

function page(overrides: Partial<PageContent> = {}): PageContent {
  return {
    url: 'https://example.com/blog/post?x=1',
    title: 'Doc title',
    metaDescription: 'Meta',
    canonical: '',
    language: 'en',
    robots: '',
    viewport: '',
    headings: [{ level: 1, text: 'H1 text' }],
    blocks: [
      { type: 'heading', level: 1, text: 'H1 text' },
      { type: 'paragraph', level: 0, text: 'Intro paragraph with enough text to analyze.' },
    ],
    content: '',
    wordCount: 10,
    paragraphCount: 1,
    contentLength: 0,
    contentRoot: 'article',
    links: [],
    linkTotals: { internal: 0, external: 0, empty: 0, generic: 0 },
    images: [],
    imageTotals: { total: 0, withAlt: 0, missingAlt: 0, decorative: 0 },
    openGraph: {},
    twitter: {},
    structuredData: [],
    structuredDataTypes: [],
    limits: { blocksCapped: false, linksCapped: false, imagesCapped: false },
    extractedAt: '',
    ...overrides,
  }
}

describe('blockToMarkdown', () => {
  it('uses the syntax the server block parser understands', () => {
    expect(blockToMarkdown({ type: 'heading', level: 3, text: 'A' })).toBe('### A')
    expect(blockToMarkdown({ type: 'list_item', level: 0, text: 'B' })).toBe('- B')
    expect(blockToMarkdown({ type: 'quote', level: 0, text: 'C' })).toBe('> C')
  })
})

describe('formatContent', () => {
  it('returns everything when under the limit', () => {
    const r = formatContent(page().blocks, 1000)
    expect(r.truncated).toBe(false)
    expect(r.content).toBe('# H1 text\n\nIntro paragraph with enough text to analyze.')
  })

  it('keeps the opening plus the heading outline of a long page, never splitting blocks', () => {
    const blocks: ContentBlock[] = []
    for (let s = 0; s < 40; s++) {
      blocks.push({ type: 'heading', level: 2, text: `Section ${s}` })
      blocks.push({ type: 'paragraph', level: 0, text: `First para of ${s}. ` + 'x'.repeat(200) })
      blocks.push({ type: 'paragraph', level: 0, text: `Second para of ${s}. ` + 'y'.repeat(200) })
    }
    const r = formatContent(blocks, 6000)
    expect(r.truncated).toBe(true)
    expect(r.content.length).toBeLessThanOrEqual(6000)
    expect(r.content.startsWith('## Section 0')).toBe(true)
    // Every section heading survives even though the body text does not.
    for (let s = 0; s < 40; s++) expect(r.content).toMatch(new RegExp(`## Section ${s}(\\n|$)`))
    expect(r.content).not.toContain('Second para of 39')
    // Blocks are whole: every kept paragraph still ends with its full padding.
    for (const part of r.content.split('\n\n')) {
      if (part.startsWith('First')) expect(part.endsWith('x'.repeat(200))).toBe(true)
    }
  })
})

describe('buildAnalyzeRequest', () => {
  it('maps the page onto the existing /content-qa/analyze payload', () => {
    const { request } = buildAnalyzeRequest(page({ openGraph: { title: 'OG headline' } }), { targetKeyword: '  seo  ' })
    expect(request).toMatchObject({
      title: 'OG headline',
      metaDescription: 'Meta',
      urlSlug: '/blog/post',
      platform: 'website',
      targetKeyword: 'seo',
      contentTemplate: 'blog',
    })
    expect(request.content).toContain('# H1 text')
  })

  it('falls back to the H1 for the headline', () => {
    expect(buildAnalyzeRequest(page()).request.title).toBe('H1 text')
  })
})

describe('detectTemplate', () => {
  it('detects product pages as landing pages', () => {
    expect(detectTemplate(page({ structuredDataTypes: ['Product'] }))).toBe('landing_page')
    expect(detectTemplate(page({ structuredDataTypes: ['Product', 'Article'] }))).toBe('blog')
  })
})

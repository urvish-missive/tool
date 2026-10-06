/**
 * Extracts the useful, analysable parts of a web page.
 *
 * Runs inside the page (content script), so it only reads the DOM and never
 * modifies it. Pure DOM APIs only: it is also unit-tested against jsdom.
 */
import type { ContentBlock, PageContent, PageHeading, PageImage, PageLink } from '../types/page'
import { bareHost, countWords, isGenericAnchorText, normalizeWhitespace, truncate } from './textCleaner'

export const EXTRACTION_LIMITS = {
  maxBlocks: 2500,
  maxBlockChars: 4000,
  maxVisitedElements: 25000,
  maxHeadings: 150,
  maxHeadingChars: 300,
  maxLinks: 300,
  maxLinkScan: 5000,
  maxLinkTextChars: 150,
  maxImages: 200,
  maxImageScan: 2000,
  maxAltChars: 300,
  maxJsonLdBlocks: 10,
  maxJsonLdChars: 50000,
} as const

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CANVAS', 'IFRAME', 'OBJECT', 'EMBED',
  'NAV', 'ASIDE', 'FORM', 'BUTTON', 'SELECT', 'TEXTAREA', 'INPUT', 'LABEL', 'DIALOG',
  'VIDEO', 'AUDIO', 'MAP', 'HEAD', 'LINK', 'META', 'FOOTER', 'MATH',
])

const NOISE_ROLES = new Set([
  'navigation', 'banner', 'contentinfo', 'complementary', 'dialog', 'alertdialog', 'search', 'menu', 'menubar',
])

// Matched against class + id tokens. Word-boundary style so "shared-content"
// or "advertiser-story" are not caught by "share" / "ad".
const NOISE_TOKEN =
  /(^|[\s_-])(cookies?|consent|gdpr|cmp|ads?|advert(isement)?s?|adslot|dfp|sponsored|newsletter|subscribe|share|sharing|social|related(-posts)?|recommended|comments?|breadcrumbs?|sidebar|popup|modal|outbrain|taboola|skip-link|sr-only|visually-hidden)([\s_-]|$)/i

const BOILERPLATE_TEXT = /^(advertisement|sponsored|share|tweet|print|email|skip to (main )?content|menu)$/i

const MAIN_CONTENT_SELECTORS = [
  '[itemprop="articleBody"]',
  '.entry-content',
  '.post-content',
  '.article-content',
  '.article-body',
  '.post-body',
  '.blog-post',
  '#content',
  '.content',
]

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'])
const BLOCK_CONTAINERS = new Set([
  'DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'UL', 'OL', 'DL', 'DT', 'DD', 'TABLE', 'THEAD',
  'TBODY', 'TFOOT', 'FIGURE', 'FIGCAPTION', 'DETAILS', 'SUMMARY', 'HGROUP', 'ADDRESS', 'CENTER',
])

/* ── Visibility & noise ────────────────────────────────────────────── */

function isHidden(el: Element, win: Window): boolean {
  if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return true
  const anyEl = el as Element & { checkVisibility?: (o?: object) => boolean }
  if (typeof anyEl.checkVisibility === 'function') {
    if (anyEl.checkVisibility({ checkVisibilityCSS: true })) return false
    // display: contents has no box but its children are rendered.
    return win.getComputedStyle(el).display !== 'contents'
  }
  const style = win.getComputedStyle(el)
  return style.display === 'none' || style.visibility === 'hidden'
}

/**
 * 'hard' = structurally never content (scripts, nav, dialogs).
 * 'soft' = class/id looks like ads, cookie banners, share bars... Heuristic, so
 * the walker double-checks it before dropping a large block.
 */
function noiseKind(el: Element): 'hard' | 'soft' | null {
  if (SKIP_TAGS.has(el.tagName)) return 'hard'
  const role = el.getAttribute('role')
  if (role && NOISE_ROLES.has(role)) return 'hard'
  if (el.getAttribute('aria-modal') === 'true') return 'hard'
  // Site headers hold navigation; article headers hold the H1 and are kept.
  if (el.tagName === 'HEADER' && el.querySelector('nav, [role="navigation"]')) return 'hard'
  const tokens = `${typeof el.className === 'string' ? el.className : ''} ${el.id || ''}`
  return tokens.trim().length > 0 && NOISE_TOKEN.test(tokens) ? 'soft' : null
}

function isNoise(el: Element): boolean {
  return noiseKind(el) !== null
}

/** A class like "comments-enabled" on the article wrapper must not drop the article. */
function shouldSkip(el: Element, state: WalkState): boolean {
  const kind = noiseKind(el)
  if (kind === 'hard') return true
  if (kind === 'soft') {
    return !el.querySelector('h1') && textLength(el) < state.rootTextLength * 0.5
  }
  return false
}

function elementText(el: Element): string {
  const html = el as HTMLElement
  // innerText respects CSS (hidden text excluded); jsdom lacks it.
  return normalizeWhitespace(typeof html.innerText === 'string' ? html.innerText : el.textContent)
}

/* ── Main content detection ────────────────────────────────────────── */

function textLength(el: Element): number {
  return (el.textContent || '').replace(/\s+/g, ' ').length
}

/** Readability-style fallback: the container holding the most paragraph text. */
function findByParagraphDensity(doc: Document): Element | null {
  const scores = new Map<Element, number>()
  const paragraphs = doc.querySelectorAll('p')
  const limit = Math.min(paragraphs.length, 3000)
  for (let i = 0; i < limit; i++) {
    const p = paragraphs[i]
    const len = textLength(p)
    if (len < 40) continue
    const parent = p.parentElement
    if (parent) scores.set(parent, (scores.get(parent) || 0) + len)
    const grand = parent?.parentElement
    if (grand) scores.set(grand, (scores.get(grand) || 0) + len / 2)
  }
  let best: Element | null = null
  let bestScore = 0
  for (const [el, score] of scores) {
    if (score > bestScore && !isNoise(el)) {
      best = el
      bestScore = score
    }
  }
  return bestScore >= 200 ? best : null
}

export function findMainContentRoot(doc: Document): { el: Element; strategy: string } {
  const articles = Array.from(doc.querySelectorAll('article'))
  if (articles.length) {
    const best = articles.reduce((a, b) => (textLength(b) > textLength(a) ? b : a))
    if (textLength(best) >= 200) return { el: best, strategy: 'article' }
  }

  for (const selector of ['main', '[role="main"]']) {
    const el = doc.querySelector(selector)
    if (el && textLength(el) >= 200) return { el, strategy: selector }
  }

  for (const selector of MAIN_CONTENT_SELECTORS) {
    const el = doc.querySelector(selector)
    if (el && textLength(el) >= 200) return { el, strategy: selector }
  }

  const dense = findByParagraphDensity(doc)
  if (dense) return { el: dense, strategy: 'paragraph-density' }

  return { el: doc.body || doc.documentElement, strategy: 'body' }
}

/* ── Block walker ──────────────────────────────────────────────────── */

interface WalkState {
  rootTextLength: number
  blocks: ContentBlock[]
  visited: number
  capped: boolean
}

function pushBlock(state: WalkState, block: ContentBlock) {
  const text = truncate(block.text, EXTRACTION_LIMITS.maxBlockChars)
  if (text.length < 2 || BOILERPLATE_TEXT.test(text)) return
  if (state.blocks.length >= EXTRACTION_LIMITS.maxBlocks) {
    state.capped = true
    return
  }
  state.blocks.push({ ...block, text })
}

function walkBlocks(
  node: Node,
  state: WalkState,
  win: Window,
  buffer: string[],
  bufferType: ContentBlock['type'],
  root: Element,
) {
  const flush = () => {
    const text = normalizeWhitespace(buffer.join(''))
    buffer.length = 0
    if (text) pushBlock(state, { type: bufferType, level: 0, text })
  }

  for (const child of Array.from(node.childNodes)) {
    if (state.capped) return

    if (child.nodeType === 3 /* TEXT_NODE */) {
      buffer.push(child.nodeValue || '')
      continue
    }
    if (child.nodeType !== 1 /* ELEMENT_NODE */) continue

    const el = child as Element
    if (++state.visited > EXTRACTION_LIMITS.maxVisitedElements) {
      state.capped = true
      return
    }
    if (el !== root && (shouldSkip(el, state) || isHidden(el, win))) continue

    const tag = el.tagName

    if (tag === 'BR') {
      buffer.push(' ')
    } else if (HEADING_TAGS.has(tag)) {
      flush()
      pushBlock(state, { type: 'heading', level: Number(tag[1]), text: elementText(el) })
    } else if (tag === 'PRE') {
      flush()
      pushBlock(state, { type: 'code', level: 0, text: (el.textContent || '').trim() })
    } else if (tag === 'TR') {
      flush()
      const cells = Array.from(el.children)
        .filter((c) => c.tagName === 'TD' || c.tagName === 'TH')
        .map((c) => elementText(c).replace(/\|/g, '/'))
      if (cells.some(Boolean)) pushBlock(state, { type: 'paragraph', level: 0, text: `| ${cells.join(' | ')} |` })
    } else if (tag === 'P' || tag === 'LI' || tag === 'BLOCKQUOTE') {
      flush()
      const type = tag === 'LI' ? 'list_item' : tag === 'BLOCKQUOTE' ? 'quote' : 'paragraph'
      walkBlocks(el, state, win, [], type, root)
    } else if (BLOCK_CONTAINERS.has(tag)) {
      flush()
      walkBlocks(el, state, win, [], 'paragraph', root)
    } else {
      // Inline element (a, span, strong, em, ...): keep text in the current block.
      walkBlocks(el, state, win, buffer, bufferType, root)
      continue
    }
  }
  flush()
}

/* ── Metadata ──────────────────────────────────────────────────────── */

function metaContent(doc: Document, selector: string): string {
  return normalizeWhitespace(doc.querySelector(selector)?.getAttribute('content'))
}

function absoluteUrl(href: string | null | undefined, base: string): string {
  if (!href) return ''
  try {
    return new URL(href, base).href
  } catch {
    return ''
  }
}

function collectJsonLdTypes(node: unknown, out: Set<string>, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 6) return
  if (Array.isArray(node)) {
    node.forEach((n) => collectJsonLdTypes(n, out, depth + 1))
    return
  }
  const obj = node as Record<string, unknown>
  const type = obj['@type']
  if (typeof type === 'string') out.add(type)
  else if (Array.isArray(type)) type.forEach((t) => typeof t === 'string' && out.add(t))
  if (obj['@graph']) collectJsonLdTypes(obj['@graph'], out, depth + 1)
}

/* ── Links & images ────────────────────────────────────────────────── */

function collectLinks(doc: Document, root: Element, pageUrl: URL) {
  const links: PageLink[] = []
  const totals = { internal: 0, external: 0, empty: 0, generic: 0 }
  const anchors = doc.querySelectorAll('a[href]')
  const scan = Math.min(anchors.length, EXTRACTION_LIMITS.maxLinkScan)
  const pageHost = bareHost(pageUrl.hostname)

  for (let i = 0; i < scan; i++) {
    const a = anchors[i] as HTMLAnchorElement
    const raw = a.getAttribute('href') || ''
    if (/^(javascript:|mailto:|tel:|sms:|#)/i.test(raw.trim())) continue

    let url: URL
    try {
      url = new URL(raw, pageUrl.href)
    } catch {
      continue
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue

    const imgAlt = Array.from(a.querySelectorAll('img[alt]'))
      .map((img) => img.getAttribute('alt') || '')
      .join(' ')
    const text = truncate(
      normalizeWhitespace(a.textContent) ||
        normalizeWhitespace(a.getAttribute('aria-label')) ||
        normalizeWhitespace(a.getAttribute('title')) ||
        normalizeWhitespace(imgAlt),
      EXTRACTION_LIMITS.maxLinkTextChars,
    )
    const type = bareHost(url.hostname) === pageHost ? 'internal' : 'external'
    const emptyText = text.length === 0
    const genericText = !emptyText && isGenericAnchorText(text)

    totals[type]++
    if (emptyText) totals.empty++
    if (genericText) totals.generic++

    if (links.length < EXTRACTION_LIMITS.maxLinks) {
      links.push({
        url: url.href,
        text,
        type,
        emptyText,
        genericText,
        nofollow: /\bnofollow\b/i.test(a.getAttribute('rel') || ''),
        inContent: root.contains(a),
      })
    }
  }
  return { links, totals, capped: anchors.length > EXTRACTION_LIMITS.maxLinks }
}

function collectImages(doc: Document, pageUrl: URL) {
  const images: PageImage[] = []
  const totals = { total: 0, withAlt: 0, missingAlt: 0, decorative: 0 }
  const nodes = doc.querySelectorAll('img')
  const scan = Math.min(nodes.length, EXTRACTION_LIMITS.maxImageScan)

  for (let i = 0; i < scan; i++) {
    const img = nodes[i] as HTMLImageElement
    const width = Number(img.getAttribute('width')) || img.naturalWidth || 0
    const height = Number(img.getAttribute('height')) || img.naturalHeight || 0
    // Tracking pixels and spacers are not content images.
    if ((width > 0 && width <= 2) || (height > 0 && height <= 2)) continue

    const rawSrc = img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || ''
    const src = rawSrc.startsWith('data:') ? 'data:(inline image)' : absoluteUrl(rawSrc, pageUrl.href)
    if (!src) continue

    const altAttr = img.getAttribute('alt')
    const alt = altAttr === null ? null : truncate(normalizeWhitespace(altAttr), EXTRACTION_LIMITS.maxAltChars)

    totals.total++
    if (alt === null) totals.missingAlt++
    else if (alt === '') totals.decorative++
    else totals.withAlt++

    if (images.length < EXTRACTION_LIMITS.maxImages) images.push({ src, alt })
  }
  return { images, totals, capped: totals.total > EXTRACTION_LIMITS.maxImages }
}

/* ── Entry point ───────────────────────────────────────────────────── */

export function extractPage(doc: Document, win: Window): PageContent {
  const pageUrl = new URL(win.location.href)
  const { el: root, strategy } = findMainContentRoot(doc)

  const state: WalkState = { rootTextLength: textLength(root), blocks: [], visited: 0, capped: false }
  walkBlocks(root, state, win, [], 'paragraph', root)
  // Collapse consecutive duplicates (e.g. figure captions repeated in alt + caption)
  const blocks = state.blocks.filter((b, i, arr) => i === 0 || b.text !== arr[i - 1].text)

  const content = blocks.map((b) => b.text).join('\n\n')

  const headings: PageHeading[] = []
  for (const h of Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))) {
    if (headings.length >= EXTRACTION_LIMITS.maxHeadings) break
    if (isHidden(h, win)) continue
    const text = truncate(elementText(h), EXTRACTION_LIMITS.maxHeadingChars)
    if (text) headings.push({ level: Number(h.tagName[1]), text })
  }

  const { links, totals: linkTotals, capped: linksCapped } = collectLinks(doc, root, pageUrl)
  const { images, totals: imageTotals, capped: imagesCapped } = collectImages(doc, pageUrl)

  const structuredData: unknown[] = []
  const types = new Set<string>()
  for (const script of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
    if (structuredData.length >= EXTRACTION_LIMITS.maxJsonLdBlocks) break
    const raw = script.textContent || ''
    if (!raw.trim() || raw.length > EXTRACTION_LIMITS.maxJsonLdChars) continue
    try {
      const parsed: unknown = JSON.parse(raw)
      structuredData.push(parsed)
      collectJsonLdTypes(parsed, types)
    } catch {
      // Malformed JSON-LD on the page; ignore it.
    }
  }

  return {
    url: pageUrl.href,
    title: normalizeWhitespace(doc.title),
    metaDescription: metaContent(doc, 'meta[name="description" i]'),
    canonical: absoluteUrl(doc.querySelector('link[rel="canonical" i]')?.getAttribute('href'), pageUrl.href),
    language: normalizeWhitespace(doc.documentElement.getAttribute('lang')),
    robots: metaContent(doc, 'meta[name="robots" i]'),
    viewport: metaContent(doc, 'meta[name="viewport" i]'),

    headings,
    blocks,
    content,
    wordCount: countWords(content),
    paragraphCount: blocks.filter((b) => b.type === 'paragraph').length,
    contentLength: content.length,
    contentRoot: strategy,

    links,
    linkTotals,
    images,
    imageTotals,

    openGraph: {
      title: metaContent(doc, 'meta[property="og:title"]') || undefined,
      description: metaContent(doc, 'meta[property="og:description"]') || undefined,
      image: absoluteUrl(doc.querySelector('meta[property="og:image"]')?.getAttribute('content'), pageUrl.href) || undefined,
      type: metaContent(doc, 'meta[property="og:type"]') || undefined,
    },
    twitter: {
      card: metaContent(doc, 'meta[name="twitter:card"]') || undefined,
      title: metaContent(doc, 'meta[name="twitter:title"]') || undefined,
      description: metaContent(doc, 'meta[name="twitter:description"]') || undefined,
      image: absoluteUrl(doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content'), pageUrl.href) || undefined,
    },

    structuredData,
    structuredDataTypes: Array.from(types),

    limits: { blocksCapped: state.capped, linksCapped, imagesCapped },
    extractedAt: new Date().toISOString(),
  }
}

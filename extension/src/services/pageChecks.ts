/**
 * Deterministic on-page SEO checks computed locally from the extracted page.
 * These cover what only a live page has (meta tags, alt text, links, schema),
 * which the text-based Content QA engine does not see. No network, no AI.
 */
import type { PageContent } from '../types/page'

export type CheckStatus = 'pass' | 'warning' | 'fail' | 'info'

export interface PageCheck {
  id: string
  group: 'Metadata' | 'Headings' | 'Content' | 'Links' | 'Images' | 'Social & schema'
  label: string
  status: CheckStatus
  detail: string
}

function lengthCheck(
  id: string,
  label: string,
  value: string,
  [min, max]: [number, number],
  missingStatus: CheckStatus,
): PageCheck {
  if (!value) return { id, group: 'Metadata', label, status: missingStatus, detail: 'Missing.' }
  const len = value.length
  if (len < min) return { id, group: 'Metadata', label, status: 'warning', detail: `${len} characters. Aim for ${min}–${max}.` }
  if (len > max) return { id, group: 'Metadata', label, status: 'warning', detail: `${len} characters; may be truncated in search results (aim for ${min}–${max}).` }
  return { id, group: 'Metadata', label, status: 'pass', detail: `${len} characters.` }
}

function sameUrl(a: string, b: string): boolean {
  const clean = (u: string) => {
    try {
      const url = new URL(u)
      url.hash = ''
      return url.href.replace(/\/$/, '').toLowerCase()
    } catch {
      return u
    }
  }
  return clean(a) === clean(b)
}

export function runPageChecks(page: PageContent): PageCheck[] {
  const checks: PageCheck[] = []

  /* Metadata */
  checks.push(lengthCheck('title', 'Title tag', page.title, [30, 60], 'fail'))
  checks.push(lengthCheck('meta-description', 'Meta description', page.metaDescription, [70, 160], 'fail'))

  if (!page.canonical) {
    checks.push({ id: 'canonical', group: 'Metadata', label: 'Canonical URL', status: 'warning', detail: 'No canonical tag.' })
  } else if (!sameUrl(page.canonical, page.url)) {
    checks.push({ id: 'canonical', group: 'Metadata', label: 'Canonical URL', status: 'info', detail: `Points to another URL: ${page.canonical}` })
  } else {
    checks.push({ id: 'canonical', group: 'Metadata', label: 'Canonical URL', status: 'pass', detail: 'Self-referencing.' })
  }

  const robots = page.robots.toLowerCase()
  if (/noindex/.test(robots)) {
    checks.push({ id: 'robots', group: 'Metadata', label: 'Robots meta', status: 'fail', detail: `"${page.robots}". This page asks search engines not to index it.` })
  } else if (/nofollow/.test(robots)) {
    checks.push({ id: 'robots', group: 'Metadata', label: 'Robots meta', status: 'warning', detail: `"${page.robots}". Links on this page pass no signals.` })
  } else {
    checks.push({ id: 'robots', group: 'Metadata', label: 'Robots meta', status: 'pass', detail: page.robots ? `"${page.robots}"` : 'Indexable (no restrictions).' })
  }

  checks.push(
    page.language
      ? { id: 'lang', group: 'Metadata', label: 'Language', status: 'pass', detail: `lang="${page.language}"` }
      : { id: 'lang', group: 'Metadata', label: 'Language', status: 'warning', detail: 'No lang attribute on <html>.' },
  )
  checks.push(
    page.viewport
      ? { id: 'viewport', group: 'Metadata', label: 'Mobile viewport', status: 'pass', detail: 'Viewport meta tag present.' }
      : { id: 'viewport', group: 'Metadata', label: 'Mobile viewport', status: 'warning', detail: 'No viewport meta tag.' },
  )

  /* Headings */
  const h1s = page.headings.filter((h) => h.level === 1)
  if (h1s.length === 0) {
    checks.push({ id: 'h1', group: 'Headings', label: 'H1 heading', status: 'fail', detail: 'No H1 on the page.' })
  } else if (h1s.length > 1) {
    checks.push({ id: 'h1', group: 'Headings', label: 'H1 heading', status: 'warning', detail: `${h1s.length} H1 headings. Use one main H1.` })
  } else {
    checks.push({ id: 'h1', group: 'Headings', label: 'H1 heading', status: 'pass', detail: h1s[0].text })
  }

  let skip: string | null = null
  for (let i = 1; i < page.headings.length; i++) {
    const prev = page.headings[i - 1].level
    const cur = page.headings[i].level
    if (cur > prev + 1) {
      skip = `H${prev} → H${cur} before "${page.headings[i].text.slice(0, 60)}"`
      break
    }
  }
  checks.push(
    skip
      ? { id: 'hierarchy', group: 'Headings', label: 'Heading hierarchy', status: 'warning', detail: `Skipped level: ${skip}.` }
      : { id: 'hierarchy', group: 'Headings', label: 'Heading hierarchy', status: 'pass', detail: `${page.headings.length} headings, no skipped levels.` },
  )

  /* Content */
  checks.push(
    page.wordCount < 300
      ? { id: 'word-count', group: 'Content', label: 'Content length', status: 'warning', detail: `${page.wordCount} words in the main content. Thin pages rarely rank for competitive terms.` }
      : { id: 'word-count', group: 'Content', label: 'Content length', status: 'pass', detail: `${page.wordCount.toLocaleString()} words in the main content.` },
  )

  /* Links */
  const contentInternal = page.links.filter((l) => l.inContent && l.type === 'internal').length
  checks.push(
    contentInternal === 0
      ? { id: 'internal-links', group: 'Links', label: 'Internal links in content', status: 'warning', detail: 'No internal links inside the main content.' }
      : { id: 'internal-links', group: 'Links', label: 'Internal links in content', status: 'pass', detail: `${contentInternal} internal link(s) in the content; ${page.linkTotals.internal} on the page.` },
  )
  checks.push({
    id: 'external-links',
    group: 'Links',
    label: 'External links',
    status: 'info',
    detail: `${page.linkTotals.external} external link(s) on the page.`,
  })
  if (page.linkTotals.empty > 0) {
    checks.push({ id: 'empty-anchors', group: 'Links', label: 'Empty anchor text', status: 'warning', detail: `${page.linkTotals.empty} link(s) have no text, aria-label or image alt.` })
  }
  if (page.linkTotals.generic > 0) {
    const examples = page.links.filter((l) => l.genericText).slice(0, 3).map((l) => `"${l.text}"`).join(', ')
    checks.push({ id: 'generic-anchors', group: 'Links', label: 'Generic anchor text', status: 'warning', detail: `${page.linkTotals.generic} link(s) use vague text such as ${examples}.` })
  }

  /* Images */
  const img = page.imageTotals
  if (img.total === 0) {
    checks.push({ id: 'images', group: 'Images', label: 'Images', status: 'info', detail: 'No images found.' })
  } else if (img.missingAlt > 0) {
    checks.push({
      id: 'alt-text',
      group: 'Images',
      label: 'Image alt text',
      status: img.missingAlt / img.total > 0.5 ? 'fail' : 'warning',
      detail: `${img.missingAlt} of ${img.total} images have no alt attribute.`,
    })
  } else {
    checks.push({ id: 'alt-text', group: 'Images', label: 'Image alt text', status: 'pass', detail: `All ${img.total} images have alt attributes (${img.decorative} marked decorative).` })
  }

  /* Social & schema */
  const ogMissing = [
    !page.openGraph.title && 'og:title',
    !page.openGraph.description && 'og:description',
    !page.openGraph.image && 'og:image',
  ].filter(Boolean)
  checks.push(
    ogMissing.length
      ? { id: 'open-graph', group: 'Social & schema', label: 'Open Graph', status: 'warning', detail: `Missing ${ogMissing.join(', ')}.` }
      : { id: 'open-graph', group: 'Social & schema', label: 'Open Graph', status: 'pass', detail: 'Title, description and image set.' },
  )
  checks.push(
    page.twitter.card
      ? { id: 'twitter', group: 'Social & schema', label: 'Twitter / X card', status: 'pass', detail: `twitter:card = ${page.twitter.card}` }
      : { id: 'twitter', group: 'Social & schema', label: 'Twitter / X card', status: 'info', detail: 'No twitter:card tag (X falls back to Open Graph).' },
  )
  checks.push(
    page.structuredDataTypes.length
      ? { id: 'schema', group: 'Social & schema', label: 'Structured data', status: 'pass', detail: page.structuredDataTypes.slice(0, 8).join(', ') }
      : { id: 'schema', group: 'Social & schema', label: 'Structured data', status: 'warning', detail: 'No JSON-LD structured data found.' },
  )

  return checks
}

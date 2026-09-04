import { createIssue } from '../../utils/helpers.js'

export function analyzeSchema(pages) {
  const issues = []
  const allSchemas = new Set()
  const pageSchemaBreakdown = []
  let pagesWithSchema = 0
  let pagesWithOG = 0
  let pagesWithTwitter = 0

  pages.forEach(p => {
    const pageSchemas = p.schemas || []
    pageSchemas.forEach(s => allSchemas.add(s))

    if (pageSchemas.length > 0) pagesWithSchema++
    if (p.og?.title && p.og?.description) pagesWithOG++
    if (p.twitter?.card) pagesWithTwitter++

    pageSchemaBreakdown.push({
      url: p.url,
      schemas: pageSchemas,
      hasOg: Boolean(p.og?.title && p.og?.description),
      hasTwitter: Boolean(p.twitter?.card),
      schemaObjects: p.schemaObjects || [],
    })
  })

  // 1. Structured Data JSON-LD Check
  if (pagesWithSchema === 0) {
    issues.push(
      createIssue(
        'schema',
        'HIGH',
        'No Schema.org Structured Data Detected',
        'Structured data (JSON-LD) enables search engines to understand entity relationships and generates rich snippets (stars, FAQs, breadcrumbs, logos) in search results.',
        'Implement JSON-LD schemas such as Organization, WebSite, BreadcrumbList, and Article / LocalBusiness using Schema.org standards.',
        {
          affectedPages: pages.map(p => p.url),
          evidence: '0 pages have application/ld+json or microdata schemas',
        }
      )
    )
  } else if (pagesWithSchema < pages.length) {
    const missingSchemaPages = pages.filter(p => !p.schemas || p.schemas.length === 0)
    issues.push(
      createIssue(
        'schema',
        'LOW',
        'Partial Schema.org Coverage Across Pages',
        'Some indexed pages lack structured data markup, missing opportunities for enhanced rich result eligibility.',
        'Add contextual schemas (e.g. Article, BreadcrumbList, FAQPage, Service) to all key landing and content pages.',
        {
          affectedPages: missingSchemaPages.map(p => p.url),
          affectedItems: missingSchemaPages.map(p => ({
            url: p.url,
            evidence: 'No JSON-LD schema found on this page',
          })),
        }
      )
    )
  }

  // 2. Open Graph Metadata Check
  const incompleteOgPages = pages.filter(p => !p.og?.title || !p.og?.description || !p.og?.image)
  if (incompleteOgPages.length > 0) {
    issues.push(
      createIssue(
        'schema',
        'LOW',
        'Incomplete Open Graph (OG) Social Tags',
        'Open Graph tags (og:title, og:description, og:image) control how URLs appear when shared on LinkedIn, Facebook, Slack, and X.',
        'Add complete og:title, og:description, og:image, and og:url tags to the <head> of every page.',
        {
          affectedPages: incompleteOgPages.map(p => p.url),
          affectedItems: incompleteOgPages.map(p => {
            const missing = []
            if (!p.og?.title) missing.push('og:title')
            if (!p.og?.description) missing.push('og:description')
            if (!p.og?.image) missing.push('og:image')
            return {
              url: p.url,
              evidence: `Missing: ${missing.join(', ')}`,
            }
          }),
        }
      )
    )
  }

  // 3. Twitter Card Metadata Check
  const missingTwitterPages = pages.filter(p => !p.twitter?.card)
  if (missingTwitterPages.length > 0) {
    issues.push(
      createIssue(
        'schema',
        'INFO',
        'Missing Twitter Card Metadata',
        'Twitter Cards enable rich preview cards with prominent images and summaries when links are shared on X / Twitter.',
        'Add `<meta name="twitter:card" content="summary_large_image">` along with twitter:title and twitter:image.',
        {
          affectedPages: missingTwitterPages.map(p => p.url),
          evidence: `${missingTwitterPages.length} page(s) missing twitter:card`,
        }
      )
    )
  }

  return {
    issues,
    summary: {
      schemasFound: [...allSchemas],
      totalSchemas: allSchemas.size,
      pagesWithSchema,
      pagesWithOG,
      pagesWithTwitter,
      pageBreakdown: pageSchemaBreakdown,
    },
  }
}

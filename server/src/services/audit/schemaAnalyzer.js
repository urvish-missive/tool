import { createIssue } from '../../utils/helpers.js'

export function analyzeSchema(pages) {
  const issues = []
  const allSchemas = new Set()
  let pagesWithSchema = 0
  let pagesWithOG = 0
  let pagesWithTwitter = 0

  pages.forEach(p => {
    p.schemas.forEach(s => allSchemas.add(s))
    if (p.schemas.length > 0) pagesWithSchema++
    if (p.og.title && p.og.description) pagesWithOG++
    if (p.twitter.card) pagesWithTwitter++
  })

  if (pagesWithSchema === 0) {
    issues.push(createIssue('schema', 'MEDIUM', 'No structured data detected', 'None of the crawled pages contain JSON-LD structured data.', 'Add relevant structured data (Organization, Article, etc.).'))
  }

  pages.filter(p => !p.og.title || !p.og.description || !p.og.image).forEach(p => {
    const missing = []
    if (!p.og.title) missing.push('og:title')
    if (!p.og.description) missing.push('og:description')
    if (!p.og.image) missing.push('og:image')
    issues.push(createIssue('schema', 'LOW', 'Incomplete Open Graph metadata', `Page: ${p.url} is missing: ${missing.join(', ')}`, 'Add complete Open Graph tags for better social sharing.'))
  })

  const missingTwitter = pages.filter(p => !p.twitter.card)
  if (missingTwitter.length > 0) {
    issues.push(createIssue('schema', 'INFO', `${missingTwitter.length} page(s) missing Twitter Card metadata`, 'Twitter Card tags help control how content appears when shared.', 'Add twitter:card, twitter:title, twitter:description, and twitter:image.'))
  }

  return {
    issues,
    summary: {
      schemasFound: [...allSchemas],
      pagesWithSchema,
      pagesWithOG,
      pagesWithTwitter,
      totalSchemas: allSchemas.size,
    },
  }
}

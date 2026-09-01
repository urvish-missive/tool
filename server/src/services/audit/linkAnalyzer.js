import { createIssue } from '../../utils/helpers.js'

export function analyzeLinks(crawlData) {
  const { pages } = crawlData
  const issues = []
  let totalInternal = 0
  let totalExternal = 0
  let pagesWithFewLinks = 0

  pages.forEach(p => {
    totalInternal += p.links.internal.length
    totalExternal += p.links.external.length
    if (p.links.internal.length < 2 && p.wordCount > 200) pagesWithFewLinks++
  })

  if (pagesWithFewLinks > 0) {
    issues.push(createIssue('links', 'MEDIUM', `${pagesWithFewLinks} page(s) have very few internal links`, 'Some pages may have weak internal linking.', 'Add relevant internal links between related pages.'))
  }
  if (totalInternal === 0 && pages.length > 1) {
    issues.push(createIssue('links', 'HIGH', 'No internal links detected between pages', 'Crawled pages do not link to each other.', 'Create a logical internal linking structure.'))
  }

  return {
    issues,
    summary: {
      totalInternalLinks: totalInternal,
      totalExternalLinks: totalExternal,
      pagesWithFewLinks,
      avgInternalLinks: pages.length > 0 ? Math.round(totalInternal / pages.length) : 0,
    },
  }
}

import { createIssue } from '../../utils/helpers.js'

export function analyzeLinks(crawlData) {
  const { pages } = crawlData
  const issues = []
  let totalInternal = 0
  let totalExternal = 0
  const pagesWithFewLinks = []
  const pagesWithExcessiveLinks = []
  const emptyAnchorLinks = []

  pages.forEach(p => {
    const internalCount = p.links?.internal?.length || 0
    const externalCount = p.links?.external?.length || 0
    totalInternal += internalCount
    totalExternal += externalCount

    if (internalCount < 3 && p.wordCount > 150) {
      pagesWithFewLinks.push({ url: p.url, count: internalCount })
    }

    if (internalCount + externalCount > 120) {
      pagesWithExcessiveLinks.push({ url: p.url, count: internalCount + externalCount })
    }

    const detailed = p.links?.detailedLinks || []
    const emptyAnchors = detailed.filter(l => !l.text || l.text === '[No anchor text]')
    if (emptyAnchors.length > 0) {
      emptyAnchorLinks.push({
        url: p.url,
        count: emptyAnchors.length,
        targets: emptyAnchors.slice(0, 3).map(a => a.url),
      })
    }
  })

  if (pagesWithFewLinks.length > 0) {
    issues.push(
      createIssue(
        'links',
        'MEDIUM',
        'Pages with Weak Internal Linking (<3 internal links)',
        'Internal links distribute PageRank equity throughout your site and help search engines discover and rank deeper pages.',
        'Add contextual internal links with descriptive anchor text from related high-authority pages.',
        {
          affectedPages: pagesWithFewLinks.map(p => p.url),
          affectedItems: pagesWithFewLinks.map(p => ({
            url: p.url,
            evidence: `Contains only ${p.count} internal link(s)`,
          })),
        }
      )
    )
  }

  if (totalInternal === 0 && pages.length > 1) {
    issues.push(
      createIssue(
        'links',
        'HIGH',
        'No Internal Links Detected Between Pages',
        'None of the crawled pages link to each other, creating isolated silos that hinder crawl efficiency.',
        'Implement structured navigation menus, breadcrumbs, and contextual body links between related content.',
        {
          affectedPages: pages.map(p => p.url),
          evidence: '0 internal cross-links detected across crawled set',
        }
      )
    )
  }

  if (emptyAnchorLinks.length > 0) {
    issues.push(
      createIssue(
        'links',
        'LOW',
        'Links Missing Descriptive Anchor Text',
        'Generic or empty anchor text fails to pass contextual relevance signals to target destination pages.',
        'Use meaningful, keyword-rich anchor text that accurately describes the destination page content.',
        {
          affectedPages: emptyAnchorLinks.map(p => p.url),
          affectedItems: emptyAnchorLinks.map(p => ({
            url: p.url,
            evidence: `${p.count} link(s) with empty anchor text (e.g. ${p.targets.join(', ')})`,
          })),
        }
      )
    )
  }

  return {
    issues,
    summary: {
      totalInternalLinks: totalInternal,
      totalExternalLinks: totalExternal,
      pagesWithFewLinks: pagesWithFewLinks.length,
      avgInternalLinks: pages.length > 0 ? Math.round(totalInternal / pages.length) : 0,
    },
  }
}

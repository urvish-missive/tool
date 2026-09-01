import { createIssue } from '../../utils/helpers.js'

export function analyzeTechnical(crawlData) {
  const { targetUrl, pages, robotsTxt, sitemapXml } = crawlData
  const parsed = new URL(targetUrl)
  const issues = []
  const checks = {}

  // HTTPS
  const isHTTPS = parsed.protocol === 'https:'
  checks.https = { pass: isHTTPS, detail: isHTTPS ? 'HTTPS enabled' : 'Website is not using HTTPS' }
  if (!isHTTPS) issues.push(createIssue('technical', 'CRITICAL', 'Website is not using HTTPS', 'The website does not use HTTPS.', 'Install an SSL/TLS certificate and redirect HTTP to HTTPS.'))

  // Robots.txt
  if (!robotsTxt) {
    checks.robotsTxt = { pass: false, detail: 'robots.txt not found' }
    issues.push(createIssue('technical', 'MEDIUM', 'Missing robots.txt', 'No robots.txt file was found.', 'Create a robots.txt file to guide search engine crawlers.'))
  } else {
    const hasSitemapRef = /sitemap/i.test(robotsTxt)
    checks.robotsTxt = { pass: true, detail: `robots.txt found${hasSitemapRef ? ' with sitemap reference' : ''}` }
    if (!hasSitemapRef) issues.push(createIssue('technical', 'LOW', 'robots.txt missing sitemap reference', 'robots.txt exists but has no sitemap directive.', 'Add a Sitemap directive to your robots.txt.'))
  }

  // Sitemap
  if (!sitemapXml || sitemapXml.length < 50) {
    checks.sitemap = { pass: false, detail: 'XML sitemap not found' }
    issues.push(createIssue('technical', 'HIGH', 'Missing XML sitemap', 'No XML sitemap was found.', 'Create and submit an XML sitemap to search engines.'))
  } else {
    const isValid = sitemapXml.includes('<?xml') || sitemapXml.includes('<urlset') || sitemapXml.includes('<sitemapindex')
    const urlCount = (sitemapXml.match(/<loc>/g) || []).length
    checks.sitemap = { pass: isValid, detail: `Sitemap found with ${urlCount} URLs` }
    if (!isValid) issues.push(createIssue('technical', 'HIGH', 'Sitemap may be invalid', 'Sitemap does not appear to be valid XML.', 'Validate your sitemap format.'))
  }

  // Canonical
  const canonicalIssues = []
  pages.forEach(p => {
    if (!p.canonical) {
      canonicalIssues.push({ url: p.url, issue: 'Missing canonical tag' })
    } else {
      try {
        const canonUrl = new URL(p.canonical)
        if (canonUrl.href !== p.url && !p.canonical.includes(parsed.hostname)) {
          canonicalIssues.push({ url: p.url, issue: `Canonical points to different domain: ${p.canonical}` })
        }
      } catch {
        canonicalIssues.push({ url: p.url, issue: 'Invalid canonical URL' })
      }
    }
  })
  checks.canonical = { pass: canonicalIssues.length === 0, detail: canonicalIssues.length === 0 ? 'All pages have valid canonical tags' : `${canonicalIssues.length} canonical issues found` }
  canonicalIssues.forEach(ci => issues.push(createIssue('technical', 'HIGH', ci.issue, `Page: ${ci.url}`, 'Ensure each page has a self-referencing canonical tag.')))

  // Indexability
  const noindexPages = pages.filter(p => /noindex/i.test(p.robotsMeta))
  checks.indexability = { pass: noindexPages.length === 0, detail: noindexPages.length === 0 ? 'All pages are indexable' : `${noindexPages.length} page(s) marked noindex` }
  noindexPages.forEach(p => issues.push(createIssue('technical', 'HIGH', 'Page is blocked from indexing', `Page: ${p.url} has a noindex directive.`, 'Remove the noindex meta tag if this page should appear in search results.')))

  // HTTP Status
  const errorPages = pages.filter(p => p.statusCode >= 400)
  checks.httpStatus = { pass: errorPages.length === 0, detail: errorPages.length === 0 ? 'All pages returned valid HTTP status' : `${errorPages.length} page(s) returned errors` }
  errorPages.forEach(p => issues.push(createIssue('technical', p.statusCode >= 500 ? 'CRITICAL' : 'HIGH', `HTTP ${p.statusCode} error`, `Page: ${p.url} returned status code ${p.statusCode}.`, 'Fix the server error or redirect to a valid page.')))

  // Redirects
  const redirectPages = pages.filter(p => p.redirects > 0)
  if (redirectPages.length > 0) issues.push(createIssue('technical', 'MEDIUM', `${redirectPages.length} redirect(s) detected`, 'Some pages redirect before loading.', 'Update internal links to point directly to the final URL.'))

  return { checks, issues }
}

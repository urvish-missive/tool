import { createIssue } from '../../utils/helpers.js'

export function analyzeTechnical(crawlData) {
  const { targetUrl, pages, robotsTxt, robotsSitemapUrls, sitemapProbe } = crawlData
  const parsed = new URL(targetUrl)
  const issues = []
  const checks = {}

  // 1. HTTPS / SSL Check
  const isHTTPS = parsed.protocol === 'https:'
  checks.https = {
    pass: isHTTPS,
    label: 'HTTPS / SSL Encryption',
    detail: isHTTPS ? 'Website is served securely over HTTPS' : 'Website is not using HTTPS encryption',
  }
  if (!isHTTPS) {
    issues.push(
      createIssue(
        'security',
        'CRITICAL',
        'Website Not Using HTTPS',
        'The website is served over unencrypted HTTP. Search engines penalize non-HTTPS sites and browsers flag them as insecure.',
        'Install an SSL/TLS certificate and configure a 301 permanent redirect from HTTP to HTTPS across all pages.',
        {
          affectedPages: [targetUrl],
          evidence: `Current protocol is ${parsed.protocol}`,
        }
      )
    )
  }

  // Security Headers Check
  const pagesMissingHsts = pages.filter(p => !p.securityHeaders?.hsts)
  if (isHTTPS && pagesMissingHsts.length > 0) {
    issues.push(
      createIssue(
        'security',
        'LOW',
        'Missing HTTP Strict Transport Security (HSTS)',
        'HSTS protects against man-in-the-middle attacks by forcing browsers to communicate only over HTTPS.',
        'Add the Strict-Transport-Security header (e.g. max-age=31536000; includeSubDomains; preload).',
        {
          affectedPages: pagesMissingHsts.map(p => p.url),
          evidence: `${pagesMissingHsts.length} page(s) missing Strict-Transport-Security header`,
        }
      )
    )
  }

  // 2. Robots.txt Check
  const hasRobots = Boolean(robotsTxt && robotsTxt.trim().length > 0)
  const hasRobotsSitemap = robotsSitemapUrls && robotsSitemapUrls.length > 0
  checks.robotsTxt = {
    pass: hasRobots,
    label: 'Robots.txt Directive File',
    detail: hasRobots
      ? `robots.txt detected (${robotsTxt.length} bytes)${hasRobotsSitemap ? ` with ${robotsSitemapUrls.length} sitemap link(s)` : ''}`
      : 'No robots.txt file was found at /robots.txt',
  }
  if (!hasRobots) {
    issues.push(
      createIssue(
        'technical',
        'MEDIUM',
        'Missing robots.txt File',
        'Robots.txt guides search engine crawlers on which sections of your site to crawl and which to ignore.',
        'Create a robots.txt file in your root domain and include a Sitemap directive.',
        {
          affectedPages: [new URL('/robots.txt', targetUrl).href],
          evidence: 'HTTP 404 / empty response for /robots.txt',
        }
      )
    )
  } else if (!hasRobotsSitemap) {
    issues.push(
      createIssue(
        'technical',
        'LOW',
        'Robots.txt Missing Sitemap Reference',
        'Your robots.txt exists but does not explicitly reference your XML sitemap URL.',
        'Add a `Sitemap: https://yourdomain.com/sitemap.xml` line to your robots.txt file.',
        {
          affectedPages: [new URL('/robots.txt', targetUrl).href],
          evidence: 'No "Sitemap:" directive found in robots.txt content',
        }
      )
    )
  }

  // 3. XML Sitemap & Variations Check
  const sitemapFound = sitemapProbe?.found
  const detectedSitemaps = sitemapProbe?.detectedSitemaps || []
  const totalDiscoveredUrls = sitemapProbe?.totalDiscoveredUrls || 0

  checks.sitemap = {
    pass: sitemapFound,
    label: 'XML Sitemap Availability & Index',
    detail: sitemapFound
      ? `Found ${detectedSitemaps.length} valid sitemap(s) with ${totalDiscoveredUrls} total URL(s) indexed${sitemapProbe?.hasSitemapIndex ? ' (Sitemap Index detected)' : ''}`
      : 'No valid XML sitemap found across standard variations (/sitemap.xml, /sitemap_index.xml, etc.)',
    detectedSitemaps,
    probedResults: sitemapProbe?.probedResults || [],
  }

  if (!sitemapFound) {
    issues.push(
      createIssue(
        'technical',
        'HIGH',
        'Missing XML Sitemap',
        'No valid XML sitemap was found across probed variations (/sitemap.xml, /sitemap_index.xml, /wp-sitemap.xml). XML sitemaps ensure all pages are discovered efficiently.',
        'Generate an XML sitemap (or sitemap index) and submit it to Google Search Console and Bing Webmaster Tools.',
        {
          affectedPages: [new URL('/sitemap.xml', targetUrl).href],
          evidence: 'Probed /sitemap.xml, /sitemap_index.xml, /wp-sitemap.xml without success',
        }
      )
    )
  }

  // 4. URL Structure Diagnostics
  const urlIssues = []
  pages.forEach((p) => {
    try {
      const pageUrlObj = new URL(p.url)
      const pathname = pageUrlObj.pathname

      const problems = []
      if (p.url.length > 100) problems.push(`Length is ${p.url.length} chars (recommend < 100)`)
      if (/[A-Z]/.test(pathname)) problems.push('Contains uppercase characters (use lowercase)')
      if (/_/.test(pathname)) problems.push('Contains underscores (Google recommends hyphens)')
      if (pageUrlObj.search && pageUrlObj.search.length > 1)
        problems.push(`Contains dynamic query params: "${pageUrlObj.search}"`)
      const depth = pathname.split('/').filter(Boolean).length
      if (depth > 4) problems.push(`Deep folder depth (${depth} levels)`)
      if (/[%@!$^&*~+]/.test(pathname)) problems.push('Contains special / encoded characters')

      if (problems.length > 0) {
        urlIssues.push({
          url: p.url,
          reasons: problems,
        })
      }
    } catch {}
  })

  checks.urlStructure = {
    pass: urlIssues.length === 0,
    label: 'URL Structure & Slug Hygiene',
    detail: urlIssues.length === 0
      ? 'All audited URLs follow clean, SEO-friendly conventions'
      : `${urlIssues.length} URL(s) have suboptimal structure (length, uppercase, underscores, or parameters)`,
  }

  if (urlIssues.length > 0) {
    issues.push(
      createIssue(
        'technical',
        'MEDIUM',
        'Suboptimal URL Structure & Naming',
        'Clean, descriptive, lowercase URLs with hyphens and shallow depth index faster and achieve higher CTR in search results.',
        'Use lowercase slugs separated by hyphens. Avoid dynamic parameters, deep folders (>3 levels), and URLs over 75 characters.',
        {
          affectedPages: urlIssues.map(u => u.url),
          affectedItems: urlIssues.map(u => ({
            url: u.url,
            evidence: u.reasons.join('; '),
          })),
        }
      )
    )
  }

  // 5. Heavy JavaScript & CSS Assets Check
  const heavyScriptPages = []
  const renderBlockingPages = []
  const heavyCssPages = []

  pages.forEach(p => {
    const assets = p.assets || {}
    if (assets.externalScriptsCount > 15 || assets.inlineScriptsSizeBytes > 150000) {
      heavyScriptPages.push({
        url: p.url,
        count: assets.externalScriptsCount,
        inlineSize: Math.round(assets.inlineScriptsSizeBytes / 1024),
      })
    }
    if (assets.renderBlockingScripts > 0) {
      renderBlockingPages.push({
        url: p.url,
        blockingCount: assets.renderBlockingScripts,
      })
    }
    if (assets.stylesheetsCount > 8) {
      heavyCssPages.push({
        url: p.url,
        count: assets.stylesheetsCount,
      })
    }
  })

  checks.heavyAssets = {
    pass: renderBlockingPages.length === 0 && heavyScriptPages.length === 0,
    label: 'JavaScript & CSS Asset Efficiency',
    detail: renderBlockingPages.length === 0 && heavyScriptPages.length === 0
      ? 'Scripts and stylesheets are well-distributed without excessive render-blocking resources'
      : `${renderBlockingPages.length} page(s) contain render-blocking scripts in <head>`,
  }

  if (renderBlockingPages.length > 0) {
    issues.push(
      createIssue(
        'performance',
        'HIGH',
        'Render-Blocking JavaScript Resources in <head>',
        'Synchronous script tags in the <head> delay the First Contentful Paint (FCP) and Largest Contentful Paint (LCP) by blocking DOM rendering.',
        'Add `defer` or `async` attributes to non-critical external scripts or move them to the end of the <body>.',
        {
          affectedPages: renderBlockingPages.map(p => p.url),
          affectedItems: renderBlockingPages.map(p => ({
            url: p.url,
            evidence: `${p.blockingCount} render-blocking script(s) found in <head> without async/defer`,
          })),
        }
      )
    )
  }

  if (heavyScriptPages.length > 0) {
    issues.push(
      createIssue(
        'performance',
        'MEDIUM',
        'Excessive JavaScript Payloads & Script Count',
        'Pages with more than 15 external scripts increase main-thread execution time, hurting Total Blocking Time (TBT) and Interaction to Next Paint (INP).',
        'Bundle and minify JavaScript files, remove unused third-party tags, and use code-splitting.',
        {
          affectedPages: heavyScriptPages.map(p => p.url),
          affectedItems: heavyScriptPages.map(p => ({
            url: p.url,
            evidence: `${p.count} external scripts + ${p.inlineSize}KB inline JS`,
          })),
        }
      )
    )
  }

  // 6. Mobile Responsiveness & Viewport Check
  const viewportMissingPages = pages.filter(p => !p.viewport?.hasViewport)
  const zoomDisabledPages = pages.filter(p => p.viewport?.preventsZoom)

  checks.responsiveness = {
    pass: viewportMissingPages.length === 0 && zoomDisabledPages.length === 0,
    label: 'Mobile Viewport & Responsiveness',
    detail: viewportMissingPages.length === 0
      ? 'All pages have mobile viewport tags configured'
      : `${viewportMissingPages.length} page(s) missing <meta name="viewport">`,
  }

  if (viewportMissingPages.length > 0) {
    issues.push(
      createIssue(
        'mobile',
        'CRITICAL',
        'Missing Mobile Viewport Meta Tag',
        'Without a viewport meta tag, mobile browsers render pages at desktop screen widths, failing Google mobile-friendly criteria.',
        'Add `<meta name="viewport" content="width=device-width, initial-scale=1">` in the `<head>` of all pages.',
        {
          affectedPages: viewportMissingPages.map(p => p.url),
          evidence: 'No <meta name="viewport"> tag detected in HTML header',
        }
      )
    )
  }

  if (zoomDisabledPages.length > 0) {
    issues.push(
      createIssue(
        'mobile',
        'LOW',
        'Pinch-to-Zoom Disabled in Viewport',
        'Restricting zoom (`user-scalable=no` or `maximum-scale=1.0`) harms mobile accessibility for users with visual impairments.',
        'Remove `user-scalable=no` and `maximum-scale` restrictions from the viewport meta tag.',
        {
          affectedPages: zoomDisabledPages.map(p => p.url),
          evidence: 'user-scalable=no or maximum-scale=1.0 detected in viewport content',
        }
      )
    )
  }

  // 7. Canonical Tags Check
  const canonicalIssues = []
  const parsedHostClean = parsed.hostname.replace(/^www\./, '').toLowerCase()

  pages.forEach((p) => {
    if (!p.canonical) {
      canonicalIssues.push({ url: p.url, problem: 'Missing canonical tag' })
    } else {
      try {
        const canonUrl = new URL(p.canonical, p.url)
        const canonHostClean = canonUrl.hostname.replace(/^www\./, '').toLowerCase()
        if (canonHostClean !== parsedHostClean) {
          canonicalIssues.push({
            url: p.url,
            problem: `Canonical points to different domain: ${p.canonical}`,
          })
        }
      } catch {
        canonicalIssues.push({ url: p.url, problem: `Malformed canonical URL: "${p.canonical}"` })
      }
    }
  })

  checks.canonical = {
    pass: canonicalIssues.length === 0,
    label: 'Canonical Link Tag Consistency',
    detail: canonicalIssues.length === 0
      ? 'All pages have valid canonical tags declared'
      : `${canonicalIssues.length} page(s) have missing or invalid canonical tags`,
  }

  if (canonicalIssues.length > 0) {
    issues.push(
      createIssue(
        'technical',
        'HIGH',
        'Missing or Invalid Canonical Tags',
        'Canonical tags inform search engines which version of a URL is the master copy, preventing duplicate content dilution.',
        'Add a self-referencing `<link rel="canonical" href="...">` tag to each page.',
        {
          affectedPages: canonicalIssues.map(c => c.url),
          affectedItems: canonicalIssues.map(c => ({
            url: c.url,
            evidence: c.problem,
          })),
        }
      )
    )
  }

  // 8. Indexability & Robots Meta Check
  const noindexPages = pages.filter(p => /noindex/i.test(p.robotsMeta))
  checks.indexability = {
    pass: noindexPages.length === 0,
    label: 'Search Engine Indexability',
    detail: noindexPages.length === 0
      ? 'All crawled pages allow search engine indexing'
      : `${noindexPages.length} page(s) have noindex directives`,
  }

  if (noindexPages.length > 0) {
    issues.push(
      createIssue(
        'technical',
        'HIGH',
        'Pages Blocked from Search Index (noindex)',
        'Pages with a `noindex` directive instruct Google not to include them in search results.',
        'If these pages are intended for search traffic, remove the `noindex` meta tag or HTTP X-Robots-Tag header.',
        {
          affectedPages: noindexPages.map(p => p.url),
          affectedItems: noindexPages.map(p => ({
            url: p.url,
            evidence: `Robots meta tag: "${p.robotsMeta}"`,
          })),
        }
      )
    )
  }

  // 9. HTTP Status Codes Check
  const errorPages = pages.filter(p => p.statusCode >= 400)
  checks.httpStatus = {
    pass: errorPages.length === 0,
    label: 'HTTP Response Status Codes',
    detail: errorPages.length === 0
      ? 'All pages returned HTTP 200 OK status'
      : `${errorPages.length} page(s) returned HTTP error status codes`,
  }

  if (errorPages.length > 0) {
    issues.push(
      createIssue(
        'technical',
        'CRITICAL',
        'HTTP Server & Client Error Responses',
        'Pages returning 4xx (Not Found) or 5xx (Server Error) waste crawl budget and damage user experience.',
        'Fix server-side errors (5xx) and set up 301 redirects or restore broken pages (404).',
        {
          affectedPages: errorPages.map(p => p.url),
          affectedItems: errorPages.map(p => ({
            url: p.url,
            evidence: `Returned HTTP ${p.statusCode} status code`,
          })),
        }
      )
    )
  }

  // 10. Redirects Check
  const redirectPages = pages.filter(p => p.redirects > 0)
  if (redirectPages.length > 0) {
    issues.push(
      createIssue(
        'technical',
        'LOW',
        'Internal Links Traversing Redirects',
        'Redirect chains slow down page load times and dilute link equity pass-through.',
        'Update internal navigation and content links to point directly to destination URLs.',
        {
          affectedPages: redirectPages.map(p => p.url),
          affectedItems: redirectPages.map(p => ({
            url: p.url,
            evidence: `${p.redirects} redirect hop(s) before final page reached`,
          })),
        }
      )
    )
  }

  return { checks, issues }
}

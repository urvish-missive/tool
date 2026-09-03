import * as cheerio from 'cheerio'

const USER_AGENT = 'Mozilla/5.0 (compatible; MissiveSEO-SitemapBot/1.0; +https://missivedigital.com)'
const VALID_CHANGEFREQ = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'])
const STATIC_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.tar', '.gz',
  '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.webm', '.wav',
  '.css', '.js', '.json', '.xml', '.rss', '.atom', '.woff', '.woff2', '.ttf', '.eot',
])

/**
 * Normalizes a URL: resolves relative URLs, cleans tracking query params, removes hash anchors.
 */
export function normalizeUrl(rawUrl, baseUrl) {
  try {
    const urlObj = new URL(rawUrl, baseUrl)
    // Only allow http and https
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null
    }
    // Remove hash
    urlObj.hash = ''

    // Strip common tracking and analytics parameters
    const paramsToDelete = []
    urlObj.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase()
      if (
        lower.startsWith('utm_') ||
        lower === 'fbclid' ||
        lower === 'gclid' ||
        lower === 'msclkid' ||
        lower === '_ga' ||
        lower === 'mc_cid' ||
        lower === 'mc_eid'
      ) {
        paramsToDelete.push(key)
      }
    })
    paramsToDelete.forEach(k => urlObj.searchParams.delete(k))

    // Don't modify pathname trailing slash unless it's just root
    let normalized = urlObj.toString()
    if (urlObj.pathname === '' || urlObj.pathname === '/') {
      normalized = `${urlObj.origin}/`
    }
    return normalized
  } catch {
    return null
  }
}

/**
 * Checks if a URL points to a non-HTML static file extension
 */
function isStaticAsset(url) {
  try {
    const { pathname } = new URL(url)
    const dotIndex = pathname.lastIndexOf('.')
    if (dotIndex !== -1) {
      const ext = pathname.substring(dotIndex).toLowerCase()
      if (STATIC_EXTENSIONS.has(ext)) return true
    }
    return false
  } catch {
    return false
  }
}

/**
 * Determines depth level of a URL relative to host root
 */
function calculateDepth(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  return parts.length
}

/**
 * Suggests standard SEO priority based on URL depth
 */
export function calculatePriority(depth) {
  if (depth === 0) return '1.0'
  if (depth === 1) return '0.8'
  if (depth === 2) return '0.6'
  return '0.5'
}

/**
 * Suggests standard SEO change frequency based on URL depth
 */
export function calculateChangefreq(depth) {
  if (depth === 0) return 'daily'
  if (depth === 1) return 'weekly'
  return 'monthly'
}

/**
 * Formats a date into W3C / ISO-8601 YYYY-MM-DD format
 */
export function formatDate(date) {
  if (!date) {
    return new Date().toISOString().split('T')[0]
  }
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0]
    return d.toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Escapes XML special characters for safe XML tag content
 */
export function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Generates valid XML Sitemap conforming to Sitemaps.org 0.9 schema
 */
export function formatSitemapXml(urlEntries = []) {
  const hasImages = urlEntries.some(e => e.images && e.images.length > 0)
  const hasAlternates = urlEntries.some(e => e.alternates && e.alternates.length > 0)

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`

  if (hasImages) {
    xml += `\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`
  }
  if (hasAlternates) {
    xml += `\n        xmlns:xhtml="http://www.w3.org/1999/xhtml"`
  }
  xml += `>\n`

  for (const entry of urlEntries) {
    xml += `  <url>\n`
    xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`

    if (entry.lastmod) {
      xml += `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n`
    }
    if (entry.changefreq && VALID_CHANGEFREQ.has(entry.changefreq)) {
      xml += `    <changefreq>${escapeXml(entry.changefreq)}</changefreq>\n`
    }
    if (entry.priority !== undefined && entry.priority !== null) {
      xml += `    <priority>${Number(entry.priority).toFixed(1)}</priority>\n`
    }

    // Alternate language links
    if (entry.alternates && entry.alternates.length > 0) {
      for (const alt of entry.alternates) {
        if (alt.href && alt.hreflang) {
          xml += `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(alt.href)}" />\n`
        }
      }
    }

    // Google Image Sitemap tags
    if (entry.images && entry.images.length > 0) {
      for (const img of entry.images) {
        if (img.loc) {
          xml += `    <image:image>\n`
          xml += `      <image:loc>${escapeXml(img.loc)}</image:loc>\n`
          if (img.title) {
            xml += `      <image:title>${escapeXml(img.title)}</image:title>\n`
          }
          if (img.caption) {
            xml += `      <image:caption>${escapeXml(img.caption)}</image:caption>\n`
          }
          xml += `    </image:image>\n`
        }
      }
    }

    xml += `  </url>\n`
  }

  xml += `</urlset>`
  return xml
}

/**
 * Generates a sitemap-index.xml string for grouped or segmented sitemaps
 */
export function formatSitemapIndexXml(sitemaps = []) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`

  for (const sm of sitemaps) {
    xml += `  <sitemap>\n`
    xml += `    <loc>${escapeXml(sm.loc)}</loc>\n`
    if (sm.lastmod) {
      xml += `    <lastmod>${escapeXml(sm.lastmod)}</lastmod>\n`
    }
    xml += `  </sitemap>\n`
  }

  xml += `</sitemapindex>`
  return xml
}

/**
 * Generates standard robots.txt directive snippet
 */
export function formatRobotsTxtSnippet(sitemapUrl) {
  return [
    '# XML Sitemap Directive',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemapUrl}`,
  ].join('\n')
}

/**
 * Asynchronous web crawler that traverses website internal links up to maxPages and crawlDepth.
 */
export async function crawlWebsite({
  websiteUrl,
  maxPages = 50,
  crawlDepth = 3,
  includeImages = true,
  defaultChangefreq,
  defaultPriority,
  excludePatterns = [],
}) {
  let parsedStart
  try {
    let urlToParse = websiteUrl.trim()
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = `https://${urlToParse}`
    }
    parsedStart = new URL(urlToParse)
  } catch {
    throw new Error('Invalid website URL provided.')
  }

  const rootOrigin = parsedStart.origin
  const rootHostname = parsedStart.hostname
  const rootUrlNormalized = normalizeUrl(parsedStart.href, rootOrigin)

  const queue = [{ url: rootUrlNormalized, depth: 0 }]
  const visited = new Set()
  const results = []
  const maxToCrawl = Math.min(Math.max(parseInt(maxPages) || 50, 1), 250)
  const maxDepth = Math.min(Math.max(parseInt(crawlDepth) || 3, 1), 5)

  // Compile exclude patterns
  const excludeRegexes = (excludePatterns || [])
    .filter(p => typeof p === 'string' && p.trim().length > 0)
    .map(p => {
      try {
        return new RegExp(p.trim(), 'i')
      } catch {
        return null
      }
    })
    .filter(Boolean)

  while (queue.length > 0 && results.length < maxToCrawl) {
    const { url, depth } = queue.shift()
    if (visited.has(url)) continue
    visited.add(url)

    // Check exclude patterns
    if (excludeRegexes.some(rx => rx.test(url))) {
      continue
    }

    // Skip static assets
    if (isStaticAsset(url)) {
      continue
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6000)

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      })
      clearTimeout(timeout)

      const statusCode = response.status
      const contentType = response.headers.get('content-type') || ''

      // Skip non-HTML responses
      if (!contentType.includes('text/html')) {
        continue
      }

      // Check for last-modified header
      let lastmod = formatDate(response.headers.get('last-modified'))

      const html = await response.text()
      const $ = cheerio.load(html)

      // Check robots meta tag for noindex
      const robotsMeta = $('meta[name="robots" i], meta[name="googlebot" i]').attr('content') || ''
      if (robotsMeta.toLowerCase().includes('noindex')) {
        // Page explicitly requests not to be indexed
        continue
      }

      // Check canonical tag
      const canonicalTag = $('link[rel="canonical" i]').attr('href')
      let canonicalUrl = null
      if (canonicalTag) {
        canonicalUrl = normalizeUrl(canonicalTag, url)
      }

      // Check page dates in HTML meta if header was not present
      const articleModified = $('meta[property="article:modified_time" i], meta[property="og:updated_time" i]').attr('content')
      if (articleModified) {
        lastmod = formatDate(articleModified)
      }

      // Extract images if requested
      const pageImages = []
      if (includeImages) {
        $('img').each((_, el) => {
          if (pageImages.length >= 10) return false // Max 10 images per URL
          const src = $(el).attr('src') || $(el).attr('data-src')
          if (!src) return

          const imgUrl = normalizeUrl(src, url)
          if (imgUrl && !imgUrl.startsWith('data:')) {
            const alt = $(el).attr('alt') || $(el).attr('title') || ''
            pageImages.push({
              loc: imgUrl,
              title: alt ? alt.substring(0, 100) : undefined,
            })
          }
        })
      }

      // Extract alternate language hreflang links
      const alternates = []
      $('link[rel="alternate" i][hreflang]').each((_, el) => {
        const href = $(el).attr('href')
        const hreflang = $(el).attr('hreflang')
        if (href && hreflang) {
          const altUrl = normalizeUrl(href, url)
          if (altUrl) {
            alternates.push({ hreflang, href: altUrl })
          }
        }
      })

      // Page Title
      const pageTitle = $('title').text().trim() || url

      // Calculate Priority & Changefreq
      const urlPath = new URL(url).pathname
      const itemDepth = calculateDepth(urlPath)
      const priority = defaultPriority !== undefined && defaultPriority !== '' && defaultPriority !== null
        ? Number(defaultPriority)
        : Number(calculatePriority(itemDepth))
      const changefreq = defaultChangefreq || calculateChangefreq(itemDepth)

      results.push({
        loc: canonicalUrl || url,
        title: pageTitle,
        statusCode,
        depth: itemDepth,
        lastmod,
        changefreq,
        priority,
        images: pageImages,
        alternates,
      })

      // If we haven't reached maxDepth, discover and queue new internal links
      if (depth < maxDepth && results.length + queue.length < maxToCrawl * 2) {
        $('a[href]').each((_, el) => {
          const rawHref = $(el).attr('href')
          if (!rawHref) return

          const cleanHref = normalizeUrl(rawHref, url)
          if (!cleanHref) return

          try {
            const hrefObj = new URL(cleanHref)
            // Strict internal link check
            if (hrefObj.hostname === rootHostname && !visited.has(cleanHref)) {
              // Don't enqueue duplicate in queue
              if (!queue.some(item => item.url === cleanHref)) {
                queue.push({ url: cleanHref, depth: depth + 1 })
              }
            }
          } catch {}
        })
      }
    } catch {
      // Fetch error or timeout on this URL; skip to next
      continue
    }
  }

  // Fallback: If crawl returned 0 pages (e.g. strict protection or timeout), at least provide the base URL entry
  if (results.length === 0) {
    results.push({
      loc: rootUrlNormalized,
      title: parsedStart.hostname,
      statusCode: 200,
      depth: 0,
      lastmod: formatDate(null),
      changefreq: defaultChangefreq || 'daily',
      priority: defaultPriority !== undefined && defaultPriority !== '' ? Number(defaultPriority) : 1.0,
      images: [],
      alternates: [],
    })
  }

  // Generate XML
  const xmlContent = formatSitemapXml(results)
  const robotsSnippet = formatRobotsTxtSnippet(`${rootOrigin}/sitemap.xml`)

  // Aggregate stats
  const totalUrls = results.length
  const totalImages = results.reduce((acc, r) => acc + (r.images?.length || 0), 0)
  const avgPriority = (results.reduce((acc, r) => acc + (r.priority || 0), 0) / (totalUrls || 1)).toFixed(2)
  const status200Count = results.filter(r => r.statusCode === 200).length
  const fileSizeKb = (Buffer.byteLength(xmlContent, 'utf8') / 1024).toFixed(1)

  return {
    success: true,
    websiteUrl: rootOrigin,
    totalUrls,
    totalImages,
    avgPriority,
    status200Count,
    fileSizeKb,
    xmlContent,
    robotsSnippet,
    urls: results,
  }
}

/**
 * Generates an XML sitemap from a manual list of URLs
 */
export function generateFromUrls({
  urls = [],
  defaultChangefreq = 'weekly',
  defaultPriority = '0.8',
  includeImages = true,
}) {
  const cleanEntries = []
  const seen = new Set()

  for (const raw of urls) {
    const rawStr = typeof raw === 'string' ? raw.trim() : (raw?.url || '').trim()
    if (!rawStr) continue

    const normalized = normalizeUrl(rawStr)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)

    const depth = calculateDepth(new URL(normalized).pathname)
    const priority = raw.priority !== undefined && raw.priority !== null && raw.priority !== ''
      ? Number(raw.priority)
      : (defaultPriority !== undefined && defaultPriority !== '' ? Number(defaultPriority) : Number(calculatePriority(depth)))
    const changefreq = raw.changefreq || defaultChangefreq || calculateChangefreq(depth)
    const lastmod = formatDate(raw.lastmod)

    cleanEntries.push({
      loc: normalized,
      title: raw.title || normalized,
      statusCode: 200,
      depth,
      lastmod,
      changefreq,
      priority,
      images: raw.images || [],
      alternates: raw.alternates || [],
    })
  }

  if (cleanEntries.length === 0) {
    throw new Error('No valid URLs provided.')
  }

  const xmlContent = formatSitemapXml(cleanEntries)
  let domain = 'https://example.com'
  try {
    domain = new URL(cleanEntries[0].loc).origin
  } catch {}

  const robotsSnippet = formatRobotsTxtSnippet(`${domain}/sitemap.xml`)
  const totalUrls = cleanEntries.length
  const totalImages = cleanEntries.reduce((acc, r) => acc + (r.images?.length || 0), 0)
  const avgPriority = (cleanEntries.reduce((acc, r) => acc + (r.priority || 0), 0) / (totalUrls || 1)).toFixed(2)
  const fileSizeKb = (Buffer.byteLength(xmlContent, 'utf8') / 1024).toFixed(1)

  return {
    success: true,
    websiteUrl: domain,
    totalUrls,
    totalImages,
    avgPriority,
    status200Count: totalUrls,
    fileSizeKb,
    xmlContent,
    robotsSnippet,
    urls: cleanEntries,
  }
}

/**
 * Validates and audits an existing XML sitemap URL or raw XML string
 */
export async function validateSitemapData({ sitemapUrl, xmlContent }) {
  let xmlString = (xmlContent || '').trim()
  let source = 'raw_xml'

  if (sitemapUrl && sitemapUrl.trim().length > 0) {
    source = sitemapUrl.trim()
    try {
      let target = sitemapUrl.trim()
      if (!target.startsWith('http')) target = `https://${target}`
      const resp = await fetch(target, {
        headers: { 'User-Agent': USER_AGENT },
      })
      if (!resp.ok) {
        return {
          success: false,
          error: `Failed to fetch sitemap from ${target} (HTTP status ${resp.status})`,
        }
      }
      xmlString = await resp.text()
    } catch (err) {
      return {
        success: false,
        error: `Could not connect to sitemap URL: ${err.message}`,
      }
    }
  }

  if (!xmlString) {
    return { success: false, error: 'No XML content or sitemap URL provided to validate.' }
  }

  const issues = []
  const warnings = []
  const parsedUrls = []
  const sizeBytes = Buffer.byteLength(xmlString, 'utf8')
  const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2)

  // 1. File size checks (Google sitemap limit: 50MB uncompressed)
  if (sizeBytes > 50 * 1024 * 1024) {
    issues.push({
      severity: 'CRITICAL',
      title: 'Sitemap Exceeds 50MB Limit',
      description: `Your sitemap is ${sizeMb} MB. Google and Bing reject sitemaps larger than 50MB uncompressed.`,
      recommendation: 'Break this sitemap into multiple smaller sitemaps using a <sitemapindex>.',
    })
  } else if (sizeBytes > 30 * 1024 * 1024) {
    warnings.push({
      severity: 'HIGH',
      title: 'Approaching File Size Limit',
      description: `Your sitemap is ${sizeMb} MB, approaching the 50MB limit.`,
      recommendation: 'Consider splitting into multiple sitemaps before growing further.',
    })
  }

  // 2. Parse XML with cheerio
  const $ = cheerio.load(xmlString, { xmlMode: true })
  const isSitemapIndex = $('sitemapindex').length > 0
  const isUrlset = $('urlset').length > 0

  if (!isUrlset && !isSitemapIndex) {
    issues.push({
      severity: 'CRITICAL',
      title: 'Missing Standard Root Element',
      description: 'The XML document does not contain a standard <urlset> or <sitemapindex> root element.',
      recommendation: 'Wrap your URLs in a <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"> tag.',
    })
  }

  // Check namespace
  const rootTag = isUrlset ? $('urlset') : $('sitemapindex')
  const xmlns = rootTag.attr('xmlns')
  if (xmlns !== 'http://www.sitemaps.org/schemas/sitemap/0.9') {
    warnings.push({
      severity: 'MEDIUM',
      title: 'Missing or Non-standard XML Namespace',
      description: `Current namespace is "${xmlns || 'none'}". Standard Sitemaps.org 0.9 schema is recommended.`,
      recommendation: 'Set xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" on the root element.',
    })
  }

  // Check URL entries
  const urlNodes = $('url')
  const totalCount = urlNodes.length

  if (totalCount > 50000) {
    issues.push({
      severity: 'CRITICAL',
      title: 'Exceeds Maximum 50,000 URLs',
      description: `Sitemap contains ${totalCount.toLocaleString()} URLs. Search engines limit each sitemap to 50,000 URLs.`,
      recommendation: 'Use a <sitemapindex> file to link multiple sitemap files containing up to 50,000 URLs each.',
    })
  }

  let missingLocCount = 0
  let invalidDateCount = 0
  let invalidPriorityCount = 0
  let invalidChangefreqCount = 0
  let httpCount = 0
  let httpsCount = 0

  urlNodes.each((_, el) => {
    const loc = $(el).find('loc').text().trim()
    const lastmod = $(el).find('lastmod').text().trim()
    const changefreq = $(el).find('changefreq').text().trim().toLowerCase()
    const priority = $(el).find('priority').text().trim()

    if (!loc) {
      missingLocCount++
      return
    }

    if (loc.startsWith('http://')) httpCount++
    if (loc.startsWith('https://')) httpsCount++

    if (lastmod) {
      const d = new Date(lastmod)
      if (isNaN(d.getTime())) invalidDateCount++
    }

    if (changefreq && !VALID_CHANGEFREQ.has(changefreq)) {
      invalidChangefreqCount++
    }

    if (priority) {
      const p = parseFloat(priority)
      if (isNaN(p) || p < 0 || p > 1.0) invalidPriorityCount++
    }

    if (parsedUrls.length < 500) {
      parsedUrls.push({
        loc,
        lastmod: lastmod || null,
        changefreq: changefreq || null,
        priority: priority ? parseFloat(priority) : null,
      })
    }
  })

  if (missingLocCount > 0) {
    issues.push({
      severity: 'CRITICAL',
      title: `Missing <loc> Tag in ${missingLocCount} Entries`,
      description: 'The <loc> tag is required for every URL in an XML sitemap.',
      recommendation: 'Ensure all <url> blocks specify a valid, absolute URL inside <loc>.',
    })
  }

  if (httpCount > 0 && httpsCount > 0) {
    warnings.push({
      severity: 'HIGH',
      title: 'Mixed HTTP and HTTPS Protocols',
      description: `Found ${httpCount} insecure http:// URLs and ${httpsCount} secure https:// URLs.`,
      recommendation: 'Standardize all URLs to secure https:// to prevent canonical dilution.',
    })
  } else if (httpCount > 0 && httpsCount === 0) {
    warnings.push({
      severity: 'HIGH',
      title: 'Insecure HTTP URLs Detected',
      description: 'All URLs in the sitemap use non-secure http:// protocol.',
      recommendation: 'Update sitemap URLs to https:// for modern SEO compliance.',
    })
  }

  if (invalidDateCount > 0) {
    warnings.push({
      severity: 'MEDIUM',
      title: `Invalid Date Format in ${invalidDateCount} Entries`,
      description: 'Dates should conform to W3C Datetime format (e.g. YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+00:00).',
      recommendation: 'Reformat dates to ISO 8601 / YYYY-MM-DD.',
    })
  }

  if (invalidChangefreqCount > 0) {
    warnings.push({
      severity: 'LOW',
      title: `Invalid <changefreq> in ${invalidChangefreqCount} Entries`,
      description: 'Values must be one of: always, hourly, daily, weekly, monthly, yearly, never.',
      recommendation: 'Correct invalid changefreq values.',
    })
  }

  if (invalidPriorityCount > 0) {
    warnings.push({
      severity: 'LOW',
      title: `Invalid <priority> in ${invalidPriorityCount} Entries`,
      description: 'Priority must be a float between 0.0 and 1.0.',
      recommendation: 'Clamp priority values within the 0.0 to 1.0 range.',
    })
  }

  // Calculate Health Score (100 base, deductions for issues)
  let healthScore = 100
  for (const iss of issues) {
    if (iss.severity === 'CRITICAL') healthScore -= 25
  }
  for (const wrn of warnings) {
    if (wrn.severity === 'HIGH') healthScore -= 10
    if (wrn.severity === 'MEDIUM') healthScore -= 5
    if (wrn.severity === 'LOW') healthScore -= 2
  }
  healthScore = Math.max(0, Math.min(100, healthScore))

  return {
    success: true,
    source,
    healthScore,
    totalUrls: totalCount,
    sizeBytes,
    sizeKb: (sizeBytes / 1024).toFixed(1),
    isSitemapIndex,
    allIssues: [...issues, ...warnings],
    criticalCount: issues.length,
    warningCount: warnings.length,
    sampleUrls: parsedUrls.slice(0, 50),
  }
}

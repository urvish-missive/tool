import * as cheerio from 'cheerio'
import { validateURL, resolveAndValidate, fetchWithTimeout } from '../../utils/helpers.js'

const MAX_CRAWL_PAGES = parseInt(process.env.MAX_CRAWL_PAGES || '10')
const CRAWL_TIMEOUT = parseInt(process.env.CRAWL_TIMEOUT || '12000')
const MAX_REDIRECTS = parseInt(process.env.MAX_REDIRECTS || '5')
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
}

async function fetchPage(targetUrl, redirects = 0) {
  if (redirects > MAX_REDIRECTS) throw new Error('Too many redirects')

  const parsed = validateURL(targetUrl)
  await resolveAndValidate(parsed.hostname)

  const startTime = Date.now()
  let response
  try {
    response = await fetchWithTimeout(
      parsed.href,
      {
        headers: BROWSER_HEADERS,
        redirect: 'follow',
      },
      CRAWL_TIMEOUT
    )
  } catch (fetchErr) {
    console.warn(`Fetch error for ${parsed.href}:`, fetchErr.message)
    throw fetchErr
  }
  const responseTimeMs = Date.now() - startTime

  // Manual redirect detection if location header exists
  if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
    const redirectUrl = new URL(response.headers.get('location'), parsed.href).href
    return fetchPage(redirectUrl, redirects + 1)
  }

  const contentType = response.headers.get('content-type') || ''
  const isHtmlType = contentType.toLowerCase().includes('html') || contentType === ''

  const html = await response.text()
  if (html.length > MAX_RESPONSE_SIZE) throw new Error('Response too large')

  const isHTML =
    isHtmlType || html.includes('<html') || html.includes('<!DOCTYPE') || html.includes('<body')

  // Capture response security headers
  const securityHeaders = {
    hsts: Boolean(response.headers.get('strict-transport-security')),
    csp: Boolean(response.headers.get('content-security-policy')),
    xFrameOptions: response.headers.get('x-frame-options') || null,
    xContentTypeOptions: response.headers.get('x-content-type-options') || null,
    server: response.headers.get('server') || null,
  }

  return {
    url: parsed.href,
    status: response.status,
    html,
    contentType,
    redirects,
    isHTML,
    responseTimeMs,
    securityHeaders,
  }
}

function extractLinks($, baseUrl) {
  const base = new URL(baseUrl)
  const internal = new Set()
  const external = new Set()
  const detailedLinks = []

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim()
    const anchorText = $(el).text().trim().replace(/\s+/g, ' ')
    const rel = $(el).attr('rel') || ''
    const isNofollow = /nofollow/i.test(rel)

    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    )
      return

    try {
      const linkUrl = new URL(href, baseUrl)
      if (linkUrl.hostname === base.hostname) {
        linkUrl.hash = ''
        const cleanHref = linkUrl.href
        internal.add(cleanHref)
        if (detailedLinks.length < 50) {
          detailedLinks.push({ url: cleanHref, text: anchorText || '[No anchor text]', type: 'internal', isNofollow })
        }
      } else {
        const cleanHref = linkUrl.href
        external.add(cleanHref)
        if (detailedLinks.length < 50) {
          detailedLinks.push({ url: cleanHref, text: anchorText || '[No anchor text]', type: 'external', isNofollow })
        }
      }
    } catch {}
  })

  return {
    internal: [...internal].slice(0, 60),
    external: [...external].slice(0, 60),
    detailedLinks,
  }
}

function parseHTML(html, pageUrl, responseTimeMs = 0, securityHeaders = {}) {
  const $ = cheerio.load(html)

  // 1. Structured Data JSON-LD & Microdata (EXTRACT BEFORE REMOVING SCRIPTS!)
  const schemas = []
  const schemaObjects = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html()
      if (raw) {
        const data = JSON.parse(raw)
        schemaObjects.push(data)
        const extractTypes = (obj) => {
          if (!obj || typeof obj !== 'object') return
          if (obj['@type']) {
            if (Array.isArray(obj['@type'])) schemas.push(...obj['@type'])
            else schemas.push(obj['@type'])
          }
          if (Array.isArray(obj)) {
            obj.forEach(extractTypes)
          } else if (obj['@graph'] && Array.isArray(obj['@graph'])) {
            obj['@graph'].forEach(extractTypes)
          }
        }
        extractTypes(data)
      }
    } catch {}
  })

  // Microdata itemtypes
  $('[itemtype]').each((_, el) => {
    const itemType = $(el).attr('itemtype')
    if (itemType) {
      const parts = itemType.split('/')
      const typeName = parts[parts.length - 1]
      if (typeName) schemas.push(typeName)
    }
  })

  // 2. JavaScript & CSS Assets Inspection
  const scriptTags = []
  let renderBlockingScripts = 0
  let externalScriptsCount = 0
  let inlineScriptsSize = 0

  $('script').each((_, el) => {
    const src = $(el).attr('src')
    const isAsync = $(el).attr('async') !== undefined
    const isDefer = $(el).attr('defer') !== undefined
    const isModule = $(el).attr('type') === 'module'
    const parent = $(el).parent().prop('tagName')?.toLowerCase()

    if (src) {
      externalScriptsCount++
      const isBlocking = parent === 'head' && !isAsync && !isDefer && !isModule
      if (isBlocking) renderBlockingScripts++
      scriptTags.push({ src, isAsync, isDefer, isBlocking })
    } else {
      const content = $(el).html() || ''
      inlineScriptsSize += content.length
    }
  })

  const stylesheetTags = []
  let inlineStylesSize = 0
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) stylesheetTags.push(href)
  })
  $('style').each((_, el) => {
    inlineStylesSize += ($(el).html() || '').length
  })

  // 3. Viewport & Responsiveness
  const viewportContent = $('meta[name="viewport"]').attr('content') || ''
  const hasViewport = Boolean(viewportContent)
  const isResponsiveViewport =
    hasViewport && viewportContent.includes('width=device-width') && viewportContent.includes('initial-scale')
  const preventsZoom =
    viewportContent.includes('user-scalable=no') || viewportContent.includes('maximum-scale=1.0')

  // 4. Exact Headings Extraction
  const h1Elements = $('h1')
    .map((idx, el) => ({
      text: $(el).text().replace(/\s+/g, ' ').trim(),
      index: idx + 1,
    }))
    .get()
    .filter(h => h.text.length > 0)

  const h2Elements = $('h2')
    .map((idx, el) => ({
      text: $(el).text().replace(/\s+/g, ' ').trim(),
      index: idx + 1,
    }))
    .get()
    .filter(h => h.text.length > 0)

  const h3Elements = $('h3')
    .map((idx, el) => ({
      text: $(el).text().replace(/\s+/g, ' ').trim(),
      index: idx + 1,
    }))
    .get()
    .filter(h => h.text.length > 0)

  const h1 = h1Elements.map(h => h.text)
  const h2 = h2Elements.map(h => h.text)
  const h3 = h3Elements.map(h => h.text)

  // 5. Images Extraction with detailed alt info
  const images = $('img')
    .map((_, el) => {
      const rawSrc = $(el).attr('src') || $(el).attr('data-src') || ''
      let fullSrc = rawSrc
      try {
        if (rawSrc && !rawSrc.startsWith('data:')) {
          fullSrc = new URL(rawSrc, pageUrl).href
        }
      } catch {}
      const altAttr = $(el).attr('alt')
      const alt = altAttr !== undefined ? altAttr.trim() : null
      return {
        src: fullSrc,
        alt,
        width: $(el).attr('width') || null,
        height: $(el).attr('height') || null,
        loading: $(el).attr('loading') || 'eager',
      }
    })
    .get()

  const imagesMissingAlt = images.filter(i => i.alt === null || i.alt === '')

  // 6. Links Extraction
  const linksData = extractLinks($, pageUrl)

  // 7. Text & Word Count (clean clone for text calculation)
  const $clean = cheerio.load(html)
  $clean('script, style, noscript, svg, iframe, header, footer, nav').remove()
  const bodyText = $clean('body').text().replace(/\s+/g, ' ').trim()
  const words = bodyText.split(/\s+/).filter(Boolean)

  return {
    url: pageUrl,
    hostname: new URL(pageUrl).hostname,
    title: $('title').first().text().replace(/\s+/g, ' ').trim(),
    metaDescription: $('meta[name="description"]').attr('content')?.replace(/\s+/g, ' ').trim() || '',
    canonical: $('link[rel="canonical"]').attr('href')?.trim() || '',
    robotsMeta: $('meta[name="robots"]').attr('content')?.trim() || '',
    h1,
    h2,
    h3,
    h1Elements,
    h2Elements,
    h3Elements,
    wordCount: words.length,
    sentences: bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
    paragraphs: $('p').length,
    bodyText: bodyText.substring(0, 5000),
    images,
    imagesMissingAlt,
    missingAltCount: imagesMissingAlt.length,
    totalImages: images.length,
    links: linksData,
    schemas: [...new Set(schemas)],
    schemaObjects: schemaObjects.slice(0, 5),
    responseTimeMs,
    securityHeaders,
    viewport: {
      content: viewportContent,
      hasViewport,
      isResponsiveViewport,
      preventsZoom,
    },
    assets: {
      externalScriptsCount,
      renderBlockingScripts,
      scriptTags: scriptTags.slice(0, 20),
      inlineScriptsSizeBytes: inlineScriptsSize,
      stylesheetsCount: stylesheetTags.length,
      stylesheetTags: stylesheetTags.slice(0, 15),
      inlineStylesSizeBytes: inlineStylesSize,
      totalAssetsWeightEstimateKB: Math.round(
        (html.length + inlineScriptsSize + inlineStylesSize + (externalScriptsCount * 45000) + (stylesheetTags.length * 25000)) / 1024
      ),
    },
    og: {
      title: $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      url: $('meta[property="og:url"]').attr('content') || '',
      site_name: $('meta[property="og:site_name"]').attr('content') || '',
      type: $('meta[property="og:type"]').attr('content') || '',
    },
    twitter: {
      card: $('meta[name="twitter:card"]').attr('content') || '',
      title: $('meta[name="twitter:title"]').attr('content') || '',
      description: $('meta[name="twitter:description"]').attr('content') || '',
      image: $('meta[name="twitter:image"]').attr('content') || '',
    },
  }
}

async function fetchRaw(url, timeoutMs = 6000) {
  try {
    const resp = await fetchWithTimeout(
      url,
      {
        headers: BROWSER_HEADERS,
        redirect: 'follow',
      },
      timeoutMs
    )
    return resp.ok ? await resp.text() : ''
  } catch {
    return ''
  }
}

/**
 * Checks all possible sitemap variations (sitemap.xml, sitemap_index.xml, wp-sitemap.xml, etc.),
 * follows sitemap indexes, and extracts discovered URLs.
 */
async function probeSitemapVariations(targetUrl, robotsSitemapUrls = []) {
  const base = new URL(targetUrl)
  const candidatePaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
    '/wp-sitemap.xml',
    '/sitemap1.xml',
    '/post-sitemap.xml',
    '/page-sitemap.xml',
  ]

  const urlsToProbe = new Set([
    ...robotsSitemapUrls,
    ...candidatePaths.map(p => new URL(p, base.origin).href),
  ])

  const probedResults = []
  let primarySitemapXml = ''
  const detectedSitemaps = []
  const childSitemaps = []
  let totalDiscoveredUrls = 0
  const discoveredUrls = new Set()

  const probePromises = [...urlsToProbe].map(async (sUrl) => {
    try {
      const xml = await fetchRaw(sUrl, 7000)
      if (xml && (xml.includes('<urlset') || xml.includes('<sitemapindex') || xml.includes('<?xml'))) {
        const isIndex = xml.includes('<sitemapindex')
        const locMatches = xml.match(/<loc>([^<]+)<\/loc>/gi) || []
        const cleanLocs = locMatches.map(m => m.replace(/<\/?loc>/gi, '').trim())

        cleanLocs.forEach(loc => discoveredUrls.add(loc))

        if (isIndex) {
          childSitemaps.push(...cleanLocs)
        }

        return {
          url: sUrl,
          found: true,
          status: 200,
          isIndex,
          urlCount: cleanLocs.length,
          xmlSample: xml.substring(0, 1000),
          fullXml: xml,
        }
      }
      return { url: sUrl, found: false, status: 404, isIndex: false, urlCount: 0 }
    } catch {
      return { url: sUrl, found: false, status: 500, isIndex: false, urlCount: 0 }
    }
  })

  const results = await Promise.allSettled(probePromises)
  for (const res of results) {
    if (res.status === 'fulfilled' && res.value) {
      probedResults.push(res.value)
      if (res.value.found) {
        detectedSitemaps.push(res.value.url)
        if (!primarySitemapXml) primarySitemapXml = res.value.fullXml
        totalDiscoveredUrls += res.value.urlCount
      }
    }
  }

  // If a child sitemap index was found, probe up to 2 child sitemaps to verify
  if (childSitemaps.length > 0 && totalDiscoveredUrls <= childSitemaps.length) {
    const childSamples = childSitemaps.slice(0, 3)
    for (const childUrl of childSamples) {
      try {
        const childXml = await fetchRaw(childUrl, 6000)
        if (childXml) {
          const locMatches = childXml.match(/<loc>([^<]+)<\/loc>/gi) || []
          locMatches.forEach(m => discoveredUrls.add(m.replace(/<\/?loc>/gi, '').trim()))
        }
      } catch {}
    }
  }

  return {
    found: detectedSitemaps.length > 0,
    detectedSitemaps,
    probedResults,
    childSitemaps: [...new Set(childSitemaps)],
    totalDiscoveredUrls: Math.max(discoveredUrls.size, totalDiscoveredUrls),
    discoveredSampleUrls: [...discoveredUrls].slice(0, 50),
    primarySitemapXml,
    hasSitemapIndex: childSitemaps.length > 0,
  }
}

export async function crawlWebsite(targetUrl) {
  validateURL(targetUrl)

  // 1. Fetch homepage first
  const homepageRes = await fetchPage(targetUrl)
  if (!homepageRes.isHTML) throw new Error('Website did not return HTML content')

  const homepage = parseHTML(homepageRes.html, homepageRes.url, homepageRes.responseTimeMs, homepageRes.securityHeaders)
  homepage.statusCode = homepageRes.status
  homepage.redirects = homepageRes.redirects

  const pages = [homepage]
  const visited = new Set([homepageRes.url, targetUrl])
  const toVisit = homepage.links.internal.filter(l => !visited.has(l)).slice(0, MAX_CRAWL_PAGES - 1)

  // 2. Crawl additional pages concurrently in batches
  const batchSize = 3
  for (let i = 0; i < toVisit.length && pages.length < MAX_CRAWL_PAGES; i += batchSize) {
    const batch = toVisit.slice(i, i + batchSize).filter(u => !visited.has(u))
    batch.forEach(u => visited.add(u))

    const batchResults = await Promise.allSettled(batch.map(u => fetchPage(u)))
    for (const res of batchResults) {
      if (res.status === 'fulfilled' && res.value && res.value.isHTML) {
        const page = parseHTML(res.value.html, res.value.url, res.value.responseTimeMs, res.value.securityHeaders)
        page.statusCode = res.value.status
        page.redirects = res.value.redirects
        pages.push(page)
        if (pages.length >= MAX_CRAWL_PAGES) break
      }
    }
  }

  // 3. Robots.txt and comprehensive sitemap variations probe
  let robotsTxt = ''
  const robotsSitemapUrls = []

  try {
    const robotsContent = await fetchRaw(new URL('/robots.txt', targetUrl).href)
    robotsTxt = robotsContent || ''
    if (robotsTxt) {
      const matches = robotsTxt.matchAll(/Sitemap:\s*(\S+)/gi)
      for (const m of matches) {
        if (m[1]) robotsSitemapUrls.push(m[1].trim())
      }
    }
  } catch {}

  const sitemapProbe = await probeSitemapVariations(targetUrl, robotsSitemapUrls)

  return {
    targetUrl,
    pages,
    robotsTxt,
    robotsSitemapUrls,
    sitemapXml: sitemapProbe.primarySitemapXml,
    sitemapProbe,
    totalPages: pages.length,
    sslEnabled: targetUrl.startsWith('https://'),
  }
}

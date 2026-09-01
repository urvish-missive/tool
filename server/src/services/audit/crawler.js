import * as cheerio from 'cheerio'
import { validateURL, resolveAndValidate, fetchWithTimeout } from '../../utils/helpers.js'

const MAX_CRAWL_PAGES = parseInt(process.env.MAX_CRAWL_PAGES || '15')
const CRAWL_TIMEOUT = parseInt(process.env.CRAWL_TIMEOUT || '15000')
const MAX_REDIRECTS = parseInt(process.env.MAX_REDIRECTS || '5')
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024

async function fetchPage(targetUrl, redirects = 0) {
  if (redirects > MAX_REDIRECTS) throw new Error('Too many redirects')

  const parsed = validateURL(targetUrl)
  await resolveAndValidate(parsed.hostname)

  const response = await fetchWithTimeout(parsed.href, {
    headers: {
      'User-Agent': 'SEO-Audit-Bot/1.0 (+https://example.com/bot)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  }, CRAWL_TIMEOUT)

  // Manual redirect handling
  if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
    const redirectUrl = new URL(response.headers.get('location'), parsed.href).href
    return fetchPage(redirectUrl, redirects + 1)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) {
    return { url: parsed.href, status: response.status, html: '', contentType, redirects, links: [], isHTML: false }
  }

  const html = await response.text()
  if (html.length > MAX_RESPONSE_SIZE) throw new Error('Response too large')

  return { url: parsed.href, status: response.status, html, contentType, redirects, links: [], isHTML: true }
}

function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html)
  const base = new URL(baseUrl)
  const internal = new Set()
  const external = new Set()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return
    try {
      const linkUrl = new URL(href, baseUrl)
      if (linkUrl.hostname === base.hostname) internal.add(linkUrl.href)
      else external.add(linkUrl.href)
    } catch {}
  })

  return { internal: [...internal].slice(0, 50), external: [...external].slice(0, 50) }
}

function parseHTML(html, pageUrl) {
  const $ = cheerio.load(html)
  $('script, style, noscript').remove()

  const h1 = $('h1').map((_, el) => $(el).text().trim()).get()
  const h2 = $('h2').map((_, el) => $(el).text().trim()).get()
  const h3 = $('h3').map((_, el) => $(el).text().trim()).get()

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const words = bodyText.split(/\s+/).filter(Boolean)

  const images = $('img').map((_, el) => ({
    src: $(el).attr('src') || '',
    alt: $(el).attr('alt') ?? null,
    width: $(el).attr('width'),
    height: $(el).attr('height'),
  })).get()

  // Structured data
  const schemas = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html())
      if (data['@type']) schemas.push(data['@type'])
      else if (Array.isArray(data)) data.forEach(d => { if (d['@type']) schemas.push(d['@type']) })
    } catch {}
  })

  return {
    url: pageUrl,
    hostname: new URL(pageUrl).hostname,
    title: $('title').first().text().trim(),
    metaDescription: $('meta[name="description"]').attr('content')?.trim() || '',
    canonical: $('link[rel="canonical"]').attr('href') || '',
    robotsMeta: $('meta[name="robots"]').attr('content') || '',
    h1, h2, h3,
    wordCount: words.length,
    sentences: bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
    paragraphs: $('p').length,
    bodyText: bodyText.substring(0, 5000),
    images,
    missingAltCount: images.filter(i => i.alt === null || i.alt === '').length,
    totalImages: images.length,
    links: extractLinks(html, pageUrl),
    schemas: [...new Set(schemas)],
    og: {
      title: $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      url: $('meta[property="og:url"]').attr('content') || '',
    },
    twitter: {
      card: $('meta[name="twitter:card"]').attr('content') || '',
      title: $('meta[name="twitter:title"]').attr('content') || '',
      description: $('meta[name="twitter:description"]').attr('content') || '',
      image: $('meta[name="twitter:image"]').attr('content') || '',
    },
  }
}

async function fetchRaw(url, timeoutMs = 10000) {
  const resp = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'SEO-Audit-Bot/1.0', 'Accept': '*/*' },
    redirect: 'follow',
  }, timeoutMs)
  return resp.ok ? await resp.text() : ''
}

export async function crawlWebsite(targetUrl) {
  validateURL(targetUrl)

  // Fetch homepage
  const result = await fetchPage(targetUrl)
  if (!result.isHTML) throw new Error('Website did not return HTML')

  const homepage = parseHTML(result.html, result.url)
  homepage.statusCode = result.status
  homepage.redirects = result.redirects

  const pages = [homepage]
  const visited = new Set([result.url])
  const toVisit = homepage.links.internal.slice(0, MAX_CRAWL_PAGES - 1)

  // Crawl additional pages
  for (const linkUrl of toVisit) {
    if (pages.length >= MAX_CRAWL_PAGES) break
    if (visited.has(linkUrl)) continue
    visited.add(linkUrl)
    try {
      const pageResult = await fetchPage(linkUrl)
      if (pageResult.isHTML) {
        const page = parseHTML(pageResult.html, pageResult.url)
        page.statusCode = pageResult.status
        page.redirects = pageResult.redirects
        pages.push(page)
      }
    } catch {}
  }

  // Check robots.txt
  let robotsTxt = ''
  let robotsSitemapUrl = null
  try {
    robotsTxt = await fetchRaw(new URL('/robots.txt', targetUrl).href) || ''
    const match = robotsTxt.match(/Sitemap:\s*(\S+)/i)
    if (match) robotsSitemapUrl = match[1]
  } catch {}

  // Check sitemap — try multiple locations
  let sitemapXml = ''
  const sitemapLocations = [robotsSitemapUrl, '/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml'].filter(Boolean)
  for (const loc of sitemapLocations) {
    try {
      const text = await fetchRaw(new URL(loc, targetUrl).href)
      if (text && text.length > 50) { sitemapXml = text; break }
    } catch {}
  }

  return { targetUrl, pages, robotsTxt, sitemapXml, totalPages: pages.length }
}

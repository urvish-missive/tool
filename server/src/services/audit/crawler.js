import * as cheerio from 'cheerio'
import { validateURL, resolveAndValidate, fetchWithTimeout } from '../../utils/helpers.js'

const MAX_CRAWL_PAGES = parseInt(process.env.MAX_CRAWL_PAGES || '10')
const CRAWL_TIMEOUT = parseInt(process.env.CRAWL_TIMEOUT || '10000')
const MAX_REDIRECTS = parseInt(process.env.MAX_REDIRECTS || '5')
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
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

  let response
  try {
    response = await fetchWithTimeout(parsed.href, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    }, CRAWL_TIMEOUT)
  } catch (fetchErr) {
    // If https fails with connection error, try fallback without abort
    console.warn(`Fetch error for ${parsed.href}:`, fetchErr.message)
    throw fetchErr
  }

  // Manual redirect handling
  if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
    const redirectUrl = new URL(response.headers.get('location'), parsed.href).href
    return fetchPage(redirectUrl, redirects + 1)
  }

  const contentType = response.headers.get('content-type') || ''
  const isHtmlType = contentType.toLowerCase().includes('html') || contentType === ''

  const html = await response.text()
  if (html.length > MAX_RESPONSE_SIZE) throw new Error('Response too large')

  const isHTML = isHtmlType || html.includes('<html') || html.includes('<!DOCTYPE') || html.includes('<body')

  return { url: parsed.href, status: response.status, html, contentType, redirects, links: [], isHTML }
}

function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html)
  const base = new URL(baseUrl)
  const internal = new Set()
  const external = new Set()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return
    try {
      const linkUrl = new URL(href, baseUrl)
      if (linkUrl.hostname === base.hostname) {
        // Normalize path
        linkUrl.hash = ''
        internal.add(linkUrl.href)
      } else {
        external.add(linkUrl.href)
      }
    } catch {}
  })

  return { internal: [...internal].slice(0, 50), external: [...external].slice(0, 50) }
}

function parseHTML(html, pageUrl) {
  const $ = cheerio.load(html)
  $('script, style, noscript').remove()

  const h1 = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean)
  const h2 = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean)
  const h3 = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean)

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

async function fetchRaw(url, timeoutMs = 6000) {
  try {
    const resp = await fetchWithTimeout(url, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    }, timeoutMs)
    return resp.ok ? await resp.text() : ''
  } catch {
    return ''
  }
}

export async function crawlWebsite(targetUrl) {
  validateURL(targetUrl)

  // Fetch homepage first
  const result = await fetchPage(targetUrl)
  if (!result.isHTML) throw new Error('Website did not return HTML')

  const homepage = parseHTML(result.html, result.url)
  homepage.statusCode = result.status
  homepage.redirects = result.redirects

  const pages = [homepage]
  const visited = new Set([result.url, targetUrl])
  const toVisit = homepage.links.internal.filter(l => !visited.has(l)).slice(0, MAX_CRAWL_PAGES - 1)

  // Crawl additional pages in concurrent batches of 3
  const batchSize = 3
  for (let i = 0; i < toVisit.length && pages.length < MAX_CRAWL_PAGES; i += batchSize) {
    const batch = toVisit.slice(i, i + batchSize).filter(u => !visited.has(u))
    batch.forEach(u => visited.add(u))

    const batchResults = await Promise.allSettled(batch.map(u => fetchPage(u)))
    for (const res of batchResults) {
      if (res.status === 'fulfilled' && res.value && res.value.isHTML) {
        const page = parseHTML(res.value.html, res.value.url)
        page.statusCode = res.value.status
        page.redirects = res.value.redirects
        pages.push(page)
        if (pages.length >= MAX_CRAWL_PAGES) break
      }
    }
  }

  // Check robots.txt & sitemap in parallel
  let robotsTxt = ''
  let robotsSitemapUrl = null
  let sitemapXml = ''

  try {
    const [robotsContent, sitemapContent] = await Promise.all([
      fetchRaw(new URL('/robots.txt', targetUrl).href),
      fetchRaw(new URL('/sitemap.xml', targetUrl).href),
    ])

    robotsTxt = robotsContent || ''
    if (robotsTxt) {
      const match = robotsTxt.match(/Sitemap:\s*(\S+)/i)
      if (match) robotsSitemapUrl = match[1]
    }

    if (sitemapContent && sitemapContent.length > 50) {
      sitemapXml = sitemapContent
    } else if (robotsSitemapUrl) {
      sitemapXml = await fetchRaw(robotsSitemapUrl)
    }
  } catch {}

  return { targetUrl, pages, robotsTxt, sitemapXml, totalPages: pages.length }
}

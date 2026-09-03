import * as cheerio from 'cheerio'
import { validateURL, resolveAndValidate, fetchWithTimeout } from '../utils/helpers.js'

const FETCH_TIMEOUT_MS = 15000

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Upgrade-Insecure-Requests': '1',
}

/**
 * Fetch HTML securely with SSRF checks and timeout
 */
async function fetchPageHtml(targetUrl) {
  let urlToFetch = targetUrl.trim()
  if (!urlToFetch.startsWith('http://') && !urlToFetch.startsWith('https://')) {
    urlToFetch = `https://${urlToFetch}`
  }

  const parsed = validateURL(urlToFetch)
  await resolveAndValidate(parsed.hostname)

  const response = await fetchWithTimeout(
    parsed.href,
    {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    },
    FETCH_TIMEOUT_MS
  )

  if (!response.ok) {
    throw new Error(`Website responded with status ${response.status} (${response.statusText})`)
  }

  const html = await response.text()
  if (!html || html.trim().length === 0) {
    throw new Error('Received empty HTML response from the website.')
  }

  return { html, finalUrl: response.url || parsed.href, hostname: parsed.hostname }
}

/**
 * Determine file format / extension from URL
 */
function inferFormat(srcUrl) {
  try {
    const pathname = new URL(srcUrl).pathname.toLowerCase()
    if (pathname.endsWith('.webp')) return 'webp'
    if (pathname.endsWith('.png')) return 'png'
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'jpg'
    if (pathname.endsWith('.svg')) return 'svg'
    if (pathname.endsWith('.gif')) return 'gif'
    if (pathname.endsWith('.avif')) return 'avif'
    if (pathname.endsWith('.ico')) return 'ico'
  } catch {}
  return 'unknown'
}

/**
 * Extract filename from URL
 */
function extractFilename(srcUrl) {
  try {
    const pathname = new URL(srcUrl).pathname
    const parts = pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (last && last.length < 60) return decodeURIComponent(last)
  } catch {}
  return 'image'
}

/**
 * Parse responsive srcset
 */
function parseSrcset(srcsetStr, baseUrl) {
  if (!srcsetStr) return []
  const candidates = []
  const parts = srcsetStr.split(',')
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const tokens = trimmed.split(/\s+/)
    if (tokens[0]) {
      try {
        const resolved = new URL(tokens[0], baseUrl).href
        candidates.push({
          url: resolved,
          descriptor: tokens[1] || '',
        })
      } catch {}
    }
  }
  return candidates
}

/**
 * Extract all images from HTML
 */
export async function extractWebsiteImages(targetUrl, options = {}) {
  const { html, finalUrl, hostname } = await fetchPageHtml(targetUrl)
  const $ = cheerio.load(html)

  const imageMap = new Map() // url -> image object

  function addImage(rawSrc, extra = {}) {
    if (!rawSrc || typeof rawSrc !== 'string') return
    const trimmed = rawSrc.trim()
    if (!trimmed || trimmed.startsWith('javascript:')) return

    try {
      let resolved
      if (trimmed.startsWith('data:image/svg+xml')) {
        // SVG data URI
        resolved = trimmed
      } else if (trimmed.startsWith('data:')) {
        return // skip large base64 raster data URIs
      } else {
        resolved = new URL(trimmed, finalUrl).href
      }

      if (imageMap.has(resolved)) {
        const existing = imageMap.get(resolved)
        // enrich alt if previously empty
        if (!existing.alt && extra.alt) existing.alt = extra.alt
        return
      }

      const format = inferFormat(resolved)
      const filename = extractFilename(resolved)
      const isSvg = format === 'svg' || resolved.includes('data:image/svg')

      let category = 'photo'
      if (extra.isSocial) {
        category = 'social'
      } else if (isSvg || extra.isIcon) {
        category = 'vector'
      } else if (format === 'ico') {
        category = 'icon'
      }

      imageMap.set(resolved, {
        url: resolved,
        filename,
        format,
        alt: extra.alt || '',
        title: extra.title || '',
        width: extra.width || null,
        height: extra.height || null,
        category,
        sourceType: extra.sourceType || 'img',
        hasAlt: Boolean(extra.alt && extra.alt.trim().length > 0),
      })
    } catch {
      // ignore invalid URLs
    }
  }

  // 1. Social & Open Graph Images
  const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content')
  if (ogImage) {
    addImage(ogImage, {
      alt: $('meta[property="og:image:alt"]').attr('content') || 'Social Share Banner (Open Graph)',
      isSocial: true,
      sourceType: 'og:image',
    })
  }

  const twitterImage = $('meta[name="twitter:image"]').attr('content')
  if (twitterImage && twitterImage !== ogImage) {
    addImage(twitterImage, {
      alt: 'Twitter Card Share Banner',
      isSocial: true,
      sourceType: 'twitter:image',
    })
  }

  // 2. Favicons & Brand Icons
  $('link[rel*="icon"], link[rel="apple-touch-icon"]').each((_, el) => {
    const href = $(el).attr('href')
    const sizes = $(el).attr('sizes')
    if (href) {
      addImage(href, {
        alt: `Brand Favicon (${sizes || 'Icon'})`,
        isIcon: true,
        sourceType: 'favicon',
      })
    }
  })

  // 3. Standard <img> and Picture sources
  $('img').each((_, el) => {
    const src = $(el).attr('src')
    const dataSrc =
      $(el).attr('data-src') ||
      $(el).attr('data-lazy-src') ||
      $(el).attr('data-original') ||
      $(el).attr('data-url')
    const srcset = $(el).attr('srcset') || $(el).attr('data-srcset')
    const alt = $(el).attr('alt')?.trim() || ''
    const title = $(el).attr('title')?.trim() || ''
    const width = $(el).attr('width') || null
    const height = $(el).attr('height') || null

    if (src) {
      addImage(src, { alt, title, width, height, sourceType: 'img' })
    }

    if (dataSrc && dataSrc !== src) {
      addImage(dataSrc, { alt, title, width, height, sourceType: 'lazy' })
    }

    if (srcset) {
      const candidates = parseSrcset(srcset, finalUrl)
      candidates.forEach((c) => {
        addImage(c.url, { alt, title, sourceType: 'srcset' })
      })
    }
  })

  // 4. Picture <source> tags
  $('picture source[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset')
    const candidates = parseSrcset(srcset, finalUrl)
    candidates.forEach((c) => {
      addImage(c.url, { sourceType: 'picture-source' })
    })
  })

  // 5. SVG Object & Embed tags
  $('object[data*=".svg"], embed[src*=".svg"]').each((_, el) => {
    const src = $(el).attr('data') || $(el).attr('src')
    if (src) {
      addImage(src, { isIcon: true, sourceType: 'svg-embed' })
    }
  })

  // 6. CSS Background images in inline styles
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || ''
    const bgMatch = style.match(/url\(['"]?(.*?)['"]?\)/i)
    if (bgMatch && bgMatch[1]) {
      addImage(bgMatch[1], { sourceType: 'css-background' })
    }
  })

  const allImages = Array.from(imageMap.values())

  // Compute Statistics
  const formatCounts = {}
  let withAltCount = 0

  allImages.forEach((img) => {
    formatCounts[img.format] = (formatCounts[img.format] || 0) + 1
    if (img.hasAlt) withAltCount++
  })

  const withoutAltCount = allImages.length - withAltCount

  const categories = {
    all: allImages.length,
    photos: allImages.filter((i) => i.category === 'photo').length,
    vectors: allImages.filter((i) => i.category === 'vector').length,
    social: allImages.filter((i) => i.category === 'social').length,
    icons: allImages.filter((i) => i.category === 'icon').length,
    missingAlt: withoutAltCount,
  }

  return {
    websiteUrl: finalUrl,
    hostname,
    pageTitle: $('title').first().text().trim() || hostname,
    totalImages: allImages.length,
    stats: {
      withAlt: withAltCount,
      withoutAlt: withoutAltCount,
      altPercentage: allImages.length ? Math.round((withAltCount / allImages.length) * 100) : 100,
      formatCounts,
      categories,
    },
    images: allImages,
    extractedAt: new Date().toISOString(),
  }
}

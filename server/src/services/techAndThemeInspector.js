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
}

/**
 * Convert RGB to Hex
 */
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

/**
 * Convert HSL to Hex
 */
function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return rgbToHex(Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4)))
}

/**
 * Standardize hex code to 6-digit uppercase
 */
function normalizeHex(hex) {
  let clean = hex.trim().replace(/^#/, '').toUpperCase()
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (clean.length === 6 && /^[0-9A-F]{6}$/.test(clean)) {
    return `#${clean}`
  }
  return null
}

/**
 * Calculate Relative Luminance & Contrast against white/black
 */
function getContrastInfo(hex) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

  const contrastOnWhite = (1.0 + 0.05) / (lum + 0.05)
  const contrastOnBlack = (lum + 0.05) / (0.0 + 0.05)

  const isLight = lum > 0.4
  const bestTextColor = isLight ? '#0F172A' : '#FFFFFF'
  const wcagRating = Math.max(contrastOnWhite, contrastOnBlack) >= 4.5 ? 'WCAG AA' : 'Low Contrast'

  return {
    isLight,
    bestTextColor,
    wcagRating,
    contrastRatio: (Math.max(contrastOnWhite, contrastOnBlack)).toFixed(1) + ':1',
  }
}

/**
 * Parse Google Fonts from HTML link tags and @import rules
 */
function parseGoogleFonts($, html) {
  const fonts = []
  const fontFamiliesSet = new Set()

  // 1. Google Fonts <link> tags
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    try {
      const url = new URL(href)
      const familyParams = url.searchParams.getAll('family')

      for (const param of familyParams) {
        // Example: "Inter:wght@400;600;700" or "Playfair Display:ital,wght@0,400;1,700"
        const [namePart, stylePart] = param.split(':')
        const fontName = decodeURIComponent(namePart.replace(/\+/g, ' ')).trim()

        if (fontName && !fontFamiliesSet.has(fontName.toLowerCase())) {
          fontFamiliesSet.add(fontName.toLowerCase())

          const weights = []
          if (stylePart) {
            const matches = stylePart.match(/\b\d{3}\b/g)
            if (matches) {
              matches.forEach((w) => {
                if (!weights.includes(w)) weights.push(w)
              })
            }
          }

          fonts.push({
            family: fontName,
            weights: weights.length ? weights : ['400'],
            source: 'Google Fonts',
            url: href,
            importSnippet: `@import url('${href}');`,
          })
        }
      }
    } catch {}
  })

  // 2. Scan style blocks for @import or font-family declarations
  $('style').each((_, el) => {
    const css = $(el).html() || ''
    const importMatches = css.matchAll(/@import\s+url\(['"]?(https:\/\/fonts\.googleapis\.com\/[^'"]+)['"]?\)/gi)
    for (const match of importMatches) {
      const href = match[1]
      try {
        const url = new URL(href)
        const familyParams = url.searchParams.getAll('family')
        for (const param of familyParams) {
          const [namePart] = param.split(':')
          const fontName = decodeURIComponent(namePart.replace(/\+/g, ' ')).trim()
          if (fontName && !fontFamiliesSet.has(fontName.toLowerCase())) {
            fontFamiliesSet.add(fontName.toLowerCase())
            fonts.push({
              family: fontName,
              weights: ['400', '700'],
              source: 'Google Fonts (@import)',
              url: href,
              importSnippet: `@import url('${href}');`,
            })
          }
        }
      } catch {}
    }

    // Check @font-face
    const fontFaceMatches = css.matchAll(/@font-face\s*\{[^}]*font-family:\s*['"]?([^'";}]+)['"]?/gi)
    for (const match of fontFaceMatches) {
      const fontName = match[1].trim()
      if (fontName && !fontFamiliesSet.has(fontName.toLowerCase()) && !fontName.includes('icon')) {
        fontFamiliesSet.add(fontName.toLowerCase())
        fonts.push({
          family: fontName,
          weights: ['Custom / Local'],
          source: 'Local @font-face',
          url: null,
          importSnippet: `/* @font-face: ${fontName} */`,
        })
      }
    }
  })

  // 3. Fallback: inspect CSS font-family rules on body
  const bodyStyle = $('body').attr('style') || ''
  const fontMatch = bodyStyle.match(/font-family:\s*([^;]+)/i)
  if (fontMatch && fontMatch[1]) {
    const rawFamily = fontMatch[1].split(',')[0].replace(/['"]/g, '').trim()
    if (rawFamily && !fontFamiliesSet.has(rawFamily.toLowerCase())) {
      fonts.push({
        family: rawFamily,
        weights: ['Regular'],
        source: 'Inline Body Style',
        url: null,
      })
    }
  }

  return fonts
}

/**
 * Extract Colors from Stylesheets, Meta Tags & CSS Variables
 */
function parseThemeColors($, html) {
  const colorCountMap = new Map() // hex -> count
  const cssVariables = {}

  function registerColor(rawHex, bonusWeight = 1) {
    const normalized = normalizeHex(rawHex)
    if (!normalized) return
    // Ignore pure alpha transparent
    if (normalized === '#00000000') return

    colorCountMap.set(normalized, (colorCountMap.get(normalized) || 0) + bonusWeight)
  }

  // 1. Meta theme-color & tile color (highest brand priority)
  const metaThemeColor =
    $('meta[name="theme-color"]').attr('content') ||
    $('meta[name="msapplication-TileColor"]').attr('content') ||
    $('meta[name="apple-mobile-web-app-status-bar-style"]').attr('content')

  if (metaThemeColor && metaThemeColor.startsWith('#')) {
    registerColor(metaThemeColor, 100) // Huge bonus
  }

  // 2. Parse CSS Variables from :root and <style>
  $('style').each((_, el) => {
    const css = $(el).html() || ''

    // CSS variables: --primary-color: #0C81F3;
    const varMatches = css.matchAll(/--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g)
    for (const match of varMatches) {
      const varName = `--${match[1]}`
      const varValue = match[2].trim()

      if (varValue.startsWith('#')) {
        const hex = normalizeHex(varValue)
        if (hex) {
          cssVariables[varName] = hex
          registerColor(hex, 15)
        }
      } else if (varValue.startsWith('rgb')) {
        const rgbMatch = varValue.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/)
        if (rgbMatch) {
          const hex = rgbToHex(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]))
          cssVariables[varName] = hex
          registerColor(hex, 15)
        }
      } else if (varValue.startsWith('hsl')) {
        const hslMatch = varValue.match(/hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%/)
        if (hslMatch) {
          const hex = hslToHex(parseInt(hslMatch[1]), parseInt(hslMatch[2]), parseInt(hslMatch[3]))
          cssVariables[varName] = hex
          registerColor(hex, 15)
        }
      }
    }

    // General Hex regex
    const hexMatches = css.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)
    for (const match of hexMatches) {
      registerColor(match[0], 1)
    }

    // General RGB regex
    const rgbMatches = css.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi)
    for (const match of rgbMatches) {
      registerColor(rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])), 1)
    }
  })

  // 3. Scan inline style attributes & SVG fills
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || ''
    const hexMatches = style.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)
    for (const match of hexMatches) {
      registerColor(match[0], 2)
    }
  })

  $('[fill], [stroke]').each((_, el) => {
    const fill = $(el).attr('fill')
    const stroke = $(el).attr('stroke')
    if (fill && fill.startsWith('#')) registerColor(fill, 2)
    if (stroke && stroke.startsWith('#')) registerColor(stroke, 2)
  })

  // Rank and categorize colors
  const sortedColors = Array.from(colorCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([hex, count]) => ({
      hex,
      count,
      ...getContrastInfo(hex),
    }))

  // Filter out pure common grays and blacks for the brand primary
  const vibrantColors = sortedColors.filter((c) => {
    const clean = c.hex.replace('#', '')
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b))
    // Vibrant if channels differ significantly
    return diff > 15 && c.hex !== '#FFFFFF' && c.hex !== '#000000'
  })

  const primary = metaThemeColor && normalizeHex(metaThemeColor)
    ? normalizeHex(metaThemeColor)
    : vibrantColors[0]?.hex || sortedColors[0]?.hex || '#0C81F3'

  const secondary = vibrantColors.find((c) => c.hex !== primary)?.hex || sortedColors[1]?.hex || '#EB8988'
  const accent = vibrantColors.find((c) => c.hex !== primary && c.hex !== secondary)?.hex || '#38BDF8'

  // Curated palette of unique shades
  const palette = sortedColors.slice(0, 12).map((item, idx) => {
    let role = 'Accent'
    if (item.hex === primary) role = 'Brand Primary'
    else if (item.hex === secondary) role = 'Brand Secondary'
    else if (item.hex === accent) role = 'Accent Highlight'
    else if (item.hex === '#FFFFFF' || item.hex === '#FAFAFA' || item.hex === '#F8FAFC') role = 'Background Light'
    else if (item.hex === '#000000' || item.hex === '#0F172A' || item.hex === '#1E293B') role = 'Dark Neutral'

    return {
      hex: item.hex,
      role,
      occurrences: item.count,
      isLight: item.isLight,
      bestTextColor: item.bestTextColor,
      wcagRating: item.wcagRating,
      contrastRatio: item.contrastRatio,
    }
  })

  // Exportable Snippets
  const cssVariablesExport = `:root {\n  --brand-primary: ${primary};\n  --brand-secondary: ${secondary};\n  --brand-accent: ${accent};\n${Object.entries(
    cssVariables
  )
    .slice(0, 8)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')}\n}`

  const tailwindExport = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n        brand: {\n          primary: '${primary}',\n          secondary: '${secondary}',\n          accent: '${accent}',\n        }\n      }\n    }\n  }\n}`

  return {
    metaThemeColor: metaThemeColor || null,
    primary,
    secondary,
    accent,
    palette,
    cssVariables,
    snippets: {
      cssVariables: cssVariablesExport,
      tailwind: tailwindExport,
    },
  }
}

/**
 * Detect Tech Stack, CMS, Frameworks & Libraries
 */
function detectTechStack($, html, headers = {}) {
  const stack = []
  const foundNames = new Set()

  function addTech(name, category, confidence = 'High', version = null, icon = null) {
    if (foundNames.has(name.toLowerCase())) return
    foundNames.add(name.toLowerCase())
    stack.push({ name, category, confidence, version, icon })
  }

  const htmlLower = html.toLowerCase()
  const serverHeader = (headers['server'] || '').toLowerCase()
  const poweredBy = (headers['x-powered-by'] || '').toLowerCase()

  // 1. CMS & Website Builders
  const generator = ($('meta[name="generator"]').attr('content') || '').toLowerCase()
  if (generator.includes('wordpress') || htmlLower.includes('/wp-content/') || htmlLower.includes('/wp-includes/')) {
    const versionMatch = generator.match(/wordpress\s*([\d.]+)/)
    addTech('WordPress', 'CMS / Platform', 'High', versionMatch ? versionMatch[1] : null, '📝')
  }
  if (htmlLower.includes('cdn.shopify.com') || htmlLower.includes('shopify.theme') || $('script[src*="shopify"]').length) {
    addTech('Shopify', 'CMS / E-Commerce', 'High', null, '🛍️')
  }
  if ($('[data-wf-page]').length || $('[data-wf-site]').length || htmlLower.includes('assets.website-files.com')) {
    addTech('Webflow', 'CMS / Site Builder', 'High', null, '🌊')
  }
  if (htmlLower.includes('wix.com') || htmlLower.includes('wix-code') || headers['x-wix-renderer-server']) {
    addTech('Wix', 'CMS / Site Builder', 'High', null, '✨')
  }
  if (htmlLower.includes('static1.squarespace.com') || htmlLower.includes('squarespace-core')) {
    addTech('Squarespace', 'CMS / Site Builder', 'High', null, '⬛')
  }
  if (generator.includes('ghost') || htmlLower.includes('ghost.org')) {
    addTech('Ghost', 'CMS / Publishing', 'High', null, '👻')
  }
  if (generator.includes('drupal') || htmlLower.includes('drupal.js')) {
    addTech('Drupal', 'CMS / Platform', 'High', null, '💧')
  }
  if (generator.includes('joomla')) {
    addTech('Joomla', 'CMS / Platform', 'High', null, '⭐')
  }
  if (generator.includes('hubspot') || htmlLower.includes('hs-scripts.com')) {
    addTech('HubSpot CMS', 'CMS / Marketing', 'High', null, '🟧')
  }

  // 2. JavaScript Frameworks & SSR
  if ($('script#__NEXT_DATA__').length || htmlLower.includes('/_next/static/')) {
    addTech('Next.js', 'JS Framework / SSR', 'High', null, '▲')
  }
  if ($('#__nuxt').length || $('div[data-server-rendered]').length || htmlLower.includes('/_nuxt/')) {
    addTech('Nuxt.js', 'JS Framework / SSR', 'High', null, '💚')
  }
  if ($('[data-reactroot]').length || htmlLower.includes('react.production.min.js') || htmlLower.includes('react-dom')) {
    addTech('React', 'JS Library', 'High', null, '⚛️')
  }
  if ($('[data-v-]').length || htmlLower.includes('vue.runtime') || htmlLower.includes('vue.min.js')) {
    addTech('Vue.js', 'JS Framework', 'High', null, '🟩')
  }
  if ($('[ng-version]').length || $('[ng-app]').length || htmlLower.includes('angular.js')) {
    const ngVersion = $('[ng-version]').attr('ng-version')
    addTech('Angular', 'JS Framework', 'High', ngVersion || null, '🅰️')
  }
  if ($('[data-astro-]').length || htmlLower.includes('astro-island')) {
    addTech('Astro', 'Static Site Generator', 'High', null, '🚀')
  }
  if ($('[x-data]').length || $('[x-init]').length) {
    addTech('Alpine.js', 'JS Framework', 'High', null, '🏔️')
  }
  if (htmlLower.includes('jquery') || $('script[src*="jquery"]').length) {
    addTech('jQuery', 'JS Library', 'High', null, '💲')
  }

  // 3. CSS Frameworks
  if (
    htmlLower.includes('tailwind') ||
    $('link[href*="tailwind"]').length ||
    htmlLower.includes('tw-') ||
    $('body[class*="flex items-"]').length ||
    $('body[class*="grid grid-cols-"]').length
  ) {
    addTech('Tailwind CSS', 'CSS Framework', 'High', null, '🎨')
  }
  if ($('link[href*="bootstrap"]').length || $('script[src*="bootstrap"]').length || $('[class*="col-md-"]').length) {
    addTech('Bootstrap', 'CSS Framework', 'High', null, '🅱️')
  }
  if ($('link[href*="bulma"]').length || $('[class*="is-primary"]').length) {
    addTech('Bulma', 'CSS Framework', 'Medium', null, '🥬')
  }

  // 4. Analytics & Tracking
  if (htmlLower.includes('googletagmanager.com/gtm.js') || htmlLower.includes('gtm-')) {
    addTech('Google Tag Manager', 'Tag Management', 'High', null, '🏷️')
  }
  if (htmlLower.includes('googletagmanager.com/gtag/js') || htmlLower.includes('gtag(') || htmlLower.includes('g-')) {
    addTech('Google Analytics 4 (GA4)', 'Analytics', 'High', null, '📊')
  }
  if (htmlLower.includes('connect.facebook.net/en_us/fbevents.js') || htmlLower.includes('fbq(')) {
    addTech('Meta Pixel (Facebook)', 'Ad Tracking', 'High', null, '🔵')
  }
  if (htmlLower.includes('static.hotjar.com') || htmlLower.includes('hotjar.com')) {
    addTech('Hotjar', 'Behavior Analytics', 'High', null, '🔥')
  }
  if (htmlLower.includes('cdn.segment.com/analytics.js')) {
    addTech('Segment', 'Customer Data Platform', 'High', null, '🟢')
  }
  if (htmlLower.includes('cdn.mxpnl.com') || htmlLower.includes('mixpanel')) {
    addTech('Mixpanel', 'Product Analytics', 'High', null, '📈')
  }

  // 5. Server, CDN & Infrastructure
  if (headers['cf-ray'] || headers['cf-cache-status'] || serverHeader.includes('cloudflare')) {
    addTech('Cloudflare', 'CDN & Security', 'High', null, '☁️')
  }
  if (headers['x-vercel-id'] || headers['x-vercel-cache']) {
    addTech('Vercel', 'Hosting & Edge Network', 'High', null, '▲')
  }
  if (headers['x-nf-request-id'] || serverHeader.includes('netlify')) {
    addTech('Netlify', 'Hosting & CDN', 'High', null, '🔷')
  }
  if (headers['x-amz-cf-id'] || htmlLower.includes('cloudfront.net')) {
    addTech('AWS CloudFront', 'CDN', 'High', null, '📦')
  }
  if (serverHeader.includes('nginx')) {
    addTech('Nginx', 'Web Server', 'High', null, '⚡')
  }
  if (serverHeader.includes('apache')) {
    addTech('Apache', 'Web Server', 'High', null, '🪶')
  }
  if (poweredBy.includes('php')) {
    addTech('PHP', 'Backend Runtime', 'High', null, '🐘')
  }
  if (poweredBy.includes('express') || serverHeader.includes('express')) {
    addTech('Express.js / Node', 'Backend Framework', 'High', null, '🟢')
  }

  // 6. E-Commerce & Payments
  if (htmlLower.includes('js.stripe.com') || htmlLower.includes('stripe-')) {
    addTech('Stripe Payments', 'Payment Processor', 'High', null, '💳')
  }
  if (htmlLower.includes('paypal.com/sdk')) {
    addTech('PayPal Checkout', 'Payment Processor', 'High', null, '🅿️')
  }
  if (htmlLower.includes('woocommerce')) {
    addTech('WooCommerce', 'E-Commerce Platform', 'High', null, '🛒')
  }

  // Group by category
  const categories = {}
  stack.forEach((item) => {
    if (!categories[item.category]) categories[item.category] = []
    categories[item.category].push(item)
  })

  return {
    totalDetected: stack.length,
    list: stack,
    byCategory: categories,
  }
}

/**
 * Main Inspector Function
 */
export async function inspectWebsiteTechAndTheme(targetUrl) {
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
    throw new Error(`Website responded with HTTP status ${response.status} (${response.statusText})`)
  }

  const html = await response.text()
  if (!html || html.trim().length === 0) {
    throw new Error('Received empty HTML response from target website.')
  }

  const finalUrl = response.url || parsed.href
  const $ = cheerio.load(html)

  // Collect response headers
  const responseHeaders = {}
  response.headers.forEach((val, key) => {
    responseHeaders[key.toLowerCase()] = val
  })

  // Extract Page Info
  const pageTitle = $('title').first().text().trim() || parsed.hostname
  const metaDescription =
    $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || ''
  const favicon =
    $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '/favicon.ico'

  // Resolve favicon
  let resolvedFavicon = null
  try {
    resolvedFavicon = new URL(favicon, finalUrl).href
  } catch {}

  // 1. Theme Colors
  const colors = parseThemeColors($, html)

  // 2. Tech Stack
  const tech = detectTechStack($, html, responseHeaders)

  // 3. Google Fonts & Typography
  const fonts = parseGoogleFonts($, html)

  // 4. Asset Stats
  const stylesheetsCount = $('link[rel="stylesheet"]').length
  const scriptsCount = $('script[src]').length
  const inlineStylesCount = $('style').length
  const hasViewport = Boolean($('meta[name="viewport"]').length)

  return {
    websiteUrl: finalUrl,
    hostname: parsed.hostname,
    pageTitle,
    metaDescription,
    favicon: resolvedFavicon,
    colors,
    tech,
    fonts,
    stats: {
      stylesheetsCount,
      scriptsCount,
      inlineStylesCount,
      hasViewport,
      server: responseHeaders['server'] || 'Undisclosed',
      contentType: responseHeaders['content-type'] || 'text/html',
    },
    inspectedAt: new Date().toISOString(),
  }
}

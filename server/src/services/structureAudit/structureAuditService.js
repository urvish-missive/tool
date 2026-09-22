import * as cheerio from 'cheerio'
import { validateURL, resolveAndValidate, fetchWithTimeout } from '../../utils/helpers.js'

// ─── Crawl budget knobs (validated data within request timeouts) ───
const FETCH_TIMEOUT_MS = 6000 // GET timeout per page
const HEAD_TIMEOUT_MS = 4000 // existence-check timeout per URL
const HEAD_CONCURRENCY = 25
const MAX_CONCURRENT_FETCHES = 12
const MAX_GET_PAGES = 140 // full HTML extraction budget (real titles, H1s, word counts)
const MAX_HEAD_CHECKS = 600 // real status-code verification budget for remaining URLs
const CRAWL_DEADLINE_MS = 100000 // hard wall-clock budget; leftovers reported as "Not checked"

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MissiveStructureAuditor/1.0',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

const STATIC_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar',
  '.tar', '.gz', '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.webm', '.wav',
  '.css', '.js', '.json', '.xml', '.rss', '.atom', '.woff', '.woff2', '.ttf', '.eot',
])

const IGNORED_PATH_PATTERNS = [
  /\/cdn-cgi\//i,
  /\/wp-content\//i,
  /\/wp-includes\//i,
  /\/wp-json\//i,
  /\/wp-admin\//i,
  /\/xmlrpc\.php/i,
  /\/feed\/?$/i,
  /\/comments\/feed\/?$/i,
  /\/trackback\/?$/i,
  /\/tag\//i,
  /\/author\//i,
  /\/page\/\d+/i,
  /\/\?p=\d+/i,
  /\.php$/i,
  /\.xml$/i,
  /\.txt$/i,
  /\/wp-login/i,
]

// ─── URL hygiene ───────────────────────────────────────────────

/**
 * Normalizes URL: removes tracking params & hash, skips junk paths.
 */
export function cleanUrl(rawUrl, baseUrl) {
  try {
    const urlObj = new URL(rawUrl, baseUrl)
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') return null
    urlObj.hash = ''

    for (const pattern of IGNORED_PATH_PATTERNS) {
      if (pattern.test(urlObj.pathname)) return null
    }

    const paramsToDelete = []
    urlObj.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase()
      if (
        lower.startsWith('utm_') ||
        lower === 'fbclid' ||
        lower === 'gclid' ||
        lower === 'msclkid' ||
        lower === '_ga' ||
        lower === 'replytocom' ||
        lower === 'share'
      ) {
        paramsToDelete.push(key)
      }
    })
    paramsToDelete.forEach((k) => urlObj.searchParams.delete(k))

    let normalized = urlObj.toString()
    if (urlObj.pathname === '' || urlObj.pathname === '/') {
      normalized = `${urlObj.origin}/`
    } else if (!urlObj.pathname.includes('.') && !urlObj.pathname.endsWith('/')) {
      urlObj.pathname = `${urlObj.pathname}/`
      normalized = urlObj.toString()
    }
    return normalized
  } catch {
    return null
  }
}

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

function pathDepth(pathname) {
  return pathname.split('/').filter(Boolean).length
}

function slugOf(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  return parts[parts.length - 1] || ''
}

function titleFromSlug(pathname) {
  const slug = slugOf(pathname)
  if (!slug) return 'Homepage'
  return slug
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function normalizeHost(hostname) {
  return hostname.toLowerCase().replace(/^www\./, '')
}

// ─── Classification (generic, sitemap-type + path evidence) ────

const SECTION_ORDER = [
  'Core', 'Company', 'Partners', 'Legal', 'Resources',
  'Products', 'Features', 'Industries', 'Locations', 'Other',
]

// Site-derived sections (docs, solutions, careers, ...) sort after the canonical ones
const sectionRank = (s) => {
  const i = SECTION_ORDER.indexOf(s)
  return i === -1 ? 99 : i
}

// Path segments that are technical plumbing, not content sections
const NOISE_SEGMENTS = new Set([
  'page', 'pages', 'tag', 'tags', 'author', 'category', 'categories', 'feed', 'comment', 'comments',
  'search', 'login', 'signup', 'wp-content', 'wp-includes', 'wp-admin', 'cgi-bin', 'assets', 'static',
  'images', 'img', 'media', 'files', 'css', 'js', 'en', 'fr', 'de', 'es', 'it', 'pt', 'ar', 'hi', 'nl',
])

// Title-case a raw path segment: 'case-studies' → 'Case Studies'
const humanizeSegment = (seg) =>
  seg
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

const SECTION_HUB_SLUGS = {
  Products: 'products',
  Features: 'features',
  Industries: 'industries',
  Locations: 'locations',
  Resources: 'resources',
  Company: 'company',
  Partners: 'partners',
}

// Article-shaped root slugs (listicles/how-tos living outside the blog) are content, not sections
function isArticleSlug(pathname) {
  if (pathDepth(pathname) !== 1) return false
  const s = slugOf(pathname).toLowerCase()
  return (
    /^(top-|best-|why-|how-|what-is-|finding-|understanding-|exploring-|choosing-|selecting-)/.test(s) ||
    /^[0-9]+-[a-z]/.test(s) ||
    /-(vs|benefits?|reasons?|tips?|advantages?|differences|things|ways|steps)-/.test(s) ||
    s.includes('-everything-you-need-') ||
    /-you-(need|should)-/.test(s)
  )
}

function deriveSection(pathname, sitemapType) {
  const isRoot = pathname === '/' || pathname === ''
  if (isRoot) return 'Core'

  const lower = pathname.toLowerCase()
  const slug = slugOf(pathname)
  const lowerSlug = slug.toLowerCase()
  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase() || ''

  const S = {
    post: 'Resources', blog: 'Resources', case_study: 'Resources', news: 'Resources',
    product: 'Products', page: null, feature: 'Features', industry: 'Industries',
    country: 'Locations', job: 'Company', general: null,
  }
  const bySitemap = S[sitemapType] || null

  // Legal
  if (/terms|privacy|disclaimer|gdpr|cookie|legal|dpa|security-policy/.test(lower)) return 'Legal'
  // Partners
  if (/partner|reseller|affiliate|referral/.test(lower)) return 'Partners'
  // Sitemap evidence
  if (bySitemap) return bySitemap
  // Article-shaped root slugs are content, not sections
  if (isArticleSlug(pathname)) return 'Other'
  // First path segment buckets
  if (firstSegment === 'products' || firstSegment === 'product') return 'Products'
  if (firstSegment === 'features' || firstSegment === 'feature') return 'Features'
  if (firstSegment === 'industries' || firstSegment === 'industry') return 'Industries'
  if (firstSegment === 'locations' || firstSegment === 'location') return 'Locations'
  if (firstSegment === 'blog' || firstSegment === 'news' || firstSegment === 'insights' ||
      firstSegment === 'case-studies' || firstSegment === 'resources' || firstSegment === 'guides') {
    return 'Resources'
  }
  // Dynamic: any other real directory names its own section (docs, solutions, help, careers, ...)
  // — the section names come from the crawled site's URL structure, not a fixed vocabulary
  if (
    pathDepth(pathname) >= 2 &&
    firstSegment &&
    firstSegment.length >= 2 &&
    !/^\d+$/.test(firstSegment) &&
    !NOISE_SEGMENTS.has(firstSegment)
  ) {
    return humanizeSegment(firstSegment)
  }
  // Slug keyword evidence (conservative)
  if (/blog|news|insight|case-stud|guide|webinar|ebook|whitepaper|resource/.test(lower)) return 'Resources'
  if (/contact-center|call-center|cx-suite|ip-pbx|phone-system|pbx|software|platform|broadcast|ucc|ucaas|ccaas/.test(lower)) return 'Products'
  if (/industry|industr|vertical|bpo|fintech/.test(lowerSlug)) return 'Industries'
  if (/voice-bot|chatbot|dialer|ivr|routing|recording|analytics|broadcasting|ticketing|sentiment|whatsapp|sms/.test(lower)) return 'Features'
  if (/location|country|region|netherlands|belgium|turkey|india|usa|canada|australia|germany|france|singapore|uae|dubai/.test(lower)) return 'Locations'
  if (/about|contact|team|career|award|company|press|support|job|vacancy/.test(lower)) return 'Company'

  return 'Other'
}

function deriveContentType(pathname, sitemapType, section, childCountForSegment) {
  const isRoot = pathname === '/' || pathname === ''
  if (isRoot) return 'Home'

  const slug = slugOf(pathname)
  const lowerSlug = slug.toLowerCase()
  const lower = pathname.toLowerCase()

  if (/^(sample-page|hello-world|home-2|front-page|landing-page)\/?$/.test(lower.replace(/^\//, '').replace(/\/$/, ''))) {
    return 'WordPress default'
  }

  // Hub = single-segment page that parents >= 3 pages in the same section
  if (pathDepth(pathname) === 1 && (childCountForSegment || 0) >= 3) return 'Hub'

  const byType = {
    post: 'Blog post', blog: 'Blog post', case_study: 'Case study', job: 'Job',
    product: 'Product', industry: 'Industry', country: 'Location', feature: 'Feature',
  }
  if (byType[sitemapType]) return byType[sitemapType]

  if (pathDepth(pathname) === 1 && ['blog', 'insights', 'news', 'case-studies', 'resources', 'guides'].includes(lowerSlug)) return 'Hub'
  if (lower.includes('/case-studies/') || lower.includes('/case-study/')) return 'Case study'
  if (sitemapType === 'job' || /career|job|vacancy|hiring/.test(lower)) return pathDepth(pathname) === 1 ? 'Company' : 'Job'
  if (/contact|demo|pricing|book|signup|trial|get-started|quote/.test(lowerSlug) && pathDepth(pathname) === 1) return 'Conversion'
  if (section === 'Legal') return 'Legal'
  if (section === 'Products') return 'Product'
  if (section === 'Features') return 'Feature'
  if (section === 'Industries') return 'Industry'
  if (section === 'Locations') return 'Location'
  if (section === 'Resources') return 'Blog post'

  return 'Page'
}

// ─── Sitemap discovery (real XML evidence) ─────────────────────

async function discoverXmlSitemaps(origin, targetHost) {
  const sitemapUrlsMap = new Map() // cleanUrl -> { sitemapType, sitemapUrl }
  const discoveredSitemapFiles = new Set()

  const candidateSitemaps = [
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap.xml`,
    `${origin}/wp-sitemap.xml`,
  ]
  // robots.txt declared sitemaps (raw URLs — never passed through cleanUrl, which filters .xml)
  try {
    const robotsRes = await fetchWithTimeout(`${origin}/robots.txt`, { headers: BROWSER_HEADERS }, 5000)
    if (robotsRes.ok) {
      const robotsText = await robotsRes.text()
      robotsText.split('\n').forEach((line) => {
        const match = line.match(/^sitemap:\s*(\S+)/i)
        if (match) {
          try {
            const declared = new URL(match[1].trim(), origin)
            if (
              (declared.protocol === 'http:' || declared.protocol === 'https:') &&
              normalizeHost(declared.hostname) === targetHost &&
              !candidateSitemaps.includes(declared.toString())
            ) {
              candidateSitemaps.push(declared.toString())
            }
          } catch {}
        }
      })
    }
  } catch {}

  for (const sitemapUrl of candidateSitemaps) {
    if (discoveredSitemapFiles.size > 0 && !sitemapUrl.includes('sitemap')) continue
    try {
      const res = await fetchWithTimeout(sitemapUrl, { headers: BROWSER_HEADERS }, 8000)
      if (!res.ok) continue
      const body = await res.text()
      if (!body.includes('<urlset') && !body.includes('<sitemapindex')) continue

      const $ = cheerio.load(body)
      const isIndex = body.includes('<sitemapindex')

      if (isIndex) {
        discoveredSitemapFiles.add(sitemapUrl)
        const childLocs = []
        $('sitemap > loc').each((_, el) => {
          const loc = $(el).text().trim()
          if (loc) childLocs.push(loc)
        })
        // child sitemap type from filename (raw loc — cleanUrl would strip .xml paths)
        for (const childLoc of childLocs.slice(0, 25)) {
          let childUrl = null
          try {
            const child = new URL(childLoc, origin)
            if (
              (child.protocol === 'http:' || child.protocol === 'https:') &&
              normalizeHost(child.hostname) === targetHost
            ) {
              childUrl = child.toString()
            }
          } catch {}
          if (!childUrl) continue
          try {
            const childRes = await fetchWithTimeout(childUrl, { headers: BROWSER_HEADERS }, 8000)
            if (!childRes.ok) continue
            const childBody = await childRes.text()
            if (!childBody.includes('<urlset')) continue
            const type = deriveSitemapTypeFromName(childUrl)
            discoveredSitemapFiles.add(childUrl)
            cheerio.load(childBody)('url > loc').each((_, el) => {
              const u = cleanUrl($(el).text().trim(), origin)
              if (u && !sitemapUrlsMap.has(u)) sitemapUrlsMap.set(u, { sitemapType: type, sitemapUrl: childUrl })
            })
          } catch {}
        }
      } else {
        const type = deriveSitemapTypeFromName(sitemapUrl)
        discoveredSitemapFiles.add(sitemapUrl)
        $('url > loc').each((_, el) => {
          const u = cleanUrl($(el).text().trim(), origin)
          if (u && !sitemapUrlsMap.has(u)) sitemapUrlsMap.set(u, { sitemapType: type, sitemapUrl })
        })
      }
      if (sitemapUrlsMap.size >= 1200) break
    } catch {}
  }

  return { sitemapUrlsMap, discoveredSitemapsCount: discoveredSitemapFiles.size }
}

function deriveSitemapTypeFromName(sitemapUrl) {
  const name = sitemapUrl.toLowerCase()
  if (name.includes('post') || name.includes('blog')) return 'post'
  if (name.includes('page')) return 'page'
  if (name.includes('product')) return 'product'
  if (name.includes('industry')) return 'industry'
  if (name.includes('countr') || name.includes('location') || name.includes('geo')) return 'country'
  if (name.includes('feature')) return 'feature'
  if (name.includes('case') || name.includes('portfolio') || name.includes('story')) return 'case_study'
  if (name.includes('job') || name.includes('career')) return 'job'
  return 'general'
}

// ─── Homepage navigation (real header/footer anchor evidence) ──

async function discoverHomepageNavigation(origin, targetHost) {
  const headerNavMap = new Map() // url -> { hasAnchor, isLogo }
  const headerNavUrls = new Set()
  const footerCountsMap = new Map() // url -> count
  const navLinkTexts = [] // { area: 'header'|'footer', text, url } for evidence-based gap detection
  let homepageTitle = `${targetHost.charAt(0).toUpperCase() + targetHost.slice(1)} — Homepage`

  try {
    const res = await fetchWithTimeout(`${origin}/`, { headers: BROWSER_HEADERS }, 10000)
    if (res.ok) {
      const homepageHtml = await res.text()
      const $ = cheerio.load(homepageHtml)

      const rawTitle = $('title').text().trim() || $('h1').first().text().trim()
      if (rawTitle) homepageTitle = rawTitle.replace(/\s+/g, ' ').substring(0, 150)

      // 1. Header navigation
      $(
        'header a[href], nav:not(footer nav) a[href], #header a[href], .site-header a[href], .header-navigation a[href], .main-navigation a[href], #masthead a[href]'
      ).each((_, el) => {
        if ($(el).closest('footer').length > 0) return
        const rawHref = $(el).attr('href') || ''
        const text = ($(el).text() || '').replace(/\s+/g, ' ').trim().toLowerCase()
        const hasAnchor = rawHref.includes('#') && !rawHref.endsWith('#')
        const isLogo =
          $(el).find('img, svg').length > 0 ||
          $(el).hasClass('logo') ||
          $(el).attr('id')?.includes('logo') ||
          $(el).attr('class')?.includes('logo') ||
          $(el).attr('rel') === 'home'
        const cleaned = cleanUrl(rawHref, origin)

        if (cleaned) {
          try {
            const h = normalizeHost(new URL(cleaned).hostname)
            if (h === targetHost) {
              headerNavUrls.add(cleaned)
              if (!headerNavMap.has(cleaned)) {
                headerNavMap.set(cleaned, { hasAnchor, isLogo })
              } else if (hasAnchor) {
                headerNavMap.get(cleaned).hasAnchor = true
              }
              if (text && !isLogo) navLinkTexts.push({ area: 'header', text, url: cleaned, rawHref })
            }
          } catch {}
        }
      })

      // 2. Footer navigation
      $(
        'footer a[href], [role="contentinfo"] a[href], .footer a[href], [class*="footer"] a[href], [id*="footer"] a[href]'
      ).each((_, el) => {
        const rawHref = $(el).attr('href') || ''
        const text = ($(el).text() || '').replace(/\s+/g, ' ').trim().toLowerCase()
        const cleaned = cleanUrl(rawHref, origin)

        if (cleaned) {
          try {
            const h = normalizeHost(new URL(cleaned).hostname)
            if (h === targetHost) {
              footerCountsMap.set(cleaned, (footerCountsMap.get(cleaned) || 0) + 1)
              if (text) navLinkTexts.push({ area: 'footer', text, url: cleaned, rawHref })
            }
          } catch {}
        }
      })
    }
  } catch {}

  return { headerNavMap, headerNavUrls, footerCountsMap, navLinkTexts, homepageTitle }
}

// ─── Main crawl: GET + HEAD verification for every URL ─────────

async function crawlWebsite(websiteUrl) {
  let initialUrl = websiteUrl.trim()
  if (!initialUrl.startsWith('http://') && !initialUrl.startsWith('https://')) {
    initialUrl = `https://${initialUrl}`
  }

  const parsedTarget = validateURL(initialUrl)
  await resolveAndValidate(parsedTarget.hostname)
  const targetHost = normalizeHost(parsedTarget.hostname)
  const origin = `${parsedTarget.protocol}//${parsedTarget.hostname}`
  const homeClean = `${origin}/`

  const startedAt = Date.now()
  const deadline = startedAt + CRAWL_DEADLINE_MS
  const timeLeft = () => deadline - Date.now()

  // 1. Sitemaps
  const { sitemapUrlsMap, discoveredSitemapsCount } = await discoverXmlSitemaps(origin, targetHost)

  // 2. Homepage navigation
  const { headerNavMap, headerNavUrls, footerCountsMap, navLinkTexts, homepageTitle } =
    await discoverHomepageNavigation(origin, targetHost)

  // 3. Queue: homepage → header nav → sitemap URLs → linked pages
  const queue = []
  const queuedSet = new Set()
  const pushUnique = (url, source) => {
    if (!url || queuedSet.has(url) || isStaticAsset(url)) return
    queuedSet.add(url)
    queue.push({ url, source })
  }

  // BFS seeds: homepage + real header navigation. Sitemap URLs are appended as a TAIL after
  // the GET phase below, so link-discovered (hub/detail) pages claim the fetch budget first
  // and inlink counts / click depths come from real links rather than sitemap order.
  pushUnique(homeClean, 'homepage')
  headerNavUrls.forEach((u) => pushUnique(u, 'header-nav'))

  // Link graph / depth (BFS from homepage through real crawled links only)
  const minDepthMap = new Map([[homeClean, 1]])
  const inlinksMap = new Map() // url -> Set of source URLs
  const pageData = new Map() // cleanUrl -> real extraction results

  headerNavUrls.forEach((navUrl) => {
    if (!inlinksMap.has(navUrl)) inlinksMap.set(navUrl, new Set())
    inlinksMap.get(navUrl).add(homeClean)
    if (!minDepthMap.has(navUrl)) minDepthMap.set(navUrl, 2)
  })

  // Extract links + evidence from fetched HTML
  function extractFromHtml(html, sourceUrl) {
    const $ = cheerio.load(html)
    $('script, style, noscript, svg').remove()

    const title = ($('title').text() || '').replace(/\s+/g, ' ').trim().substring(0, 200)
    const metaDescription = ($('meta[name="description"]').attr('content') || '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 400)
    const h1Count = $('h1').length
    const h1 = ($('h1').first().text() || '').replace(/\s+/g, ' ').trim().substring(0, 200)
    const wordCount = $('body').text().replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length

    const outLinks = []
    $('a[href]').each((_, el) => {
      const candidate = cleanUrl($(el).attr('href') || '', sourceUrl)
      if (!candidate || isStaticAsset(candidate)) return
      try {
        if (normalizeHost(new URL(candidate).hostname) === targetHost) outLinks.push(candidate)
      } catch {}
    })

    return { title, metaDescription, h1, h1Count, wordCount, outLinks }
  }

  function registerLinks(sourceUrl, outLinks, sourceDepth) {
    outLinks.forEach((candidate) => {
      if (!inlinksMap.has(candidate)) inlinksMap.set(candidate, new Set())
      inlinksMap.get(candidate).add(sourceUrl)
      // always enqueue for verification, even when we can't compute depth for it
      if (!queuedSet.has(candidate)) pushUnique(candidate, 'crawl-link')
      if (sourceDepth === null || sourceDepth === undefined) return // unknown source depth → don't invent one
      const nextDepth = sourceDepth + 1
      if (!minDepthMap.has(candidate) || nextDepth < minDepthMap.get(candidate)) {
        minDepthMap.set(candidate, nextDepth)
      }
    })
  }

  // ── Phase A: GET crawl (full evidence) ──
  let getIndex = 0
  let getBudget = MAX_GET_PAGES

  async function getWorker() {
    while (getIndex < queue.length && getBudget > 0 && timeLeft() > 0) {
      const item = queue[getIndex++]
      if (!item || pageData.has(item.url)) continue

      try {
        const res = await fetchWithTimeout(
          item.url,
          { headers: BROWSER_HEADERS, redirect: 'follow' },
          FETCH_TIMEOUT_MS
        )
        getBudget--
        const contentType = res.headers.get('content-type') || ''
        const finalUrl = cleanUrl(res.url || item.url, origin) || item.url

        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
          pageData.set(item.url, { statusCode: res.status, redirectLocation: finalUrl !== item.url ? finalUrl : null })
          continue
        }

        const html = await res.text()
        const evidence = extractFromHtml(html, item.url)
        pageData.set(item.url, {
          statusCode: res.status,
          redirectLocation: finalUrl !== item.url ? finalUrl : null,
          ...evidence,
        })
        const depth = minDepthMap.get(item.url) ?? (item.url === homeClean ? 1 : null)
        registerLinks(item.url, evidence.outLinks, depth)
      } catch (err) {
        pageData.set(item.url, {
          statusCode: null,
          error: err?.message?.substring(0, 120) || 'fetch failed',
        })
      }
    }
  }

  const getWorkers = Array.from({ length: MAX_CONCURRENT_FETCHES }, () => getWorker())
  await Promise.all(getWorkers)

  // Sitemap tail: any sitemap URL the BFS didn't reach joins the queue now;
  // phase B status-verifies everything that wasn't GET-fetched.
  const typeRank = (t) => (t === 'post' ? 2 : t === 'general' ? 1 : 0)
  ;[...sitemapUrlsMap.keys()]
    .filter((u) => !queuedSet.has(u))
    .map((u) => ({ u, t: sitemapUrlsMap.get(u)?.sitemapType || 'general' }))
    .sort((a, b) => typeRank(a.t) - typeRank(b.t))
    .forEach(({ u }) => pushUnique(u, 'sitemap'))

  // ── Phase B: HEAD verification for every remaining URL ──
  const headQueue = queue.filter((q) => !pageData.has(q.url)).slice(0, MAX_HEAD_CHECKS)
  let headIndex = 0

  async function headWorker() {
    while (headIndex < headQueue.length && timeLeft() > 0) {
      const item = headQueue[headIndex++]
      if (!item || pageData.has(item.url)) continue
      try {
        const res = await fetchWithTimeout(
          item.url,
          { headers: { ...BROWSER_HEADERS }, redirect: 'follow', method: 'HEAD' },
          HEAD_TIMEOUT_MS
        )
        const finalUrl = cleanUrl(res.url || item.url, origin) || item.url
        pageData.set(item.url, {
          statusCode: res.status,
          redirectLocation: finalUrl !== item.url ? finalUrl : null,
          method: 'HEAD',
        })
      } catch (err) {
        pageData.set(item.url, {
          statusCode: null,
          error: err?.message?.substring(0, 120) || 'fetch failed',
        })
      }
    }
  }

  const headWorkers = Array.from({ length: Math.min(HEAD_CONCURRENCY, headQueue.length || 1) }, () => headWorker())
  await Promise.all(headWorkers)

  // Anything still unverified within budget
  const unchecked = queue.filter((q) => !pageData.has(q.url))

  return {
    targetHost,
    origin,
    homeClean,
    homepageTitle,
    queue,
    sitemapUrlsMap,
    headerNavMap,
    headerNavUrls,
    footerCountsMap,
    navLinkTexts,
    minDepthMap,
    inlinksMap,
    pageData,
    unchecked,
    discoveredSitemapsCount,
    crawlSeconds: Math.round((Date.now() - startedAt) / 1000),
  }
}

// ─── Inventory builder: exact 10 reference columns, evidence-only ──

function buildInventory(crawl) {
  const {
    origin, homeClean, targetHost, sitemapUrlsMap, headerNavMap, headerNavUrls,
    footerCountsMap, minDepthMap, inlinksMap, pageData, navLinkTexts = [],
  } = crawl

  // Crawl coverage — orphan conclusions are only honest relative to how much we actually fetched
  let getFetchedCount = 0
  pageData.forEach((d) => {
    if (d.statusCode !== null && d.statusCode !== undefined && d.h1Count !== undefined) getFetchedCount++
  })

  // Count children per first segment (hub detection)
  const childrenPerSegment = new Map()
  for (const url of new Set([homeClean, ...headerNavUrls, ...sitemapUrlsMap.keys(), ...pageData.keys()])) {
    try {
      const pathname = new URL(url).pathname
      if (pathDepth(pathname) >= 2) {
        const seg = pathname.split('/').filter(Boolean)[0].toLowerCase()
        childrenPerSegment.set(seg, (childrenPerSegment.get(seg) || 0) + 1)
      }
    } catch {}
  }

  const allUrls = new Set([homeClean, ...headerNavUrls, ...sitemapUrlsMap.keys(), ...pageData.keys()])

  // Root-level integration pages: evidence for consolidating them under a new /integrations/{topic}/ tree
  const integrationRootPaths = Array.from(allUrls).filter((u) => {
    try {
      const p = new URL(u).pathname
      return pathDepth(p) === 1 && /integration/.test(p.toLowerCase())
    } catch {
      return false
    }
  })
  const hasIntegrationsHub = Array.from(allUrls).some((u) => {
    try {
      return new URL(u).pathname.toLowerCase() === '/integrations/'
    } catch {
      return false
    }
  })
  const integrationSlugs = integrationRootPaths.map((u) => slugOf(new URL(u).pathname).split('-').filter(Boolean))
  const firstPosFreq = new Map()
  integrationSlugs.forEach((segs) => {
    if (segs[0]) firstPosFreq.set(segs[0], (firstPosFreq.get(segs[0]) || 0) + 1)
  })
  // Tokens that prefix 2+ root integration slugs are brand/product-line prefixes, not topics
  const sharedPrefixTokens = new Set(
    [...firstPosFreq.entries()].filter(([, c]) => c >= 2).map(([t]) => t)
  )
  const isBadTopic = (t) =>
    !t ||
    t.length < 3 ||
    sharedPrefixTokens.has(t) ||
    /^(and|with|for|the|api|using|your|system|software|platform|guide|best|top)$/.test(t)
  const integrationTargetFor = (pathname) => {
    const segs = slugOf(pathname).split('-').filter(Boolean)
    const iSeg = segs.indexOf('integration')
    const before = iSeg > 0 ? segs[iSeg - 1] : null
    const topic =
      !isBadTopic(before)
        ? before
        : segs.slice(0, iSeg > 0 ? iSeg : segs.length).find((t) => !isBadTopic(t))
    if (!topic) return null
    return `${origin}/integrations/${topic}/`
  }

  const items = Array.from(allUrls).map((url) => {
    const pathname = new URL(url).pathname
    const data = pageData.get(url) || {}
    const sitemapMeta = sitemapUrlsMap.get(url)
    const headerEntry = headerNavMap.get(url)
    const footerCount = footerCountsMap.get(url) || 0
    // Click depth only where the link graph proves it; null = unknown (never assumed)
    const depth = minDepthMap.get(url) ?? (headerNavUrls.has(url) ? 2 : null)
    const section = deriveSection(pathname, sitemapMeta?.sitemapType || null)
    const contentType = deriveContentType(pathname, sitemapMeta?.sitemapType || null, section, childrenPerSegment.get(pathname.split('/').filter(Boolean)[0]?.toLowerCase() || ''))
    const slug = slugOf(pathname)
    const statusCode = data.statusCode ?? null
    const verified = statusCode !== null
    const inlinksCount = inlinksMap.get(url)?.size || 0

    // Column 4: Sitemap
    const sitemap = sitemapMeta ? sitemapMeta.sitemapType : 'MISSING'

    // Column 5: In Header Nav
    let inHeaderNav = 'No'
    if (url === homeClean) inHeaderNav = 'Logo'
    else if (headerEntry) inHeaderNav = headerEntry.hasAnchor ? 'Yes (anchors)' : 'Yes'

    // Column 6: In Footer
    let inFooter = 'No'
    if (url === homeClean) inFooter = 'Logo'
    else if (footerCount === 1) inFooter = 'Yes'
    else if (footerCount > 1) inFooter = `Yes (x${footerCount})`

    // Columns 7-10: Issue / Action / Target / Priority — evidence rules, most severe first
    let issue = ''
    let recommendedAction = 'Keep'
    let targetUrl = ''
    let priority = 'Low'
    const isRoot = pathname === '/' || pathname === ''
    // Conversion-intent nav CTA texts pointing at this exact page (real homepage anchor text)
    const ctaTexts = [
      ...new Set(
        navLinkTexts
          .filter((l) => l.url === url && /compare|demo|pricing|quote|trial|get started|all features/i.test(l.text))
          .map((l) => l.text.trim())
          .filter(Boolean)
      ),
    ]

    const integrationTarget =
      integrationRootPaths.length >= 3 &&
      !hasIntegrationsHub &&
      pathDepth(pathname) === 1 &&
      /integration/.test(pathname.toLowerCase()) &&
      contentType !== 'Blog post' &&
      !isArticleSlug(pathname)
        ? integrationTargetFor(pathname)
        : null

    if (isRoot) {
      // homepage never flagged
    } else if (statusCode === 404 || statusCode === 410 || statusCode === 500 || statusCode === 503) {
      issue = `Page returns HTTP ${statusCode} (verified live)`
      recommendedAction = 'Fix, remove, or 301 to closest equivalent'
      priority = 'High'
    } else if (data.redirectLocation && data.redirectLocation !== url) {
      issue = `Redirects to ${data.redirectLocation}`
      recommendedAction = 'Update sitemap & internal links to final URL'
      targetUrl = data.redirectLocation
      priority = 'Medium'
    } else if (/^(sample-page|hello-world)\/?$/i.test(pathname.replace(/^\//, ''))) {
      issue = 'WordPress default sample page is live'
      recommendedAction = 'Delete + 410 (or 301 to home)'
      targetUrl = `${origin}/`
      priority = 'High'
    } else if (sitemap === 'MISSING' && (inHeaderNav !== 'No' || inFooter !== 'No')) {
      issue = 'Live & linked but missing from XML sitemap'
      recommendedAction = 'Add to sitemap'
      priority = 'High'
    } else if (integrationTarget) {
      issue = `Scattered integration page at root level (${integrationRootPaths.length} found); belongs under ${integrationTarget} — build that page first`
      recommendedAction = `Merge + 301 to ${integrationTarget}`
      targetUrl = integrationTarget
      priority = 'Medium'
    } else if (
      sitemap !== 'MISSING' &&
      inlinksCount === 0 &&
      inHeaderNav === 'No' &&
      inFooter === 'No' &&
      contentType !== 'Blog post'
    ) {
      // Orphan claim scale: confident only when we fetched most of the known site
      const coverage = allUrls.size > 0 ? getFetchedCount / allUrls.size : 0
      if (coverage >= 0.85) {
        issue = 'Orphan: in sitemap but no internal links found'
        recommendedAction = 'Add internal links or remove page'
        priority = 'High'
      } else {
        issue = `No internal links found in partial crawl (${getFetchedCount} of ${allUrls.size} known pages fetched) — possible orphan`
        recommendedAction = 'Verify with a full crawl; if orphan, link from parent hub'
        priority = 'Medium'
      }
    } else if (inFooter !== 'No' && inHeaderNav === 'No' && contentType !== 'Blog post') {
      issue = `Footer only (in footer ${footerCount}×, not in header nav)`
      recommendedAction = 'Keep; link from parent hub or header'
      priority = 'Medium'
    } else if (contentType !== 'Blog post' && depth !== null && depth >= 4) {
      issue = `Deep: ${depth} clicks from homepage`
      recommendedAction = 'Keep; link from parent hub to reduce depth'
      priority = 'Medium'
    } else if (
      contentType !== 'Blog post' &&
      ctaTexts.length >= 2 &&
      !/\/(demo|pricing|compare|quote|plans)(\/|$)/.test(pathname)
    ) {
      issue = `Serves ${ctaTexts.length} nav CTAs (${ctaTexts.slice(0, 3).map((t) => `"${t}"`).join(', ')}) with no dedicated target page`
      recommendedAction = 'Keep; create dedicated CTA pages'
      priority = 'Medium'
    } else if (contentType === 'Job') {
      issue = 'Verify whether role is still open'
      recommendedAction = 'Keep if open; 410 + drop from sitemap when closed'
      priority = 'Low'
    }

    return {
      url,
      pathname,
      section,
      contentType,
      sitemap,
      inHeaderNav,
      inFooter,
      issue,
      recommendedAction,
      targetUrl,
      priority,
      // Supporting fields (all real)
      title: data.title || '',
      h1: data.h1 || '',
      h1Count: data.h1Count ?? null,
      metaDescription: data.metaDescription || '',
      wordCount: data.wordCount ?? null,
      depth,
      statusCode,
      verified,
      inlinksCount,
      slug,
      integrationTarget,
    }
  })

  // Duplicate title / H1 detection across verified pages (real evidence)
  const normalizeTitle = (t) =>
    (t || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\s*[|–\-—]\s*[^|–\-—]+$/, '') // strip trailing "| Site" segment
      .trim()

  const titleGroups = new Map()
  const h1Groups = new Map()
  items.forEach((item) => {
    if (!item.title) return
    const key = normalizeTitle(item.title)
    if (key.length > 8) {
      if (!titleGroups.has(key)) titleGroups.set(key, [])
      titleGroups.get(key).push(item)
    }
    if (item.h1) {
      const hk = item.h1.toLowerCase().replace(/\s+/g, ' ').trim()
      if (hk.length > 8) {
        if (!h1Groups.has(hk)) h1Groups.set(hk, [])
        h1Groups.get(hk).push(item)
      }
    }
  })

  items.forEach((item) => {
    if (item.issue) return // one clear issue per row
    const tKey = normalizeTitle(item.title)
    const tGroup = tKey ? titleGroups.get(tKey) : null
    if (tGroup && tGroup.length > 1 && item.verified) {
      const others = tGroup.filter((o) => o.url !== item.url).map((o) => o.url)
      if (others.length) {
        item.issue = `Duplicate page title with ${others[0]}${others.length > 1 ? ` (+${others.length - 1} more)` : ''}`
        item.recommendedAction = 'Review for duplicate content; merge + 301 if redundant'
        item.targetUrl = item.url < others[0] ? '' : others[0] // deterministic: later URL points to first
        if (item.url < others[0]) {
          item.targetUrl = ''
          item.recommendedAction = 'Keep (canonical by URL order); review duplicates'
        } else {
          item.recommendedAction = 'Merge + 301'
          item.targetUrl = others[0]
        }
        item.priority = 'Medium'
        return
      }
    }
    const hGroup = item.h1 ? h1Groups.get(item.h1.toLowerCase().replace(/\s+/g, ' ').trim()) : null
    if (hGroup && hGroup.length > 1 && item.verified) {
      const others = hGroup.filter((o) => o.url !== item.url)
      if (others.length) {
        item.issue = `Duplicate H1 "${item.h1}" shared with ${others.length} page(s)`
        item.recommendedAction = 'Differentiate H1s; merge pages if topics overlap'
        item.priority = 'Low'
      }
    }
  })

  // Broken pages: attach a real live target when one can be evidenced — exact match after
  // URL normalization (%20/spaces/case), else closest same-type page by slug-token overlap.
  const livePages = items.filter((it) => it.statusCode !== null && it.statusCode < 400)
  const normalizePath = (p) => {
    let d = p
    try {
      d = decodeURIComponent(p)
    } catch {}
    return d
      .split('/')
      .map((s) => s.trim().replace(/\s+/g, '-'))
      .filter(Boolean)
      .join('/')
      .toLowerCase()
  }
  items.forEach((it) => {
    if (it.statusCode === null || it.statusCode < 400 || it.targetUrl) return
    const n = normalizePath(it.pathname)
    const exact = livePages.find((o) => o.pathname !== it.pathname && normalizePath(o.pathname) === n)
    if (exact) {
      it.targetUrl = exact.url
      it.recommendedAction = '301 to live equivalent (URL-encoding/spelling variant)'
      return
    }
    const ta = it.pathname.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1)
    let best = null
    let bestScore = 0
    livePages.forEach((o) => {
      if (o.contentType !== it.contentType) return
      const tb = o.pathname.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1)
      if (ta.length < 2 || tb.length < 2) return
      const shared = ta.filter((t) => tb.includes(t))
      const score = shared.length / Math.min(ta.length, tb.length)
      if (score >= 0.5 && shared.length >= 2 && score > bestScore) {
        bestScore = score
        best = o
      }
    })
    if (best) {
      it.targetUrl = best.url
      it.recommendedAction = `301 to closest live equivalent (${Math.round(bestScore * 100)}% slug match)`
    }
  })

  // Near-duplicate URL slugs: heavy token overlap between issue-free pages → real merge evidence.
  // Canonical target must be issue-free and never already a redirect target (no chains), and the
  // keeper is chosen deterministically: nav presence > inlinks > shallower > shorter path.
  const slugStop = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'for', 'from', 'how', 'in', 'is', 'it',
    'my', 'no', 'not', 'of', 'on', 'or', 'our', 'page', 'pages', 'new', 'best', 'top', 'free', 'all',
    'any', 'the', 'this', 'that', 'to', 'vs', 'we', 'what', 'when', 'who', 'why', 'will', 'with', 'your',
    'www', 'com', 'html', 'php', 'index', 'home', 'main', 'official',
    ...targetHost.split(/[.-]/).filter((t) => t.length > 2),
  ])
  const slugTokensOf = new Map()
  items.forEach((it) => {
    if (it.pathname === '/') return
    slugTokensOf.set(
      it,
      it.pathname
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 1 && !slugStop.has(t))
    )
  })
  const canonicalTargets = new Set(items.map((it) => it.targetUrl).filter(Boolean))
  const dupCandidates = [...slugTokensOf.keys()]
  const keeperScore = (it) =>
    (it.inHeaderNav !== 'No' || it.inFooter !== 'No' ? 1000 : 0) +
    it.inlinksCount * 10 -
    (it.depth ?? 9) * 3 -
    it.pathname.length / 50

  for (let i = 0; i < dupCandidates.length; i++) {
    const a = dupCandidates[i]
    if (a.issue || canonicalTargets.has(a.url)) continue
    const ta = slugTokensOf.get(a)
    if (ta.length < 2) continue
    for (let j = 0; j < dupCandidates.length; j++) {
      if (i === j) continue
      const b = dupCandidates[j]
      if (b.issue) continue
      if (a.contentType !== b.contentType || a.contentType === 'Blog post') continue // articles are distinct writing; duplicates are only same-type non-post pages
      if (a.pathname.startsWith(b.pathname) || b.pathname.startsWith(a.pathname)) continue // parent/child, not duplicates
      const tb = slugTokensOf.get(b)
      if (tb.length < 2) continue
      const shared = ta.filter((t) => tb.includes(t))
      if (shared.length < 2) continue
      if (shared.length / Math.min(ta.length, tb.length) < 0.6) continue
      const sb = keeperScore(b)
      const sa = keeperScore(a)
      if (sb < sa || (sb === sa && b.url.localeCompare(a.url) > 0)) continue
      a.issue = `Near-duplicate of ${b.url} (${shared.length} of ${Math.min(ta.length, tb.length)} slug tokens match)`
      a.recommendedAction = 'Merge + 301'
      a.targetUrl = b.url
      a.priority = b.inHeaderNav !== 'No' ? 'High' : 'Medium'
      canonicalTargets.add(b.url)
      break
    }
  }

  // Sort by section order, then depth, then URL
  items.sort((a, b) => {
    const oa = sectionRank(a.section)
    const ob = sectionRank(b.section)
    if (oa !== ob) return oa - ob
    if ((a.depth ?? 99) !== (b.depth ?? 99)) return (a.depth ?? 99) - (b.depth ?? 99)
    return a.url.localeCompare(b.url)
  })

  // Exact 10-column shape for consumers
  return items.map((item) => ({
    // 10 reference columns
    url: item.url,
    section: item.section,
    contentType: item.contentType,
    sitemap: item.sitemap,
    inHeaderNav: item.inHeaderNav,
    inFooter: item.inFooter,
    issue: item.issue,
    recommendedAction: item.recommendedAction,
    targetUrl: item.targetUrl,
    priority: item.priority,
    // Real supporting evidence
    path: item.pathname,
    title: item.title || titleFromSlug(item.pathname),
    h1: item.h1,
    h1Count: item.h1Count,
    metaDescription: item.metaDescription,
    wordCount: item.wordCount,
    depth: item.depth,
    statusCode: item.statusCode,
    verified: item.verified,
    inlinks: item.inlinksCount,
    slug: item.slug,
    integrationTarget: item.integrationTarget,
    action: item.recommendedAction,
  }))
}

// ─── Redirect Map: only real, actionable redirect pairs ────────

function buildRedirectMap(inventory) {
  const redirects = []
  const liveUrls = new Set(inventory.map((i) => i.url))
  inventory.forEach((item) => {
    if (item.path === '/') return
    const isRedirectish = /301|merge|delete|410|remove/i.test(item.recommendedAction || '')
    const isLinkFix = /Update sitemap & internal links/i.test(item.recommendedAction || '')
    if (!isRedirectish && !isLinkFix) return
    if (!item.targetUrl) return // no evidenced target → not a verifiable 301

    redirects.push({
      sourceUrl: item.url,
      targetUrl: item.targetUrl,
      redirectType: '301 Permanent',
      reason: item.issue || 'Consolidate duplicate or low-value page',
      priority: item.priority || 'Medium',
      status: liveUrls.has(item.targetUrl) ? 'Ready' : 'Planned — build target first',
    })
  })

  const rank = { High: 0, Medium: 1, Low: 2 }
  redirects.sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3) || a.sourceUrl.localeCompare(b.sourceUrl))
  return redirects
}

// ─── Pages to Create: evidence-based architectural gaps ────────

function buildPagesToCreate(inventory, navLinkTexts, targetHost, origin) {
  const pages = []
  const paths = new Set(inventory.map((i) => i.path.toLowerCase()))
  const originNoWww = origin
  const proposed = (slug) => `${originNoWww}${slug}`

  const push = (section, pageName, url, why) => {
    if (paths.has(url.replace(originNoWww, '').toLowerCase().replace(/\/$/, '/'))) return
    if (pages.some((p) => p.proposedUrl === url)) return
    pages.push({ section, pageName, proposedUrl: url, why, owner: '', status: 'Not started' })
  }

  // 1. Missing section hubs (≥ 4 pages in a section with no hub page)
  const sectionCounts = new Map()
  inventory.forEach((i) => {
    if (i.contentType === 'Blog post' || i.section === 'Core' || i.section === 'Other') return
    sectionCounts.set(i.section, (sectionCounts.get(i.section) || 0) + 1)
  })
  sectionCounts.forEach((count, section) => {
    const hubSlug = SECTION_HUB_SLUGS[section] || section.toLowerCase().replace(/\s+/g, '-')
    if (count < 4) return
    const hubPath = `/${hubSlug}/`
    const hasHub = inventory.some(
      (i) => i.path === hubPath || (i.contentType === 'Hub' && i.section === section)
    )
    if (!hasHub) {
      push(section, `${section} Hub`, proposed(hubPath), `${count} ${section.toLowerCase()} pages currently have no central hub page`)
    }
  })

  // 2. Navigation CTAs that point to wrong/generic targets (real anchor-text evidence)
  const ctaRules = [
    { match: /compare|comparison/, propose: '/compare/', name: 'Compare Products', section: 'Products' },
    { match: /book a demo|request a demo|schedule a demo|demo/, propose: '/demo/', name: 'Book a Demo', section: 'Conversion' },
    { match: /all features|explore features|features overview/, propose: '/features/', name: 'All Features Hub', section: 'Features' },
    { match: /pricing|plans/, propose: '/pricing/', name: 'Pricing & Plans', section: 'Conversion' },
  ]
  ctaRules.forEach(({ match, propose, name, section }) => {
    if (paths.has(propose)) return
    const navHit = navLinkTexts.find((l) => match.test(l.text) && !l.rawHref.includes('#'))
    if (!navHit) return
    const targetIsGeneric = /contact|home|\/$/.test(navHit.url) && !navHit.url.endsWith(propose)
    if (targetIsGeneric) {
      push(section, name, proposed(propose), `Header/footer CTA "${navHit.text}" currently links to ${navHit.url} instead of a dedicated page`)
    }
  })

  // 3. Scattered integration pages with no hub
  const integrationPages = inventory.filter((i) => i.slug.includes('integration') && pathDepth(i.path) === 1)
  if (integrationPages.length >= 3 && !paths.has('/integrations/')) {
    push('Integrations', 'Integrations Hub', proposed('/integrations/'), `${integrationPages.length} integration pages sit at root level with no central directory`)
  }

  // 4. Blog posts with no category structure
  const blogPosts = inventory.filter((i) => i.contentType === 'Blog post')
  const hasCategoryStructure = inventory.some(
    (i) => i.contentType === 'Blog post' && pathDepth(i.path) >= 2 && !/^(blog|news|insights)$/.test(i.path.split('/').filter(Boolean)[0] || '')
  )
  if (blogPosts.length >= 20 && !hasCategoryStructure && !paths.has('/blog/categories/')) {
    push('Resources', 'Blog Category Hubs', proposed('/blog/categories/'), `${blogPosts.length} blog posts have no category or topic structure`)
  }

  // Stoplist shared by the gap rules below: only letters-only tokens that aren't broad
  // English words, web-UI boilerplate, third-party mentions or the audited domain survive.
  const domainTokens = targetHost.split(/[.-]/).filter((t) => t.length > 2)
  const gapStop = new Set([
    'able', 'about', 'above', 'according', 'actually', 'after', 'again', 'against', 'almost', 'along',
    'already', 'also', 'although', 'always', 'among', 'another', 'anyone', 'anything', 'around', 'back',
    'became', 'because', 'been', 'before', 'began', 'being', 'believe', 'below', 'best', 'better',
    'between', 'both', 'business', 'came', 'can', 'change', 'contact', 'complete', 'could', 'did',
    'different', 'does', 'doing', 'done', 'down', 'during', 'each', 'either', 'else', 'enough', 'even',
    'every', 'examples', 'far', 'few', 'find', 'first', 'for', 'from', 'further', 'get', 'give', 'given',
    'go', 'gone', 'good', 'got', 'had', 'has', 'have', 'having', 'here', 'himself', 'how', 'however',
    'into', 'just', 'keep', 'knew', 'know', 'known', 'last', 'later', 'least', 'less', 'let', 'like',
    'made', 'make', 'making', 'many', 'may', 'might', 'more', 'most', 'much', 'must', 'need', 'never',
    'next', 'number', 'off', 'often', 'old', 'once', 'only', 'other', 'others', 'our', 'out', 'over',
    'own', 'part', 'people', 'perhaps', 'place', 'product', 'put', 'quite', 'rather', 'really', 'said',
    'same', 'say', 'saying', 'see', 'seen', 'several', 'shall', 'should', 'show', 'since', 'small',
    'some', 'someone', 'something', 'still', 'such', 'take', 'taken', 'than', 'their', 'them', 'then',
    'there', 'these', 'they', 'thing', 'think', 'this', 'those', 'though', 'through', 'together', 'too',
    'took', 'towards', 'under', 'until', 'up', 'upon', 'use', 'used', 'using', 'very', 'want', 'wanted',
    'was', 'way', 'well', 'went', 'were', 'where', 'whether', 'which', 'while', 'whom', 'whose', 'will',
    'with', 'within', 'without', 'would', 'yet', 'your', 'yourself',
    // web-UI boilerplate / third-party mentions / never site topics
    'about', 'author', 'authors', 'blog', 'career', 'careers', 'capterra', 'categories', 'category',
    'clutch', 'facebook', 'free', 'g2', 'getapp', 'goodfirms', 'home', 'index', 'jobs', 'linkedin',
    'login', 'news', 'page', 'pages', 'privacy', 'register', 'search', 'signup', 'sitemap', 'softwareadvice',
    'tags', 'terms', 'thank', 'thanks', 'trustradius', 'twitter', 'youtube', 'html', 'php', 'www', 'com',
    // observed junk candidates: wh-words, comparatives, verb forms, weak "topics"
    'what', 'when', 'where', 'which', 'why', 'larger', 'becomes', 'become', 'improve', 'improved',
    'improving', 'trends', 'trend', 'clientele', 'msps', 'real',
    // never the audited brand or its possessive
    ...domainTokens,
    ...domainTokens.map((t) => `${t}s`),
  ])
  // 5. Planned integration-tree pages (mirror of the 301 targets: build these, then redirect)
  inventory
    .filter((i) => i.integrationTarget)
    .forEach((i) => {
      const topic = (i.integrationTarget.split('/').filter(Boolean)[1] || '').replace(/-/g, ' ')
      push(
        'Integrations',
        `${topic.charAt(0).toUpperCase()}${topic.slice(1)} integration`,
        i.integrationTarget,
        `Consolidates ${i.path} into the planned integration tree (this is that page's 301 target)`
      )
    })

  // 6. Nav links that only jump to an on-page anchor — no dedicated page backs them
  const anchorOnly = new Map()
  navLinkTexts.forEach((l) => {
    const h = (l.rawHref || '').replace(origin, '')
    if (/^\/?#/.test(h) && h.length > 1) {
      const key = (l.text || '').trim().toLowerCase()
      if (key && !anchorOnly.has(key)) anchorOnly.set(key, h)
    }
  })
  let anchorAdded = 0
  for (const [text, href] of anchorOnly) {
    if (anchorAdded >= 6) break
    const s = text.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    if (!s || paths.has(`/${s}/`)) continue
    const before = pages.length
    push('Navigation', `${text.charAt(0).toUpperCase()}${text.slice(1)} section`, proposed(`/${s}/`), `Nav link "${text}" only jumps to ${href} — no dedicated page backs it`)
    if (pages.length > before) anchorAdded++
  }

  // 7. Root-level sibling groups sharing a topic slug with no hub
  const rootGroups = new Map()
  inventory.forEach((i) => {
    if (i.contentType === 'Blog post' || pathDepth(i.path) !== 1 || i.path === '/') return
    const segs = i.path.split('/').filter(Boolean)[0].toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
    const key = segs[0]
    if (!/^[a-z]{4,}$/.test(key) || gapStop.has(key)) return
    if (!rootGroups.has(key)) rootGroups.set(key, [])
    rootGroups.get(key).push(i)
  })
  let groupAdded = 0
  for (const [key, members] of rootGroups) {
    if (groupAdded >= 4) break
    if (members.length < 4) continue
    const hubPath = `/${key}/`
    if (paths.has(hubPath) || pages.some((p) => p.proposedUrl === proposed(hubPath))) continue
    const before = pages.length
    push('Content Gaps', `${key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} hub`, proposed(hubPath), `${members.length} root-level pages share the "${key}" topic slug with no central hub`)
    if (pages.length > before) groupAdded++
  }

  return pages
}

// ─── Recommended Structure: target IA from real pages + gaps ───

function buildRecommendedStructure(inventory, pagesToCreate, redirectMap, origin) {
  const rows = []
  const absorbsByTarget = new Map()
  redirectMap.forEach((r) => {
    if (!r.targetUrl) return
    if (!absorbsByTarget.has(r.targetUrl)) absorbsByTarget.set(r.targetUrl, [])
    absorbsByTarget.get(r.targetUrl).push(r.sourceUrl)
  })

  const hubPathBySection = {}
  Object.entries(SECTION_HUB_SLUGS).forEach(([section, slug]) => (hubPathBySection[section] = `/${slug}/`))

  // Home
  rows.push({
    level: '0.0',
    section: 'Home',
    page: 'Home',
    recommendedUrl: `${origin}/`,
    currentUrl: '',
    status: 'Keep',
    notes: '',
  })

  const activeSections = [...new Set(inventory.map((i) => i.section))]
    .filter((s) => s && s !== 'Core' && s !== 'Other')
    .sort((a, b) => sectionRank(a) - sectionRank(b) || a.localeCompare(b))

  activeSections.forEach((section) => {
    const inSection = inventory.filter((i) => i.section === section)
    const nonPosts = inSection.filter((i) => i.contentType !== 'Blog post')
    if (nonPosts.length === 0) return

    const hubPath = hubPathBySection[section] || `/${section.toLowerCase().replace(/\s+/g, '-')}/`
    let hub = nonPosts.find((i) => i.path === hubPath)
    if (!hub) hub = nonPosts.find((i) => i.contentType === 'Hub')
    if (!hub && nonPosts.length >= 4) {
      // Proposed new hub (covered by pagesToCreate; still show structure row)
      rows.push({
        level: '1.0',
        section,
        page: `${section} Hub`,
        recommendedUrl: `${origin}${hubPath}`,
        currentUrl: '',
        status: 'New',
        notes: `${nonPosts.length} ${section.toLowerCase()} pages currently have no central hub`,
      })
    } else if (hub) {
      const absorbed = absorbsByTarget.get(hub.url) || []
      rows.push({
        level: '1.0',
        section,
        page: hub.title || titleFromSlug(hub.path),
        recommendedUrl: hub.url,
        currentUrl: hub.url,
        status: /merge|301|rebuild/i.test(hub.recommendedAction) ? 'Rebuild' : 'Keep',
        notes: absorbed.length ? `Absorbs ${absorbed.join(', ')}` : '',
      })
    }

    // Child pages (excluding individual blog posts — hub aggregates them)
    nonPosts
      .filter((i) => i !== hub)
      .forEach((child) => {
        const absorbed = absorbsByTarget.get(child.url) || []
        const isRemoved = /merge|301|delete|410|remove/i.test(child.recommendedAction) && child.targetUrl
        if (isRemoved && !absorbed.length) return // page disappears in target structure
        rows.push({
          level: child.depth == null ? '2.0' : child.depth <= 2 ? '1.0' : child.depth === 3 ? '2.0' : '3.0',
          section,
          page: child.title || titleFromSlug(child.path),
          recommendedUrl: child.url,
          currentUrl: child.url,
          status: isRemoved ? 'Rebuild' : 'Keep',
          notes: absorbed.length ? `Absorbs ${absorbed.join(', ')}` : child.issue || '',
        })
      })
  })

  // New pages to create
  pagesToCreate.forEach((p) => {
    rows.push({
      level: p.pageName.toLowerCase().includes('hub') ? '1.0' : '2.0',
      section: p.section,
      page: p.pageName,
      recommendedUrl: p.proposedUrl,
      currentUrl: '',
      status: 'New',
      notes: p.why,
    })
  })

  return rows
}

// ─── Score: computed from real issue rates only ────────────────

function computeScore(inventory, redirectMap) {
  const total = inventory.length || 1
  const pct = (n) => n / total

  const broken = inventory.filter((i) => i.statusCode !== null && i.statusCode >= 400).length
  const orphans = inventory.filter((i) => i.issue?.startsWith('Orphan')).length
  const missingSitemap = inventory.filter((i) => i.sitemap === 'MISSING' && i.issue).length
  const deep = inventory.filter((i) => typeof i.depth === 'number' && i.depth >= 4).length
  const duplicates = inventory.filter(
    (i) => i.issue?.startsWith('Duplicate page title') || i.issue?.startsWith('Near-duplicate')
  ).length
  const thin = inventory.filter((i) => i.wordCount !== null && i.wordCount > 0 && i.wordCount < 100).length

  const penalty =
    30 * pct(broken) +
    18 * pct(orphans) +
    12 * pct(missingSitemap) +
    8 * pct(deep) +
    12 * pct(duplicates) +
    6 * pct(thin) +
    Math.min(10, redirectMap.length * 0.2)

  const score = Math.max(5, Math.min(100, Math.round(100 - penalty)))
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
  return { score, grade }
}

// ─── Main entry point ──────────────────────────────────────────

export async function performWebsiteStructureAudit({ websiteUrl, focusNiche }) {
  const crawl = await crawlWebsite(websiteUrl)
  const {
    targetHost, origin, homeClean, homepageTitle, sitemapUrlsMap, headerNavUrls,
    footerCountsMap, navLinkTexts, pageData, unchecked, discoveredSitemapsCount, crawlSeconds,
  } = crawl

  const inventory = buildInventory(crawl)
  if (inventory.length === 0) {
    throw new Error(`Unable to crawl or access ${websiteUrl}. Please verify the domain is online and accessible.`)
  }

  const redirectMap = buildRedirectMap(inventory)
  const pagesToCreate = buildPagesToCreate(inventory, navLinkTexts, targetHost, origin)
  const recommendedStructure = buildRecommendedStructure(inventory, pagesToCreate, redirectMap, origin)

  const totalPages = inventory.length
  const depths = inventory.map((i) => i.depth).filter((d) => typeof d === 'number') // link-graph-proven only
  const depthKnownCount = depths.length
  const maxDepth = depths.length ? Math.max(...depths, 1) : 0
  const avgDepth = depths.length ? (depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(1) : '0.0'
  const { score: overallScore, grade: architectureGrade } = computeScore(inventory, redirectMap)

  // Summary block — every count derived from the live inventory
  const blogPostsCount = inventory.filter((p) => p.contentType === 'Blog post').length
  const featurePagesCount = inventory.filter((p) => p.section === 'Features' || p.contentType === 'Feature').length
  const industryPagesCount = inventory.filter((p) => p.section === 'Industries' || p.contentType === 'Industry').length
  const countryPagesCount = inventory.filter((p) => p.section === 'Locations' || p.contentType === 'Location').length
  const productPagesCount = inventory.filter((p) => p.section === 'Products' || p.contentType === 'Product').length

  const missingFromSitemapCount = inventory.filter((p) => p.sitemap === 'MISSING' && (p.inHeaderNav !== 'No' || p.inFooter !== 'No')).length
  const notInHeaderNavCount = inventory.filter((p) => p.inHeaderNav === 'No' && p.contentType !== 'Blog post').length
  const flaggedWithIssueCount = inventory.filter((p) => p.issue && p.issue.trim() !== '').length
  const highPriorityCount = inventory.filter((p) => p.priority === 'High').length
  const mediumPriorityCount = inventory.filter((p) => p.priority === 'Medium').length
  const urlsToRedirectCount = redirectMap.length

  const keptAsIsCount = recommendedStructure.filter((r) => r.status === 'Keep').length
  const renamedMovedRebuiltCount = recommendedStructure.filter((r) => r.status === 'Rebuild').length
  const newPagesToCreateCount = pagesToCreate.length

  const verifiedCount = inventory.filter((i) => i.verified).length
  const brokenCount = inventory.filter((i) => i.statusCode !== null && i.statusCode >= 400).length
  const orphanCount = inventory.filter((i) => i.issue?.startsWith('Orphan')).length
  const duplicateTitleCount = inventory.filter((i) => i.issue?.startsWith('Duplicate page title')).length
  const nearDuplicateCount = inventory.filter((i) => i.issue?.startsWith('Near-duplicate')).length
  // On-page signals stay evidence-based even though they're not structural Issue rows:
  const thinCount = inventory.filter((i) => i.wordCount !== null && i.wordCount > 0 && i.wordCount < 100).length
  const missingMetaCount = inventory.filter((i) => i.verified && i.h1Count !== null && !i.metaDescription).length

  // Dynamic category rows: canonical sheet labels only when this site actually has that concept,
  // then filled with the site's own largest sections — identical logic for every crawled site.
  const canonicalCategories = [
    { label: 'Feature pages', count: featurePagesCount },
    { label: 'Industry pages', count: industryPagesCount },
    { label: 'Country pages', count: countryPagesCount },
    { label: 'Product pages', count: productPagesCount },
  ].filter((c) => c.count > 0)
  const canonicalSectionNames = new Set([
    'feature', 'features', 'industry', 'industries', 'country', 'countries',
    'location', 'locations', 'product', 'products',
  ])
  const sectionTally = new Map()
  inventory.forEach((i) => {
    if (i.section === 'Core' || i.section === 'Other') return
    const t = sectionTally.get(i.section) || { count: 0, posts: 0 }
    t.count++
    if (i.contentType === 'Blog post') t.posts++
    sectionTally.set(i.section, t)
  })
  const categoryCounts = [...canonicalCategories]
  ;[...sectionTally.entries()]
    .filter(([name, t]) => t.posts / t.count < 0.7 && !canonicalSectionNames.has(name.toLowerCase()))
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([name, t]) => {
      if (categoryCounts.length >= 4) return
      const label = `${name} pages`
      if (categoryCounts.some((c) => c.label === label)) return
      categoryCounts.push({ label, count: t.count })
    })

  const now = new Date()
  const crawlDate = `${now.getDate()} ${now.toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()}`

  const summary = {
    title: `${targetHost.charAt(0).toUpperCase() + targetHost.slice(1)} – Website Structure Audit`,
    sourceDescription: `Source: ${targetHost} homepage navigation + ${discoveredSitemapsCount} XML sitemap file(s); ${verifiedCount} of ${totalPages} URLs verified live (${crawlSeconds}s crawl on ${crawlDate}).`,
    currentInventory: {
      totalUrls: totalPages,
      blogPosts: blogPostsCount,
      categoryCounts, // display-ready rows: canonical labels first, then this site's own sections
      featurePages: featurePagesCount,
      industryPages: industryPagesCount,
      countryPages: countryPagesCount,
      productPages: productPagesCount,
    },
    issues: {
      missingFromSitemap: missingFromSitemapCount,
      notInHeaderNav: notInHeaderNavCount,
      flaggedWithIssue: flaggedWithIssueCount,
      highPriority: highPriorityCount,
      mediumPriority: mediumPriorityCount,
      urlsToRedirect: urlsToRedirectCount,
    },
    recommendedStructure: {
      pagesInRecommended: recommendedStructure.length,
      keptAsIs: keptAsIsCount,
      renamedMovedRebuilt: renamedMovedRebuiltCount,
      newPagesToCreate: newPagesToCreateCount,
    },
    dataQuality: {
      verifiedUrls: verifiedCount,
      unverifiedUrls: totalPages - verifiedCount,
      checkedViaHead: inventory.filter((i) => i.verified && i.statusCode !== null && i.h1Count === null).length,
      brokenPages: brokenCount,
      orphanPages: orphanCount,
      duplicateTitlePages: duplicateTitleCount,
      nearDuplicatePages: nearDuplicateCount,
      thinContentPages: thinCount,
      missingMetaDescriptions: missingMetaCount,
      pagesWithRealWordCounts: inventory.filter((i) => i.wordCount !== null).length,
      pagesWithKnownClickDepth: depthKnownCount,
    },
    howToUse: [
      { title: 'Current Inventory', description: 'every URL found, filterable by section, issue, and priority.' },
      { title: 'Redirect Map', description: 'hand this to your developer to set up 301s (canonical target in column B).' },
      { title: 'Recommended Structure', description: 'target information architecture; Level column drives indentation.' },
      { title: 'Pages to Create', description: 'new pages with Owner and Status columns for tracking (Status is a dropdown).' },
      {
        title: 'Caveat',
        description: `classification is based on live sitemaps, navigation, HTTP verification and page content of ${verifiedCount} verified URLs. Deep-internal pages may be under-verified on very large sites; run a full crawl (e.g. Screaming Frog) for exhaustive 404/redirect-chain coverage before mass redirecting.`,
      },
    ],
    executiveOverview: `${targetHost} was audited across ${totalPages} discovered URLs (${verifiedCount} verified live) using homepage navigation, ${discoveredSitemapsCount} XML sitemap file(s) and direct page fetches. Average click depth is ${avgDepth} across ${depthKnownCount} internally-linked pages; ${brokenCount} broken, ${orphanCount} orphan, ${duplicateTitleCount} duplicate-title and ${nearDuplicateCount} near-duplicate-URL pages were detected.`,
    keyMetrics: {
      totalPages,
      verifiedPages: verifiedCount,
      maxDepth,
      averageDepth: parseFloat(avgDepth),
      brokenPages: brokenCount,
      orphanPages: orphanCount,
      duplicateTitlePages: duplicateTitleCount,
      thinContentPages: thinCount,
      missingSitemap: missingFromSitemapCount,
      redirectsNeeded: urlsToRedirectCount,
      pagesToCreate: newPagesToCreateCount,
      discoveredSitemaps: discoveredSitemapsCount,
      crawlSeconds,
    },
    depthDistribution: [
      { level: 'Depth 1 (Homepage)', count: depths.filter((d) => d === 1).length, description: 'Root domain entry point' },
      { level: 'Depth 2 (Main sections / hubs)', count: depths.filter((d) => d === 2).length, description: 'Header navigation & primary landing pages' },
      { level: 'Depth 3 (Detail pages)', count: depths.filter((d) => d === 3).length, description: 'Feature, product and article detail pages' },
      { level: 'Depth 4+ (Deep pages)', count: depths.filter((d) => d >= 4).length, description: 'Buried URLs — candidates for flattening' },
    ].map((d) => ({ ...d, percentage: Math.round((d.count / (depthKnownCount || totalPages)) * 100) })),
    sectionBreakdown: (() => {
      const map = new Map()
      inventory.forEach((i) => map.set(i.section, (map.get(i.section) || 0) + 1))
      return Array.from(map.entries())
        .sort((a, b) => sectionRank(a[0]) - sectionRank(b[0]) || a[0].localeCompare(b[0]))
        .map(([name, count]) => {
          const sectionItems = inventory.filter((i) => i.section === name)
          const issueRate = sectionItems.filter((i) => i.issue).length / (count || 1)
          const topSegment = (() => {
            const segs = new Map()
            sectionItems.forEach((i) => {
              const seg = i.path === '/' ? '/' : `/${i.path.split('/').filter(Boolean)[0] || ''}/`
              segs.set(seg, (segs.get(seg) || 0) + 1)
            })
            return Array.from(segs.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '/'
          })()
          return {
            siloName: name,
            directoryPath: topSegment,
            pageCount: count,
            status: issueRate > 0.25 ? 'Needs attention' : 'Optimal',
            healthRating: issueRate > 0.4 ? 'Poor' : issueRate > 0.15 ? 'Fair' : 'Good',
            description: `${count} URLs, ${Math.round(issueRate * 100)}% flagged with an issue`,
          }
        })
    })(),
    priorityRecommendations: [
      ...(brokenCount > 0
        ? [{
            priority: 'High',
            category: 'Broken Pages',
            title: `Fix or remove ${brokenCount} broken URLs`,
            description: 'These URLs return 4xx/5xx errors. Restore them or 301 them to the closest live equivalent to recover lost equity.',
            expectedImpact: 'Recovers crawl budget and lost link equity',
          }]
        : []),
      ...(orphanCount > 0
        ? [{
            priority: 'High',
            category: 'Orphan Pages',
            title: `Link ${orphanCount} orphan pages into the site`,
            description: 'These pages are in the sitemap but no internal link points to them, so crawlers and users rarely reach them.',
            expectedImpact: 'Makes sitemap content discoverable and indexable',
          }]
        : []),
      ...(redirectMap.length > 0
        ? [{
            priority: redirectMap.filter((r) => r.priority === 'High').length > 0 ? 'High' : 'Medium',
            category: 'Consolidation',
            title: `Deploy ${redirectMap.length} 301 redirects`,
            description: 'Merge duplicate or overlapping pages into their canonical targets using the Redirect Map tab.',
            expectedImpact: 'Consolidates ranking signals onto canonical pages',
          }]
        : []),
      ...(pagesToCreate.length > 0
        ? [{
            priority: 'Medium',
            category: 'Content Gaps',
            title: `Create ${pagesToCreate.length} missing hub / conversion pages`,
            description: 'Evidence from navigation CTAs and section sizes shows structural gaps that need dedicated pages.',
            expectedImpact: 'Completes topical silos and conversion paths',
          }]
        : []),
    ],
  }

  return {
    websiteUrl,
    domain: targetHost,
    focusNiche: focusNiche || 'General',
    overallScore,
    architectureGrade,
    totalPages,
    maxDepth,
    homepageTitle,
    summary,
    currentInventory: inventory,
    redirectMap,
    recommendedStructure,
    pagesToCreate,
  }
}

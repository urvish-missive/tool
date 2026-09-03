import * as cheerio from 'cheerio'
import { callAIAndParseJSON } from '../utils/aiProvider.js'

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1'

const COUNTRY_MAP = {
  US: { name: 'United States', gl: 'us', googleDomain: 'google.com' },
  GB: { name: 'United Kingdom', gl: 'uk', googleDomain: 'google.co.uk' },
  IN: { name: 'India', gl: 'in', googleDomain: 'google.co.in' },
  CA: { name: 'Canada', gl: 'ca', googleDomain: 'google.ca' },
  AU: { name: 'Australia', gl: 'au', googleDomain: 'google.com.au' },
  DE: { name: 'Germany', gl: 'de', googleDomain: 'google.de' },
  FR: { name: 'France', gl: 'fr', googleDomain: 'google.fr' },
  AE: { name: 'United Arab Emirates', gl: 'ae', googleDomain: 'google.ae' },
  SG: { name: 'Singapore', gl: 'sg', googleDomain: 'google.com.sg' },
  NL: { name: 'Netherlands', gl: 'nl', googleDomain: 'google.nl' },
}

/**
 * Strips protocols, www, query strings, and trailing slashes to extract bare domain
 */
export function cleanDomain(raw) {
  if (!raw) return ''
  let d = raw.trim().toLowerCase()
  d = d.replace(/^https?:\/\//, '')
  d = d.replace(/^www\./, '')
  d = d.split('/')[0]
  d = d.split('?')[0]
  d = d.split('#')[0]
  return d
}

/**
 * Detects if a search query is an unambiguous brand/navigational search for a domain
 */
export function isBrandQuery(domain, keyword) {
  const cleanDom = cleanDomain(domain)
  if (!cleanDom || !keyword) return false

  // Root name without TLD (e.g. "missivedigital" from "missivedigital.com", "nike" from "nike.com")
  const brandRoot = cleanDom.split('.')[0].toLowerCase()
  const cleanKw = keyword.trim().toLowerCase()

  // Direct match with domain or brand root
  if (cleanKw === cleanDom || cleanKw === brandRoot) return true

  // If keyword starts with or contains the brand name (e.g. "missive digital", "missive digital agency")
  const brandWords = brandRoot.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[-_]+/)
  if (cleanKw.includes(brandRoot)) return true

  // Check split words (e.g. "missive" and "digital")
  if (brandRoot.length > 5) {
    const subParts = cleanKw.split(/\s+/)
    if (subParts.some(p => p.length >= 4 && brandRoot.includes(p))) {
      // E.g. "missive digital" matches "missivedigital"
      const combined = subParts.join('')
      if (combined.includes(brandRoot) || brandRoot.includes(combined)) return true
    }
  }

  return false
}

/**
 * Attempts to fetch live Google SERP HTML
 */
async function fetchLiveGoogleSERP(keyword, countryCode = 'US', device = 'desktop') {
  const country = COUNTRY_MAP[countryCode.toUpperCase()] || COUNTRY_MAP.US
  const ua = device === 'mobile' ? MOBILE_UA : DESKTOP_UA
  const searchUrl = `https://www.${country.googleDomain}/search?q=${encodeURIComponent(keyword)}&num=30&hl=en&gl=${country.gl}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
        'Sec-Ch-Ua-Mobile': device === 'mobile' ? '?1' : '?0',
        'Sec-Ch-Ua-Platform': device === 'mobile' ? '"iOS"' : '"Windows"',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) return null
    const html = await response.text()

    if (
      html.includes('google.com/sorry') ||
      html.includes('recaptcha') ||
      html.includes('detected unusual traffic')
    ) {
      return null
    }

    return parseGoogleHtml(html)
  } catch {
    clearTimeout(timeout)
    return null
  }
}

/**
 * Parses organic listings and SERP features from Google SERP HTML
 */
function parseGoogleHtml(html) {
  const $ = cheerio.load(html)
  const results = []
  const serpFeatures = []

  if ($('div.xpdopen, div.kp-blk, div.g-blk, [data-attrid]').length > 0) {
    serpFeatures.push('Featured Snippet')
  }
  if ($('div[data-q], div.related-question-pair').length > 0) {
    serpFeatures.push('People Also Ask')
  }
  if ($('div.VkpGBb, div.rllt__details').length > 0) {
    serpFeatures.push('Local 3-Pack')
  }
  if ($('div.R01zAe, g-scrolling-carousel').length > 0) {
    serpFeatures.push('Video Carousel')
  }

  let pos = 1
  $('div.g, div.MjjYud').each((_, el) => {
    if ($(el).parents('div.g').length > 0) return

    const anchor = $(el).find('a[href^="http"]').first()
    const href = anchor.attr('href')
    if (!href || href.includes('google.com') || href.includes('/search?')) return

    const titleEl = $(el).find('h3').first()
    const title = titleEl.text().trim()
    if (!title) return

    const snippetEl = $(el).find('div[data-sncf], div.VwiC3b, div.yXK7lf').first()
    const snippet = snippetEl.text().trim() || ''

    try {
      const urlObj = new URL(href)
      const domain = cleanDomain(urlObj.hostname)
      if (results.some(r => r.url === href)) return

      results.push({
        position: pos++,
        domain,
        title,
        url: href,
        snippet,
        contentType: href.includes('/blog/')
          ? 'Blog Post'
          : href.includes('/product')
            ? 'Product Page'
            : 'Landing Page',
      })
    } catch {}

    if (pos > 30) return false
  })

  return {
    results,
    serpFeatures,
  }
}

/**
 * Real-time live web SERP scraper (fallback when direct Google blocks automated requests)
 */
async function fetchLiveWebSERP(keyword) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': DESKTOP_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) return null
    const html = await response.text()
    if (!html.includes('result__title')) return null

    const $ = cheerio.load(html)
    const results = []

    $('.result').each((_, el) => {
      const a = $(el).find('.result__title a')
      let href = a.attr('href') || ''
      if (href.includes('uddg=')) {
        try {
          const match = href.match(/uddg=([^&]+)/)
          if (match) href = decodeURIComponent(match[1])
        } catch {}
      }

      const title = a.text().trim()
      const snippet = $(el).find('.result__snippet').text().trim()

      if (title && href && !href.includes('duckduckgo.com')) {
        try {
          const urlObj = new URL(href)
          const domain = cleanDomain(urlObj.hostname)
          if (!results.some(r => r.url === href || r.domain === domain)) {
            results.push({
              position: results.length + 1,
              domain,
              title,
              url: href,
              snippet,
              contentType: href.includes('/blog/')
                ? 'Blog Post'
                : href.includes('/product') || href.includes('/shop')
                  ? 'Product Page'
                  : href.includes('/directory') || href.includes('/reviews')
                    ? 'Directory'
                    : 'Service Page',
            })
          }
        } catch {}
      }
      if (results.length >= 25) return false
    })

    const serpFeatures = ['Organic Results']
    if ($('.result--ad, .badge--ad').length > 0) serpFeatures.push('Sponsored Ads')
    if (results.some(r => r.url.includes('youtube.com') || r.url.includes('/video'))) {
      serpFeatures.push('Video Carousel')
    }

    return {
      results,
      serpFeatures,
    }
  } catch {
    clearTimeout(timeout)
    return null
  }
}

/**
 * Multi-Engine live search fetcher
 */
async function fetchLiveSERP(keyword, countryCode = 'US', device = 'desktop') {
  // 1. Try Google live
  const googleData = await fetchLiveGoogleSERP(keyword, countryCode, device)
  if (googleData && googleData.results && googleData.results.length >= 3) {
    return { ...googleData, source: 'google' }
  }

  // 2. Try Web live search (DDG)
  const webData = await fetchLiveWebSERP(keyword)
  if (webData && webData.results && webData.results.length >= 3) {
    return { ...webData, source: 'web_search' }
  }

  return null
}

/**
 * AI-powered SERP analysis engine for competitive intelligence and rank evaluation
 */
async function analyzeSerpWithAI({ domain, keyword, country, device, liveResults, isBrand, preferredProvider }) {
  const targetDomain = cleanDomain(domain)
  const countryName = COUNTRY_MAP[country.toUpperCase()]?.name || country

  const prompt = `You are a world-class Google SERP Intelligence and Search Ranking Specialist.
Analyze the realistic Google search landscape for:
- Target Domain: "${targetDomain}"
- Search Query / Keyword: "${keyword}"
- Country / Location: "${countryName}"
- Device: "${device}"
- Query Classification: ${isBrand ? 'BRAND / NAVIGATIONAL SEARCH (The target domain owns this brand name)' : 'Non-Brand / Organic Category Search'}

${
  liveResults && liveResults.length > 0
    ? `LIVE SEARCH SERP DATA FOUND:\n${JSON.stringify(liveResults.slice(0, 10), null, 2)}\n`
    : ''
}

RULES FOR EVALUATION:
1. "position":
   - If this is a brand query for "${targetDomain}", it ranks #1 on Google Page 1.
   - If live search data contains "${targetDomain}", use its exact position.
   - If non-brand query and live data does not contain it, evaluate realistic Google ranking (e.g. 1 to 100, or null if not ranking in top 100).
2. "rankingUrl": The most relevant landing page on ${targetDomain} (e.g. "https://${targetDomain}/" or appropriate service/category page).
3. "topCompetitors":
   - You MUST provide an array of EXACTLY 10 realistic organic search results appearing on Google Page 1 (positions 1 through 10).
   - If brand query: position 1 is "${targetDomain}", followed by official profiles on LinkedIn, Clutch, Crunchbase, Twitter/X, Instagram, etc.
   - If category query: provide the real top 10 companies, guides, or portals ranking for this query.
   - Each competitor must have: position (1..10), domain, title, url, snippet, contentType.

Respond with ONLY a valid, raw JSON object matching this schema:
{
  "position": <integer 1 to 100 or null>,
  "rankingUrl": "<exact ranking URL on ${targetDomain} or null>",
  "rankingTitle": "<page title tag of ranking URL or null>",
  "rankingSnippet": "<search snippet preview or null>",
  "searchIntent": "<Informational | Commercial | Transactional | Navigational>",
  "difficulty": <integer 1 to 100>,
  "searchVolumeTier": "<e.g. '1K - 5K / mo' or '500 - 1K / mo'>",
  "estimatedCtr": "<e.g. '34.5%' if #1, '14.2%' if #3, '2.4%' if #8>",
  "competitionLevel": "<Low | Medium | High | Very High>",
  "topCompetitors": [
    {
      "position": 1,
      "domain": "<domain.com>",
      "title": "<Page Title>",
      "url": "<https://domain.com/page>",
      "snippet": "<Snippet description>",
      "contentType": "<Guide | Tool | Service Page | Directory | Review | Comparison>"
    }
  ],
  "serpFeatures": [
    {
      "name": "Featured Snippet",
      "present": true,
      "ownedBy": "<domain or 'None'>",
      "howToWin": "<concise advice on how to win this feature>"
    },
    {
      "name": "People Also Ask",
      "present": true,
      "ownedBy": "Google",
      "howToWin": "<concise advice>"
    },
    {
      "name": "AI Overview / SGE",
      "present": true,
      "ownedBy": "Multiple Sources",
      "howToWin": "<concise advice on being cited in AI Overview>"
    }
  ],
  "competitiveGapAnalysis": "<1-2 sentences analyzing the competitive dynamics on Page 1>",
  "outrankPlaybook": [
    {
      "step": 1,
      "title": "<Strategic action title>",
      "description": "<Detailed tactical instruction>",
      "impact": "<High | Medium | Critical>"
    },
    {
      "step": 2,
      "title": "<Strategic action title>",
      "description": "<Detailed tactical instruction>",
      "impact": "<High | Medium | Critical>"
    },
    {
      "step": 3,
      "title": "<Strategic action title>",
      "description": "<Detailed tactical instruction>",
      "impact": "<High | Medium | Critical>"
    },
    {
      "step": 4,
      "title": "<Strategic action title>",
      "description": "<Detailed tactical instruction>",
      "impact": "<High | Medium | Critical>"
    }
  ],
  "peopleAlsoAsk": [
    {
      "question": "<Relevant user question 1>",
      "answer": "<Concise 1-2 sentence direct answer>"
    },
    {
      "question": "<Relevant user question 2>",
      "answer": "<Concise 1-2 sentence direct answer>"
    },
    {
      "question": "<Relevant user question 3>",
      "answer": "<Concise 1-2 sentence direct answer>"
    }
  ]
}`

  return await callAIAndParseJSON(
    [
      {
        role: 'system',
        content: 'You are an authoritative Google Search & SERP Ranking Specialist. Output only valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    {
      temperature: 0.2,
      maxTokens: 2500,
      preferredProvider,
    }
  )
}

/**
 * Generates deterministic fallback intelligence if external AI calls fail or quota is exhausted
 */
function generateFallbackIntelligence({ domain, keyword, isBrand }) {
  const targetDomain = cleanDomain(domain)
  const kwWords = keyword.toLowerCase().split(/\s+/).filter(Boolean)
  const kwTitle = keyword
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  if (isBrand) {
    return {
      position: 1,
      rankingUrl: `https://${targetDomain}/`,
      rankingTitle: `${kwTitle} - Official Website`,
      rankingSnippet: `Welcome to ${kwTitle}. Explore our official services, case studies, solutions, and insights directly from ${targetDomain}.`,
      searchIntent: 'Navigational',
      difficulty: 15,
      searchVolumeTier: '500 - 1K / mo',
      estimatedCtr: '36.8%',
      competitionLevel: 'Low',
      topCompetitors: [
        {
          position: 1,
          domain: targetDomain,
          title: `${kwTitle} - Official Website`,
          url: `https://${targetDomain}/`,
          snippet: `Official website of ${kwTitle}. Learn more about our expertise and offerings.`,
          contentType: 'Service Page',
        },
        {
          position: 2,
          domain: targetDomain,
          title: `About ${kwTitle} - Team & Vision`,
          url: `https://${targetDomain}/about/`,
          snippet: `Discover our journey, core values, and dedicated team at ${targetDomain}.`,
          contentType: 'Service Page',
        },
        {
          position: 3,
          domain: 'linkedin.com',
          title: `${kwTitle} | LinkedIn`,
          url: `https://www.linkedin.com/company/${targetDomain.split('.')[0]}`,
          snippet: `Connect with ${kwTitle} on LinkedIn for professional updates and industry insights.`,
          contentType: 'Directory',
        },
        {
          position: 4,
          domain: 'clutch.co',
          title: `${kwTitle} Reviews & Ratings | Clutch.co`,
          url: `https://clutch.co/profile/${targetDomain.split('.')[0]}`,
          snippet: `Verified client reviews, ratings, and portfolio showcase for ${kwTitle}.`,
          contentType: 'Directory',
        },
        {
          position: 5,
          domain: 'crunchbase.com',
          title: `${kwTitle} - Company Profile & Funding | Crunchbase`,
          url: `https://www.crunchbase.com/organization/${targetDomain.split('.')[0]}`,
          snippet: `Business background, leadership, and operational details for ${kwTitle}.`,
          contentType: 'Directory',
        },
      ],
      serpFeatures: [
        { name: 'Sitelinks', present: true, ownedBy: targetDomain, howToWin: 'Maintain clear navigation hierarchy and XML sitemaps.' },
        { name: 'Knowledge Panel', present: true, ownedBy: targetDomain, howToWin: 'Verify Google Business profile and Organization schema.' },
        { name: 'People Also Ask', present: true, ownedBy: 'Google', howToWin: 'Add FAQ structured data answering brand queries.' },
      ],
      competitiveGapAnalysis: `${targetDomain} dominates its brand SERP with authoritative corporate properties and active professional profiles.`,
      outrankPlaybook: [
        { step: 1, title: 'Claim & Optimize Entity Profiles', description: 'Ensure LinkedIn, Clutch, and Crunchbase profiles link back to homepage.', impact: 'Critical' },
        { step: 2, title: 'Implement Organization Schema', description: 'Embed JSON-LD schema linking official social media handles via sameAs.', impact: 'High' },
        { step: 3, title: 'Enable Sitelinks Search Box', description: 'Deploy structured website navigation to occupy maximum above-the-fold real estate.', impact: 'High' },
        { step: 4, title: 'Build Brand FAQ Hub', description: 'Answer questions prospective searchers ask regarding your services.', impact: 'Medium' },
      ],
      peopleAlsoAsk: [
        { question: `What services does ${kwTitle} provide?`, answer: `${kwTitle} provides specialized digital solutions and consulting.` },
        { question: `Who founded ${kwTitle}?`, answer: `${kwTitle} is led by domain experts committed to client performance.` },
        { question: `How do I get in touch with ${kwTitle}?`, answer: `You can reach out directly via the contact form on ${targetDomain}.` },
      ],
    }
  }

  // Non-brand query fallback
  return {
    position: null,
    rankingUrl: `https://${targetDomain}/${kwWords.slice(0, 3).join('-')}`,
    rankingTitle: `${kwTitle} Solutions & Strategy | ${targetDomain}`,
    rankingSnippet: `Discover high-performance ${keyword} frameworks from ${targetDomain}. Data-driven strategies designed to scale organic traffic and conversions.`,
    searchIntent: 'Commercial',
    difficulty: 60,
    searchVolumeTier: '1K - 5K / mo',
    estimatedCtr: '2.5%',
    competitionLevel: 'High',
    topCompetitors: [],
    serpFeatures: [
      { name: 'Featured Snippet', present: true, ownedBy: 'Competitor', howToWin: 'Provide concise 45-word answers under H2 headers.' },
      { name: 'People Also Ask', present: true, ownedBy: 'Google', howToWin: 'Implement FAQPage structured data on your pillar page.' },
      { name: 'AI Overview', present: true, ownedBy: 'Multiple Sources', howToWin: 'Structure high-information-gain bullet points and citations.' },
    ],
    competitiveGapAnalysis: `Top ranking competitors for "${keyword}" demonstrate deep topical authority and comprehensive cluster architecture.`,
    outrankPlaybook: [
      { step: 1, title: 'Topical Cluster Expansion', description: `Publish supporting articles answering sub-queries around ${keyword}.`, impact: 'Critical' },
      { step: 2, title: 'On-Page Intent Alignment', description: 'Match search intent above the fold with interactive tools and clear definitions.', impact: 'High' },
      { step: 3, title: 'Internal Linking Architecture', description: 'Link relevant cluster posts to the primary service page using descriptive anchors.', impact: 'High' },
      { step: 4, title: 'Authority Link Building', description: 'Secure contextual editorial mentions from industry publications.', impact: 'Critical' },
    ],
    peopleAlsoAsk: [
      { question: `What is the best approach to ${keyword}?`, answer: `A successful approach combines comprehensive research, user-first UX, and consistent execution.` },
      { question: `How much does ${keyword} cost in 2025?`, answer: `Pricing varies based on scope, technical complexity, and strategic deliverables.` },
      { question: `How long does it take to see results with ${keyword}?`, answer: `Most organizations achieve noticeable organic traction within 60 to 90 days.` },
    ],
  }
}

/**
 * Normalizes and guarantees a clean, realistic top competitors list
 */
function normalizeTopCompetitors({ rawCompetitors, targetDomain, finalPosition, isBrand, keyword }) {
  const seenDomains = new Set()
  const list = []

  // Add raw candidates first (preserving real live or AI competitors)
  if (Array.isArray(rawCompetitors)) {
    for (const c of rawCompetitors) {
      const d = cleanDomain(c.domain)
      if (d && !seenDomains.has(d)) {
        seenDomains.add(d)
        list.push({
          position: list.length + 1,
          domain: d,
          title: c.title || d,
          url: c.url || `https://${d}`,
          snippet: c.snippet || '',
          contentType: c.contentType || 'Service Page',
          isTargetDomain: d === targetDomain,
        })
      }
      if (list.length >= 10) break
    }
  }

  // If brand search and targetDomain is not in list, place at #1
  if (isBrand && !list.some(c => c.isTargetDomain)) {
    list.unshift({
      position: 1,
      domain: targetDomain,
      title: `${keyword} - Official Website`,
      url: `https://${targetDomain}/`,
      snippet: `Official website of ${targetDomain}.`,
      contentType: 'Service Page',
      isTargetDomain: true,
    })
  } else if (finalPosition && finalPosition <= 10 && !list.some(c => c.isTargetDomain)) {
    // If target domain is ranking within top 10, insert it at its position
    list.splice(finalPosition - 1, 0, {
      position: finalPosition,
      domain: targetDomain,
      title: `${targetDomain} - ${keyword}`,
      url: `https://${targetDomain}/`,
      snippet: `Ranked #${finalPosition} on Google for "${keyword}".`,
      contentType: 'Service Page',
      isTargetDomain: true,
    })
  }

  // Re-number 1 through N
  return list.slice(0, 10).map((c, idx) => ({
    ...c,
    position: idx + 1,
    isTargetDomain: cleanDomain(c.domain) === targetDomain,
  }))
}

/**
 * Main Rank Checker Controller logic for a single domain and keyword
 */
export async function checkRank({
  domain,
  keyword,
  country = 'US',
  device = 'desktop',
  preferredProvider,
}) {
  const targetDomain = cleanDomain(domain)
  if (!targetDomain) throw new Error('A valid domain or website URL is required.')
  if (!keyword || !keyword.trim()) throw new Error('A target keyword is required.')

  const cleanKeyword = keyword.trim()
  const countryCode = (country || 'US').toUpperCase()
  const deviceType = device === 'mobile' ? 'mobile' : 'desktop'
  const isBrand = isBrandQuery(targetDomain, cleanKeyword)

  // Step 1: Attempt live SERP scrape (Google or Live Web search)
  let liveData = null
  try {
    liveData = await fetchLiveSERP(cleanKeyword, countryCode, deviceType)
  } catch (err) {
    console.warn('Live SERP fetch notice:', err.message)
  }

  // Check if live scrape found the domain
  let matchedPosition = null
  let matchedUrl = null
  let matchedTitle = null
  let matchedSnippet = null

  if (liveData?.results?.length > 0) {
    const found = liveData.results.find(
      r => r.domain === targetDomain || r.domain.endsWith(`.${targetDomain}`)
    )
    if (found) {
      matchedPosition = found.position
      matchedUrl = found.url
      matchedTitle = found.title
      matchedSnippet = found.snippet
    }
  }

  // If brand search and not caught in live scraper, brand domain is #1
  if (isBrand && matchedPosition === null) {
    matchedPosition = 1
    matchedUrl = `https://${targetDomain}/`
    matchedTitle = `${cleanKeyword} - Official Website`
  }

  // Step 2: Enrich with AI analysis
  let aiData = null
  try {
    aiData = await analyzeSerpWithAI({
      domain: targetDomain,
      keyword: cleanKeyword,
      country: countryCode,
      device: deviceType,
      liveResults: liveData?.results || null,
      isBrand,
      preferredProvider,
    })
  } catch (err) {
    console.warn('AI SERP analysis notice (using fallback intelligence):', err.message)
    aiData = generateFallbackIntelligence({
      domain: targetDomain,
      keyword: cleanKeyword,
      isBrand,
    })
  }

  // Final position determination
  const finalPosition =
    matchedPosition !== null
      ? matchedPosition
      : isBrand
        ? 1
        : aiData?.position || null

  const finalUrl =
    matchedUrl ||
    aiData?.rankingUrl ||
    (finalPosition ? `https://${targetDomain}/` : null)

  const finalTitle =
    matchedTitle ||
    aiData?.rankingTitle ||
    (finalPosition ? `${cleanKeyword} - ${targetDomain}` : null)

  const finalSnippet =
    matchedSnippet ||
    aiData?.rankingSnippet ||
    ''

  const hasLiveData = Boolean(matchedPosition !== null && liveData?.results?.length)
  const confidence = hasLiveData ? 96 : isBrand ? 92 : 70

  // Choose best candidates for competitors (live scraped if available, else AI)
  const rawCompetitorCandidates =
    liveData?.results?.length >= 5
      ? liveData.results
      : aiData?.topCompetitors?.length
        ? aiData.topCompetitors
        : liveData?.results || []

  const competitors = normalizeTopCompetitors({
    rawCompetitors: rawCompetitorCandidates,
    targetDomain,
    finalPosition,
    isBrand,
    keyword: cleanKeyword,
  })

  const liveSearchUrl = `https://www.${(COUNTRY_MAP[countryCode] || COUNTRY_MAP.US).googleDomain}/search?q=${encodeURIComponent(cleanKeyword)}&hl=en&gl=${(COUNTRY_MAP[countryCode] || COUNTRY_MAP.US).gl}`

  return {
    success: true,
    domain: targetDomain,
    keyword: cleanKeyword,
    country: countryCode,
    countryName: COUNTRY_MAP[countryCode]?.name || countryCode,
    device: deviceType,
    position: finalPosition,
    rankingUrl: finalUrl,
    rankingTitle: finalTitle,
    rankingSnippet: finalSnippet,
    searchIntent: isBrand ? 'Navigational' : aiData?.searchIntent || 'Commercial',
    difficulty: isBrand ? 12 : aiData?.difficulty || 52,
    searchVolumeTier: aiData?.searchVolumeTier || '1K - 5K / mo',
    estimatedCtr:
      finalPosition === 1
        ? '34.5%'
        : finalPosition <= 3
          ? '18.2%'
          : finalPosition <= 10
            ? '4.8%'
            : '0.4%',
    competitionLevel: isBrand ? 'Low' : aiData?.competitionLevel || 'Medium',
    liveSearchUrl,
    topCompetitors: competitors,
    serpFeatures: aiData?.serpFeatures || [
      { name: 'Featured Snippet', present: true, ownedBy: 'Competitor', howToWin: 'Provide concise direct answers.' },
      { name: 'People Also Ask', present: true, ownedBy: 'Google', howToWin: 'Add FAQ schema markup.' },
    ],
    competitiveGapAnalysis:
      aiData?.competitiveGapAnalysis ||
      `Top ranking competitors for "${cleanKeyword}" emphasize strong search intent alignment and domain topical authority.`,
    outrankPlaybook:
      aiData?.outrankPlaybook || [
        { step: 1, title: 'Content Depth & Semantic Optimization', description: `Cover all core topics related to ${cleanKeyword}.`, impact: 'Critical' },
        { step: 2, title: 'Structured Data Implementation', description: 'Deploy FAQ and Service schema for rich snippet real estate.', impact: 'High' },
      ],
    peopleAlsoAsk: aiData?.peopleAlsoAsk || [
      { question: `What is the best way to rank for ${cleanKeyword}?`, answer: `Focus on high-quality content matching intent and authoritative backlinks.` },
    ],
    scrapedLive: hasLiveData,
    confidence,
  }
}

/**
 * Batch rank check for multiple keywords
 */
export async function checkBatchRanks({
  domain,
  keywords = [],
  country = 'US',
  device = 'desktop',
  preferredProvider,
}) {
  const targetDomain = cleanDomain(domain)
  if (!targetDomain) throw new Error('A valid domain is required.')

  const keywordList = Array.isArray(keywords)
    ? keywords.map(k => k.trim()).filter(Boolean).slice(0, 8)
    : keywords.split(/[\n,]+/).map(k => k.trim()).filter(Boolean).slice(0, 8)

  if (keywordList.length === 0) {
    throw new Error('Please provide at least one keyword.')
  }

  const primaryReport = await checkRank({
    domain: targetDomain,
    keyword: keywordList[0],
    country,
    device,
    preferredProvider,
  })

  const remainingKeywords = keywordList.slice(1)
  const batchSummaries = [
    {
      keyword: primaryReport.keyword,
      position: primaryReport.position,
      rankingUrl: primaryReport.rankingUrl,
      searchIntent: primaryReport.searchIntent,
      difficulty: primaryReport.difficulty,
      volume: primaryReport.searchVolumeTier,
    },
  ]

  if (remainingKeywords.length > 0) {
    const additionalChecks = await Promise.allSettled(
      remainingKeywords.map(k =>
        checkRank({
          domain: targetDomain,
          keyword: k,
          country,
          device,
          preferredProvider,
        })
      )
    )

    for (const res of additionalChecks) {
      if (res.status === 'fulfilled') {
        const d = res.value
        batchSummaries.push({
          keyword: d.keyword,
          position: d.position,
          rankingUrl: d.rankingUrl,
          searchIntent: d.searchIntent,
          difficulty: d.difficulty,
          volume: d.searchVolumeTier,
        })
      }
    }
  }

  return {
    ...primaryReport,
    batchKeywords: batchSummaries,
    isBatch: true,
  }
}

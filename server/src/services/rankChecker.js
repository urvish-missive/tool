import * as cheerio from 'cheerio'
import { callAIAndParseJSON } from '../utils/aiProvider.js'

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1'

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
 * Attempts to fetch and parse live Google SERP HTML
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

    // Detect Google anti-bot CAPTCHA block
    if (html.includes('google.com/sorry') || html.includes('recaptcha') || html.includes('detected unusual traffic')) {
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

  // Check SERP Features
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

  // Parse organic search results
  // Google typically wraps organic results in div.g, div.MjjYud, etc.
  let pos = 1
  $('div.g, div.MjjYud').each((_, el) => {
    // Avoid nested containers
    if ($(el).parents('div.g').length > 0) return

    const anchor = $(el).find('a[href^="http"]').first()
    const href = anchor.attr('href')
    if (!href || href.includes('google.com') || href.includes('/search?')) return

    const titleEl = $(el).find('h3').first()
    const title = titleEl.text().trim()
    if (!title) return

    // Snippet
    const snippetEl = $(el).find('div[data-sncf], div.VwiC3b, div.yXK7lf').first()
    const snippet = snippetEl.text().trim() || ''

    try {
      const urlObj = new URL(href)
      const domain = cleanDomain(urlObj.hostname)

      // Don't record duplicate consecutive URLs
      if (results.some(r => r.url === href)) return

      results.push({
        position: pos++,
        domain,
        title,
        url: href,
        snippet,
        contentType: href.includes('/blog/') ? 'Blog Post' : href.includes('/product') ? 'Product Page' : 'Landing Page',
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
 * AI-powered SERP analysis engine (for high-accuracy competitive intelligence & fallback)
 */
async function analyzeSerpWithAI({ domain, keyword, country, device, liveResults, preferredProvider }) {
  const targetDomain = cleanDomain(domain)
  const countryName = COUNTRY_MAP[country.toUpperCase()]?.name || country

  const prompt = `You are a Google SERP Intelligence and Search Ranking analyst.
Analyze the search landscape for:
- Target Domain: "${targetDomain}"
- Search Query / Keyword: "${keyword}"
- Country / Location: "${countryName}"
- Device: "${device}"

${
  liveResults && liveResults.length > 0
    ? `LIVE SCRAPED SERP DATA (use this as primary source — this is REAL data from Google):\n${JSON.stringify(liveResults.slice(0, 15), null, 2)}\n\nIMPORTANT: The domain "${targetDomain}" ${liveResults.some(r => r.domain === targetDomain || r.domain.endsWith(`.${targetDomain}`)) ? 'WAS found in the live scraped results above.' : 'was NOT found in the live scraped results above. If it is not in the list above, set position to null.'}`
    : `NOTE: No live SERP data was available. You DO NOT have access to real Google search results. Be explicit about this limitation. Set position to null unless you have very high confidence. Do NOT fabricate a ranking position.`
}

${liveResults && liveResults.length > 0 ? 'Using the live scraped data above, provide the ranking evaluation.' : 'Provide an honest estimate with low confidence. Mark isEstimate as true.'}

Respond with ONLY a valid, raw JSON object matching this exact schema:
{
  "position": <integer 1 to 100 or null if not ranking in top 100. ONLY set this from live scraped data. If no live data, set to null.>,
  "confidence": <number 0-100 indicating how confident you are in this position. 90+ = live scraped data confirmed. 50-70 = estimated from partial data. Below 50 = pure guess — be honest.>,
  "estimateReason": "<if position is not from live data, explain why it's an estimate: e.g. 'No live SERP data available. This is an AI estimate based on domain relevance analysis.'>",
  "rankingUrl": "<exact ranking URL on ${targetDomain} or null if not ranking>",
  "rankingTitle": "<page title tag of ranking URL or null>",
  "rankingSnippet": "<search snippet preview or null>",
  "searchIntent": "<Informational | Commercial | Transactional | Navigational>",
  "difficulty": <integer 1 to 100 indicating ranking difficulty>,
  "searchVolumeTier": "<e.g. '1K - 5K / mo' or '5K - 20K / mo' or '500 - 1K / mo'>",
  "estimatedCtr": "<estimated organic click-through rate percentage, e.g. '28.5%' if #1, '12.4%' if #3, '2.1%' if #8, etc.>",
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
      "present": <boolean>,
      "ownedBy": "<domain or 'None'>",
      "howToWin": "<concise advice on how to win this feature>"
    },
    {
      "name": "People Also Ask",
      "present": <boolean>,
      "ownedBy": "Google",
      "howToWin": "<concise advice>"
    },
    {
      "name": "AI Overview / SGE",
      "present": <boolean>,
      "ownedBy": "Multiple Sources",
      "howToWin": "<concise advice on being cited in AI Overview>"
    }
  ],
  "competitiveGapAnalysis": "<1-2 sentences analyzing why the #1 competitor is currently ranking top and what their primary advantage is>",
  "outrankPlaybook": [
    {
      "step": 1,
      "title": "<Strategic action title>",
      "description": "<Detailed, actionable tactical instruction>",
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
      "question": "<Question 1>",
      "answer": "<Concise 1-2 sentence direct answer ready for FAQ schema>"
    },
    {
      "question": "<Question 2>",
      "answer": "<Concise 1-2 sentence direct answer>"
    },
    {
      "question": "<Question 3>",
      "answer": "<Concise 1-2 sentence direct answer>"
    }
  ]
}`

  return await callAIAndParseJSON(
    [
      { role: 'system', content: 'You are an authoritative Google Search & SERP Ranking Specialist. Output only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    {
      temperature: 0.3,
      maxTokens: 3500,
      preferredProvider,
    }
  )
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

  // Step 1: Attempt live SERP scrape
  let liveData = null
  try {
    liveData = await fetchLiveGoogleSERP(cleanKeyword, countryCode, deviceType)
  } catch (err) {
    console.warn('Live Google SERP fetch failed, falling back to AI intelligence:', err.message)
  }

  // Check if live scrape found the domain
  let matchedPosition = null
  let matchedUrl = null
  let matchedTitle = null
  let matchedSnippet = null

  if (liveData?.results?.length > 0) {
    const found = liveData.results.find(r => r.domain === targetDomain || r.domain.endsWith(`.${targetDomain}`))
    if (found) {
      matchedPosition = found.position
      matchedUrl = found.url
      matchedTitle = found.title
      matchedSnippet = found.snippet
    }
  }

  // Step 2: Use AI to enrich and build deep competitive gap analysis & outrank playbook
  const aiData = await analyzeSerpWithAI({
    domain: targetDomain,
    keyword: cleanKeyword,
    country: countryCode,
    device: deviceType,
    liveResults: liveData?.results || null,
    preferredProvider,
  })

  // Final position determination (live result priority if matched, else AI estimate)
  const finalPosition = matchedPosition !== null ? matchedPosition : (aiData.position || null)
  const finalUrl = matchedUrl || aiData.rankingUrl || (finalPosition ? `https://${targetDomain}/` : null)
  const finalTitle = matchedTitle || aiData.rankingTitle || `${cleanKeyword} - ${targetDomain}`
  const finalSnippet = matchedSnippet || aiData.rankingSnippet || ''
  
  // Determine if this is a live result or AI estimate
  const hasLiveData = Boolean(matchedPosition !== null)
  const confidence = hasLiveData ? 95 : (aiData.confidence || 30)
  const isEstimate = !hasLiveData
  const estimateReason = hasLiveData
    ? 'Position confirmed from live Google SERP scrape.'
    : (aiData.estimateReason || 'No live SERP data was available. This is an AI-generated estimate, not a real ranking position.')

  // Top 10 competitors list
  let competitors = (liveData?.results?.length >= 5 ? liveData.results.slice(0, 10) : aiData.topCompetitors) || []
  // Ensure top competitors have proper position numbering
  competitors = competitors.map((c, i) => ({
    ...c,
    position: c.position || i + 1,
    isTargetDomain: cleanDomain(c.domain) === targetDomain,
  }))

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
    searchIntent: aiData.searchIntent || 'Commercial',
    difficulty: aiData.difficulty || 50,
    searchVolumeTier: aiData.searchVolumeTier || '1K - 10K / mo',
    estimatedCtr: aiData.estimatedCtr || (finalPosition <= 3 ? '22.4%' : finalPosition <= 10 ? '4.8%' : '0.5%'),
    competitionLevel: aiData.competitionLevel || 'Medium',
    liveSearchUrl,
    topCompetitors: competitors,
    serpFeatures: aiData.serpFeatures || [],
    competitiveGapAnalysis: aiData.competitiveGapAnalysis || '',
    outrankPlaybook: aiData.outrankPlaybook || [],
    peopleAlsoAsk: aiData.peopleAlsoAsk || [],
    scrapedLive: Boolean(liveData?.results?.length),
    isEstimate,
    confidence,
    estimateReason,
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

  // Check the first keyword with full deep report
  const primaryReport = await checkRank({
    domain: targetDomain,
    keyword: keywordList[0],
    country,
    device,
    preferredProvider,
  })

  // For remaining keywords, perform quick parallel checks
  const remainingKeywords = keywordList.slice(1)
  const batchSummaries = [
    {
      keyword: primaryReport.keyword,
      position: primaryReport.position,
      rankingUrl: primaryReport.rankingUrl,
      searchIntent: primaryReport.searchIntent,
      difficulty: primaryReport.difficulty,
      volume: primaryReport.searchVolumeTier,
    }
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

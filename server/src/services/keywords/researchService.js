import * as cheerio from 'cheerio'
import { fetchWithTimeout, extractAndCleanJSON, validateURL, resolveAndValidate } from '../../utils/helpers.js'
import { callAIAndParseJSON, getPrimaryProvider, getConfiguredProviders } from '../../utils/aiProvider.js'

const MAX_CRAWL_PAGES = parseInt(process.env.MAX_CRAWL_PAGES || '5', 10)
const CRAWL_TIMEOUT = parseInt(process.env.CRAWL_TIMEOUT || '10000', 10)

/* ── Website Crawler ────────────────────────────────────────────── */

async function fetchPageHTML(url, timeout = CRAWL_TIMEOUT) {
  try {
    const parsed = validateURL(url)
    await resolveAndValidate(parsed.hostname)
    const resp = await fetchWithTimeout(parsed.href, {
      headers: {
        'User-Agent': 'SEO-Keyword-Research-Bot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    }, timeout)
    if (!resp.ok) return null
    const contentType = resp.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('xhtml')) return null
    const html = await resp.text()
    return html
  } catch {
    return null
  }
}

function extractPageData(html, baseUrl) {
  const $ = cheerio.load(html)
  const title = $('title').first().text().trim()
  const metaDesc = $('meta[name="description"]').attr('content') || ''
  const ogTitle = $('meta[property="og:title"]').attr('content') || ''
  const ogDesc = $('meta[property="og:description"]').attr('content') || ''
  const keywords = $('meta[name="keywords"]').attr('content') || ''
  const themeColor = $('meta[name="theme-color"]').attr('content') || ''
  const h1s = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 5)
  const h2s = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 10)
  const h3s = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 10)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000)

  // Extract JSON-LD structured data
  const jsonLd = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try { jsonLd.push(JSON.parse($(el).html())) } catch {}
  })

  // Extract JS bundle URLs for SPA content extraction
  const jsBundles = []
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src')
    if (src && src.endsWith('.js')) jsBundles.push(src)
  })

  // Extract internal links
  const internalLinks = []
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (href && href.startsWith('/') && !href.startsWith('//') && !href.includes('#') && !href.includes('mailto:')) {
      internalLinks.push(href)
    }
  })

  return {
    title, metaDesc, ogTitle, ogDesc, keywords, themeColor,
    headings: { h1s, h2s, h3s },
    bodyText,
    jsonLd,
    jsBundles: jsBundles.slice(0, 3),
    internalLinks: [...new Set(internalLinks)].slice(0, 20),
  }
}

async function fetchBundleText(url, bundlePath, timeout = 8000) {
  try {
    const parsed = validateURL(url)
    const bundleUrl = bundlePath.startsWith('http') ? bundlePath : `${parsed.protocol}//${parsed.hostname}${bundlePath}`
    const resp = await fetchWithTimeout(bundleUrl, {
      headers: { 'User-Agent': 'SEO-Keyword-Research-Bot/1.0', 'Accept': '*/*' },
    }, timeout)
    if (!resp.ok) return ''
    return await resp.text()
  } catch {
    return ''
  }
}

function extractStringsFromBundle(code) {
  if (!code) return []
  // Extract quoted strings that look like readable text (>= 4 chars, not code)
  const strings = []
  const regex = /(?:"([^"]{4,120})"|'([^']{4,120})'|`([^`]{4,120})`)/g
  let match
  while ((match = regex.exec(code)) !== null) {
    const str = match[1] || match[2] || match[3]
    // Filter: must contain letters, mostly printable, not code-like
    if (/[a-zA-Z]/.test(str) && !/^[A-Z_]+$/g.test(str) && !/^(function|const|let|var|import|export|return|if|else|class|extends|default|from|this|new)$/.test(str)) {
      strings.push(str)
    }
  }
  return [...new Set(strings)].slice(0, 200)
}

async function crawlWebsite(url) {
  if (!url) return null
  try {
    const parsed = validateURL(url)
    const baseUrl = `${parsed.protocol}//${parsed.hostname}`
    const pages = []
    const visited = new Set()

    // Fetch homepage first
    const html = await fetchPageHTML(url)
    if (!html) return null
    const data = extractPageData(html, baseUrl)
    pages.push({ url: baseUrl, ...data })
    visited.add(baseUrl)

    // If it's an SPA (no body content, has JS bundles), try to extract text from bundles
    const isSPA = data.bodyText.trim().length < 200 && data.jsBundles.length > 0
    let bundleText = ''
    if (isSPA) {
      console.log('  SPA detected — extracting text from JS bundles...')
      for (const bundle of data.jsBundles) {
        const code = await fetchBundleText(url, bundle)
        bundleText += extractStringsFromBundle(code).join(' ') + ' '
      }
      bundleText = bundleText.substring(0, 8000)
    }

    // Follow internal links (limited)
    const linksToCrawl = data.internalLinks.slice(0, MAX_CRAWL_PAGES - 1)
    for (const link of linksToCrawl) {
      if (pages.length >= MAX_CRAWL_PAGES) break
      const fullUrl = link.startsWith('http') ? link : `${baseUrl}${link}`
      if (visited.has(fullUrl)) continue
      visited.add(fullUrl)

      const pageHtml = await fetchPageHTML(fullUrl)
      if (!pageHtml) continue
      const pageData = extractPageData(pageHtml, baseUrl)
      pages.push({ url: fullUrl, ...pageData })
    }

    // Also try to fetch sitemap.xml and robots.txt for more context
    let sitemapText = ''
    let robotsText = ''
    try {
      const sitemapResp = await fetchWithTimeout(`${baseUrl}/sitemap.xml`, {
        headers: { 'User-Agent': 'SEO-Keyword-Research-Bot/1.0', 'Accept': '*/*' },
      }, 5000)
      if (sitemapResp.ok) sitemapText = (await sitemapResp.text()).substring(0, 5000)
    } catch {}
    try {
      const robotsResp = await fetchWithTimeout(`${baseUrl}/robots.txt`, {
        headers: { 'User-Agent': 'SEO-Keyword-Research-Bot/1.0', 'Accept': '*/*' },
      }, 5000)
      if (robotsResp.ok) robotsText = (await robotsResp.text()).substring(0, 2000)
    } catch {}

    // Summarize crawl results
    const allTitles = pages.map(p => p.title).filter(Boolean)
    const allDescs = pages.map(p => p.metaDesc || p.ogDesc).filter(Boolean)
    const allH1 = pages.flatMap(p => p.headings.h1s)
    const allH2 = pages.flatMap(p => p.headings.h2s)
    const allH3 = pages.flatMap(p => p.headings.h3s)
    const allBody = pages.map(p => p.bodyText).join(' ').substring(0, 5000)
    const allJsonLd = pages.flatMap(p => p.jsonLd || [])

    // Combine all text sources
    const combinedText = [allBody, bundleText, allDescs.join(' '), allH1.join(' '), allH2.join(' '), sitemapText].join(' ').substring(0, 8000)

    // Extract product/service categories from all text
    const productTerms = combinedText.match(/\b(buy|shop|order|price|cost|product|service|plan|subscription|feature|review|best|top|compare|vs|alternative|discount|offer|deal|free|trial|demo|claim|renewal|coordinator|assistance|hospital|cashless|claim|policy|coverage|premium|insur)\w*\b/gi) || []
    const uniqueTerms = [...new Set(productTerms.map(t => t.toLowerCase()))]

    return {
      pagesCrawled: pages.length,
      isSPA,
      titles: allTitles,
      descriptions: allDescs,
      headings: { h1: allH1, h2: allH2, h3: allH3 },
      bodyExcerpt: allBody.substring(0, 4000),
      bundleText: bundleText.substring(0, 4000),
      sitemapUrls: (sitemapText.match(/<loc>([^<]+)<\/loc>/g) || []).slice(0, 10).map(m => m.replace(/<\/?loc>/g, '')),
      jsonLd: allJsonLd,
      productTerms: uniqueTerms.slice(0, 30),
    }
  } catch (err) {
    console.log('Website crawl failed:', err.message)
    return null
  }
}

/* ── AI Prompt ──────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are an expert SEO keyword researcher. You generate comprehensive keyword research data for businesses.

Rules:
- NEVER invent actual search volume numbers. Use "Low", "Medium", "High" as estimated opportunity only.
- NEVER claim Google rankings or difficulty scores. Call it "Opportunity Score" (0-100 internal estimate).
- NEVER guarantee rankings or traffic.
- NEVER recommend keyword stuffing.
- Focus on search intent, business relevance, and content strategy.
- Provide realistic, actionable keyword suggestions.
- Classify intent accurately based on the query.
- Group keywords into meaningful topic clusters.
- Return ONLY valid JSON, no markdown, no code fences.
- Do NOT include <think> tags or reasoning in your output. Output ONLY the JSON directly.
- Do NOT wrap the JSON in code fences. Just output the raw JSON object.`

function buildUserPrompt(input, crawlData) {
  const bizContext = {
    'B2B': 'This is a B2B business. Keywords should target business buyers, decision-makers, and procurement.',
    'B2C': 'This is a B2C business. Keywords should target individual consumers.',
    'E-commerce': 'This is an e-commerce/store selling products. Generate product-focused keywords: buy, price, best, review, comparison, vs, alternative, discount, online. Focus on transactional and commercial intent.',
    'SaaS': 'This is a SaaS/software business. Keywords should target software features, pricing, integrations, alternatives, demos.',
    'Agency': 'This is an agency/service business. Keywords should target services, providers, consultants, pricing.',
    'Local Business': 'This is a local business. Generate location-based keywords.',
    'Publisher': 'This is a publisher/media business. Generate content-focused keywords: guide, how to, tips.',
    'Enterprise': 'This is an enterprise business. Keywords should target enterprise solutions and managed services.',
  }

  let websiteSection = ''
  if (crawlData) {
    const bundleExcerpt = crawlData.bundleText ? crawlData.bundleText.substring(0, 500) : ''
    const spaNote = crawlData.isSPA ? ' (SPA — content from meta tags + JS bundle)' : ''
    websiteSection = `
## Website Context${spaNote}
Titles: ${crawlData.titles.join(' | ')}
Descriptions: ${crawlData.descriptions.join(' | ')}
H1: ${crawlData.headings.h1.join(', ')}
H2: ${crawlData.headings.h2.slice(0, 8).join(', ')}
Terms: ${crawlData.productTerms.join(', ')}${bundleExcerpt ? `\nJS text: ${bundleExcerpt}` : ''}

Use the above to generate keywords that match what this business ACTUALLY sells/offers.`
  }

  return `Generate keyword research for a ${input.businessType || 'General'} business.

Seed: ${input.seedKeyword} | Country: ${input.country || 'Global'} | Type: ${input.businessType || 'General'}
${bizContext[input.businessType] || ''}
${websiteSection}

Rules: Keywords must match what the website ACTUALLY offers. 20-40 diverse keywords. Include: primary, long-tail, question, commercial, transactional, comparison types.

For each keyword: keyword, intent (Informational|Commercial|Transactional|Comparison), type, opportunityScore (0-100), businessRelevance (0-100), reason.

Also: 3 topic clusters, 5 content opportunities, 3 quick wins, 3 recommendations.

Return JSON:
{"seedKeyword":"","summary":"","keywords":[{"keyword":"","intent":"","type":"","opportunityScore":0,"businessRelevance":0,"reason":""}],"longTailKeywords":[],"questionKeywords":[],"topicClusters":[{"topic":"","keywords":[],"contentIdeas":[]}],"contentOpportunities":[{"title":"","primaryKeyword":"","intent":"","contentType":"","reason":""}],"recommendations":[],"quickWins":[]}`
}

/* ── Validation & Fallback ──────────────────────────────────────── */

function validateReport(data, seedKeyword) {
  return {
    seedKeyword: data.seedKeyword || seedKeyword,
    summary: typeof data.summary === 'string' ? data.summary : `Keyword research for "${seedKeyword}".`,
    keywords: Array.isArray(data.keywords) ? data.keywords.map(k => ({
      keyword: k.keyword || '',
      intent: k.intent || 'Informational',
      type: k.type || 'informational',
      opportunityScore: Math.min(100, Math.max(0, k.opportunityScore || 50)),
      businessRelevance: Math.min(100, Math.max(0, k.businessRelevance || 50)),
      reason: k.reason || '',
    })) : [],
    longTailKeywords: Array.isArray(data.longTailKeywords) ? data.longTailKeywords : [],
    questionKeywords: Array.isArray(data.questionKeywords) ? data.questionKeywords : [],
    commercialKeywords: Array.isArray(data.commercialKeywords) ? data.commercialKeywords : [],
    informationalKeywords: Array.isArray(data.informationalKeywords) ? data.informationalKeywords : [],
    topicClusters: Array.isArray(data.topicClusters) ? data.topicClusters : [],
    contentOpportunities: Array.isArray(data.contentOpportunities) ? data.contentOpportunities : [],
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    quickWins: Array.isArray(data.quickWins) ? data.quickWins : [],
  }
}

function generateFallbackReport(input, crawlData) {
  const kw = input.seedKeyword
  const kwLower = kw.toLowerCase()
  const biz = input.businessType || 'General'

  // Use crawl data to generate context-aware keywords
  const siteTerms = crawlData ? [
    ...crawlData.headings.h1,
    ...crawlData.headings.h2,
    ...crawlData.productTerms,
  ].filter(Boolean) : []

  // Extract meaningful phrases from website — try headings first, then bundle text
  let sitePhrases = crawlData
    ? crawlData.headings.h2.slice(0, 8).map(h => h.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()).filter(h => h.length > 2)
    : []

  // For SPAs with no headings, extract phrases from bundle text + meta descriptions
  if (sitePhrases.length === 0 && crawlData) {
    const allText = [crawlData.bodyExcerpt, crawlData.bundleText || '', crawlData.descriptions.join(' ')].join(' ')
    // Extract 2-5 word phrases that look like services/products
    const phrases = allText.match(/\b[a-z]+(?:\s+[a-z]+){1,4}\b/gi) || []
    const stopWords = new Set(['the','and','for','with','that','this','you','our','we','not','are','can','will','has','have','been','but','from','they','also','any','all','one','its','may','use','get','how','why','who','what','when','where','which','than','them','then','into','over','just','more','than','some','very','much','also','each','both','few','own','same','such','only','now','other','most','here','well','too','would','could','should','about','your','them','they','then','than','these','those','more','most','such'])
    const meaningful = phrases.filter(p => {
      const lower = p.toLowerCase()
      const words = lower.split(/\s+/).filter(w => w.length > 1)
      if (words.length < 2 || words.length > 4) return false
      if (lower.length < 6 || lower.length > 35) return false
      // Filter out phrases that are mostly stop words
      const contentWords = words.filter(w => !stopWords.has(w))
      if (contentWords.length < 1) return false
      // Filter out code-like phrases
      if (/^(\d+|http|www|com|html|div|span|class|script|style|font|color|width|height|margin|padding|border|display|position|flex|grid|module|export|import|return|function|const|let|var)/.test(lower)) return false
      return true
    })
    // Score by relevance to seed keyword
    const scored = meaningful.map(p => ({
      phrase: p.toLowerCase().trim(),
      score: p.toLowerCase().includes(kwLower) ? 10 : (kwLower.includes(p.split(' ')[0]) ? 5 : 1),
    })).sort((a, b) => b.score - a.score)
    sitePhrases = [...new Set(scored.map(s => s.phrase))].slice(0, 10)
    // Also add product terms as single-word anchors
    if (crawlData.productTerms?.length) {
      sitePhrases.push(...crawlData.productTerms.slice(0, 5))
    }
  }

  // Generate keywords from actual site content when available
  const siteKeywords = []
  if (crawlData && sitePhrases.length > 0) {
    for (const phrase of sitePhrases.slice(0, 8)) {
      if (phrase.includes(kwLower) || kwLower.includes(phrase.split(' ')[0])) {
        siteKeywords.push({
          keyword: phrase,
          intent: 'Commercial',
          type: 'primary',
          opportunityScore: 88,
          businessRelevance: 95,
          reason: `Directly matches website content "${phrase}".`,
        })
      }
    }
    // Add site-specific product/service keywords
    for (const term of crawlData.productTerms.slice(0, 12)) {
      // Skip terms that are too short, duplicate of seed, or not meaningful modifiers
      if (term.length < 4 || kwLower.includes(term) || term.includes(kwLower)) continue
      if (['insur','product','production','feature','module','component','style','color','width','height','margin','padding','font'].some(skip => term.startsWith(skip) || term === skip)) continue
      if (!siteKeywords.find(k => k.keyword.includes(term))) {
        const intent = ['buy', 'order', 'shop', 'claim', 'renew', 'cashless', 'hospital'].some(t => term.includes(t)) ? 'Transactional' : 'Commercial'
        siteKeywords.push({
          keyword: `${kwLower} ${term}`,
          intent,
          type: 'commercial',
          opportunityScore: 82,
          businessRelevance: 90,
          reason: `Matches a product/service term found on the website.`,
        })
      }
    }
  }

  // Business-type-specific keywords
  const bizKeywords = {
    'E-commerce': [
      { keyword: `buy ${kwLower} online`, intent: 'Transactional', type: 'transactional', opportunityScore: 88, businessRelevance: 95, reason: 'Direct purchase intent.' },
      { keyword: `best ${kwLower}`, intent: 'Commercial', type: 'commercial', opportunityScore: 90, businessRelevance: 92, reason: 'High-intent comparison shopping query.' },
      { keyword: `${kwLower} price`, intent: 'Commercial', type: 'commercial', opportunityScore: 86, businessRelevance: 90, reason: 'Budget research from potential buyers.' },
      { keyword: `${kwLower} online`, intent: 'Transactional', type: 'transactional', opportunityScore: 85, businessRelevance: 88, reason: 'Online purchase intent.' },
      { keyword: `cheap ${kwLower}`, intent: 'Transactional', type: 'transactional', opportunityScore: 78, businessRelevance: 80, reason: 'Price-sensitive buyers.' },
      { keyword: `${kwLower} for sale`, intent: 'Transactional', type: 'transactional', opportunityScore: 82, businessRelevance: 85, reason: 'Direct buying intent.' },
      { keyword: `top 10 ${kwLower}`, intent: 'Commercial', type: 'commercial', opportunityScore: 80, businessRelevance: 78, reason: 'Comparison shopping query.' },
      { keyword: `${kwLower} review`, intent: 'Commercial', type: 'commercial', opportunityScore: 77, businessRelevance: 75, reason: 'Pre-purchase research.' },
      { keyword: `${kwLower} brands`, intent: 'Commercial', type: 'commercial', opportunityScore: 76, businessRelevance: 78, reason: 'Brand comparison shopping.' },
      { keyword: `${kwLower} discount`, intent: 'Transactional', type: 'transactional', opportunityScore: 74, businessRelevance: 82, reason: 'Deal-seeking buyers.' },
    ],
    'Agency': [
      { keyword: `${kw} agency`, intent: 'Commercial', type: 'commercial', opportunityScore: 91, businessRelevance: 95, reason: 'Strong agency-seeking intent.' },
      { keyword: `${kw} services`, intent: 'Commercial', type: 'commercial', opportunityScore: 89, businessRelevance: 92, reason: 'Service provider search.' },
      { keyword: `best ${kwLower} agency`, intent: 'Commercial', type: 'commercial', opportunityScore: 88, businessRelevance: 90, reason: 'Provider selection query.' },
      { keyword: `${kw} consultant`, intent: 'Commercial', type: 'commercial', opportunityScore: 82, businessRelevance: 87, reason: 'Consulting service intent.' },
      { keyword: `${kw} pricing`, intent: 'Commercial', type: 'commercial', opportunityScore: 84, businessRelevance: 85, reason: 'Budget evaluation.' },
    ],
    'B2B': [
      { keyword: `${kw} solution`, intent: 'Commercial', type: 'commercial', opportunityScore: 85, businessRelevance: 90, reason: 'B2B solution seeking.' },
      { keyword: `${kw} platform`, intent: 'Commercial', type: 'commercial', opportunityScore: 83, businessRelevance: 88, reason: 'Platform evaluation.' },
      { keyword: `enterprise ${kwLower}`, intent: 'Commercial', type: 'commercial', opportunityScore: 80, businessRelevance: 85, reason: 'Enterprise-level interest.' },
      { keyword: `${kw} provider`, intent: 'Commercial', type: 'commercial', opportunityScore: 82, businessRelevance: 87, reason: 'Provider selection.' },
    ],
    'SaaS': [
      { keyword: `${kw} software`, intent: 'Commercial', type: 'commercial', opportunityScore: 86, businessRelevance: 90, reason: 'Software evaluation.' },
      { keyword: `${kw} tool`, intent: 'Commercial', type: 'commercial', opportunityScore: 84, businessRelevance: 88, reason: 'Tool comparison.' },
      { keyword: `${kw} alternative`, intent: 'Comparison', type: 'comparison', opportunityScore: 82, businessRelevance: 85, reason: 'Competitor comparison.' },
      { keyword: `free ${kwLower}`, intent: 'Transactional', type: 'transactional', opportunityScore: 80, businessRelevance: 82, reason: 'Free trial seekers.' },
      { keyword: `${kw} demo`, intent: 'Transactional', type: 'transactional', opportunityScore: 78, businessRelevance: 85, reason: 'Demo request intent.' },
    ],
  }

  const specificKeywords = bizKeywords[biz] || [
    { keyword: `${kw} services`, intent: 'Commercial', type: 'commercial', opportunityScore: 85, businessRelevance: 85, reason: 'Service-related search.' },
    { keyword: `best ${kwLower}`, intent: 'Commercial', type: 'commercial', opportunityScore: 88, businessRelevance: 88, reason: 'Top provider/product search.' },
    { keyword: `${kw} price`, intent: 'Commercial', type: 'commercial', opportunityScore: 82, businessRelevance: 80, reason: 'Price research.' },
  ]

  const commonKeywords = [
    { keyword: kw, intent: 'Informational', type: 'primary', opportunityScore: 72, businessRelevance: 85, reason: 'Core seed keyword.' },
    { keyword: `what is ${kwLower}`, intent: 'Informational', type: 'question', opportunityScore: 68, businessRelevance: 72, reason: 'Awareness-stage question.' },
    { keyword: `how much does ${kwLower} cost`, intent: 'Commercial', type: 'question', opportunityScore: 80, businessRelevance: 85, reason: 'Budget question from buyers.' },
    { keyword: `${kw} for beginners`, intent: 'Informational', type: 'informational', opportunityScore: 65, businessRelevance: 70, reason: 'Educational content opportunity.' },
    { keyword: `${kw} vs alternatives`, intent: 'Comparison', type: 'comparison', opportunityScore: 75, businessRelevance: 78, reason: 'Comparison shopping.' },
    { keyword: `${kw} reviews`, intent: 'Commercial', type: 'commercial', opportunityScore: 77, businessRelevance: 75, reason: 'Pre-purchase research.' },
    { keyword: `best ${kwLower} for [use case]`, intent: 'Commercial', type: 'long-tail', opportunityScore: 79, businessRelevance: 80, reason: 'Specific use case search.' },
    { keyword: `${kw} guide`, intent: 'Informational', type: 'informational', opportunityScore: 70, businessRelevance: 72, reason: 'Educational guide opportunity.' },
  ]

  // Merge: site-specific first, then business-type, then common
  const allKeywords = [...siteKeywords, ...specificKeywords, ...commonKeywords]
  const keywords = allKeywords.map((k, i) => ({
    ...k,
    opportunityScore: Math.min(95, Math.max(50, k.opportunityScore + Math.floor(Math.random() * 5 - 2))),
  }))

  const longTailPrefixes = ['best', 'top', 'how to choose', 'where to buy', 'reviews of', 'comparison of']
  const longTailKeywords = longTailPrefixes.map(p => `${p} ${kwLower}`).slice(0, 6)

  const questionKeywords = [
    `What is ${kwLower}?`,
    `How much does ${kwLower} cost?`,
    `How to choose ${kwLower}?`,
    `Where to buy ${kwLower} online?`,
    `What are the best ${kwLower}?`,
    `Are ${kwLower} worth it?`,
  ]

  // Build topic clusters from actual website headings when available
  const topicClusters = crawlData && sitePhrases.length > 0
    ? sitePhrases.slice(0, 4).map(phrase => ({
        topic: phrase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        keywords: [`${phrase} ${kwLower}`, `best ${phrase}`, `${phrase} guide`],
        contentIdeas: [`${phrase.charAt(0).toUpperCase() + phrase.slice(1)} — Complete Guide`, `How to Choose the Right ${phrase.charAt(0).toUpperCase() + phrase.slice(1)}`],
      }))
    : [
        { topic: `${kw} Basics`, keywords: [`what is ${kwLower}`, `${kw} guide`, `${kw} for beginners`], contentIdeas: [`${kw}: Complete Guide`, `Understanding ${kw} in 2026`] },
        { topic: `${kw} Selection`, keywords: [`best ${kwLower}`, `${kw} reviews`, `${kw} comparison`], contentIdeas: [`How to Choose the Best ${kw}`, `${kw}: Top Options Compared`] },
        { topic: `${kw} Buying`, keywords: [`buy ${kwLower} online`, `${kw} price`, `${kw} deals`], contentIdeas: [`${kw} Buying Guide: Price & Value`, `Where to Buy ${kw} Online`] },
      ]

  const summary = crawlData
    ? `Found ${keywords.length} keyword opportunities for "${kw}" (${biz} business). Analyzed ${crawlData.pagesCrawled} pages from ${input.websiteUrl || 'the website'} to identify relevant keywords based on actual site content.`
    : `Found ${keywords.length} keyword opportunities for "${kw}" (${biz} business). The landscape includes commercial, informational, and transactional keyword opportunities.`

  return {
    seedKeyword: kw,
    summary,
    keywords: keywords.slice(0, 25),
    longTailKeywords,
    questionKeywords,
    commercialKeywords: specificKeywords.filter(k => k.intent === 'Commercial' || k.intent === 'Transactional').map(k => k.keyword),
    informationalKeywords: commonKeywords.filter(k => k.intent === 'Informational').map(k => k.keyword),
    topicClusters,
    contentOpportunities: [
      { title: `${kw}: Complete Guide for 2026`, primaryKeyword: kw, intent: 'Informational', contentType: 'Long-form guide', reason: 'Core educational resource.' },
      { title: `Best ${kw} — Top Options Compared`, primaryKeyword: `best ${kwLower}`, intent: 'Commercial', contentType: 'Comparison article', reason: 'High-intent comparison content.' },
      { title: `${kw} Buying Guide: Price, Features & Reviews`, primaryKeyword: `${kw} review`, intent: 'Commercial', contentType: 'Buyer guide', reason: 'Pre-purchase decision content.' },
    ],
    recommendations: [
      'Focus on transactional keywords for direct conversions',
      'Create comparison/buying guides for commercial keywords',
      'Build product category pages for broad keywords',
      'Add FAQ sections targeting question keywords',
    ],
    quickWins: [
      `Create a "Best ${kw}" comparison page — high buyer intent`,
      `Add a FAQ section answering common ${kwLower} questions`,
      `Optimize product pages for transactional keywords`,
    ],
  }
}

/* ── Main Research Function ─────────────────────────────────────── */

export async function researchKeywords(input) {
  // Step 1: Crawl the website for context
  let crawlData = null
  if (input.websiteUrl) {
    console.log(`Crawling website: ${input.websiteUrl}`)
    crawlData = await crawlWebsite(input.websiteUrl)
    if (crawlData) {
      console.log(`✓ Crawled ${crawlData.pagesCrawled} pages — found ${crawlData.productTerms.length} product terms, ${crawlData.headings.h2.length} H2 headings`)
    } else {
      console.log('Website crawl failed or returned no data')
    }
  }

  // If no seed keyword provided, extract topic from website
  if (!input.seedKeyword && crawlData) {
    const title = crawlData.titles.find(t => t && t.length > 3) || ''
    const metaDesc = crawlData.descriptions.find(d => d && d.length > 3) || ''
    const h1 = crawlData.headings.h1.find(h => h && h.length > 3) || ''
    // Use the most meaningful text as seed keyword
    const source = h1 || title || metaDesc || crawlData.productTerms[0] || ''
    // Take first 3-4 meaningful words
    const words = source.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2).slice(0, 4)
    input.seedKeyword = words.join(' ') || 'website'
    console.log(`No seed keyword provided — extracted from website: "${input.seedKeyword}"`)
  }

  // Step 2: Try AI if any provider is configured
  const providers = getConfiguredProviders()
  if (providers.length === 0) {
    console.log('No AI providers configured — using fallback keyword report with website context')
    return generateFallbackReport(input, crawlData)
  }

  console.log(`Available AI providers: ${providers.map(p => `${p.name} (${p.model})`).join(', ')}`)

  try {
    const parsed = await callAIAndParseJSON([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(input, crawlData) },
    ], { temperature: 0.4, maxTokens: 8000, jsonMode: true, preferredProvider: input.preferredProvider })

    console.log(`✓ AI keyword research complete — ${parsed.keywords?.length || 0} keywords generated`)
    return validateReport(parsed, input.seedKeyword)
  } catch (err) {
    console.error(`AI keyword research failed: ${err.message}`)
    console.log('Falling back to website-context-aware report')
    return generateFallbackReport(input, crawlData)
  }
}

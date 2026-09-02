import { callAIAndParseJSON } from '../utils/aiProvider.js'

/**
 * Safely fetch HTML with timeout
 */
async function fetchHTML(url, timeoutMs = 12000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    const response = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    clearTimeout(timer)
    if (!response.ok) return null
    return await response.text()
  } catch (e) {
    clearTimeout(timer)
    return null
  }
}

/**
 * Extract comprehensive SEO metrics from HTML
 */
function extractSEOData(html, url) {
  if (!html) {
    return {
      url,
      title: 'Could not fetch page',
      metaDescription: '',
      metaKeywords: '',
      h1s: [],
      h2s: [],
      h3s: [],
      stats: {
        internalLinks: 0,
        externalLinks: 0,
        totalImages: 0,
        imagesWithAlt: 0,
        imagesWithoutAlt: 0,
        wordCount: 0,
        canonical: null,
        hasOGTags: false,
        hasSchema: false,
        hasTwitterCard: false,
        contentDepthScore: 40,
        technicalScore: 40,
        overallBenchmark: 40,
      },
    }
  }

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''

  // Meta Description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
  const metaDescription = descMatch ? descMatch[1].trim() : ''

  // Meta Keywords
  const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)
  const metaKeywords = keywordsMatch ? keywordsMatch[1].trim() : ''

  // Headings
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || []
  const h1s = h1Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean)

  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || []
  const h2s = h2Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 15)

  const h3Matches = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || []
  const h3s = h3Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 15)

  // Links
  const internalLinks = (html.match(/href=["']\/[^"'#]/g) || []).length
  const externalLinks = (html.match(/href=["']https?:\/\/[^"']+/g) || []).length

  // Images & Alt text
  const imgMatches = html.match(/<img[^>]+>/gi) || []
  const imagesWithAlt = imgMatches.filter(img => /alt=["'][^"'\s]+["']/i.test(img)).length
  const totalImages = imgMatches.length

  // Social & Meta
  const hasOGTags = /property=["']og:/i.test(html)
  const hasTwitterCard = /name=["']twitter:/i.test(html)
  const hasSchema = /application\/ld\+json/i.test(html)
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
  const canonical = canonicalMatch ? canonicalMatch[1] : null

  // Word count estimate (stripped text)
  const textContent = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length

  // Deterministic Benchmark Scores (0-100)
  let contentDepthScore = Math.min(100, Math.round(
    (wordCount >= 1500 ? 50 : (wordCount / 1500) * 50) +
    (h2s.length >= 5 ? 25 : (h2s.length / 5) * 25) +
    (internalLinks >= 10 ? 25 : (internalLinks / 10) * 25)
  ))

  let technicalScore = Math.min(100, Math.round(
    (title && title.length >= 30 && title.length <= 65 ? 25 : 12) +
    (metaDescription && metaDescription.length >= 100 && metaDescription.length <= 165 ? 25 : 10) +
    (canonical ? 15 : 0) +
    (hasOGTags ? 15 : 0) +
    (hasSchema ? 10 : 0) +
    (totalImages === 0 || imagesWithAlt / (totalImages || 1) >= 0.8 ? 10 : 5)
  ))

  let overallBenchmark = Math.round((contentDepthScore * 0.55) + (technicalScore * 0.45))

  return {
    url,
    title,
    metaDescription,
    metaKeywords,
    h1s,
    h2s,
    h3s,
    stats: {
      internalLinks,
      externalLinks,
      totalImages,
      imagesWithAlt,
      imagesWithoutAlt: Math.max(0, totalImages - imagesWithAlt),
      wordCount,
      canonical,
      hasOGTags,
      hasTwitterCard,
      hasSchema,
      contentDepthScore,
      technicalScore,
      overallBenchmark,
    },
  }
}

/**
 * Analyze competitor website and generate 10x outranking strategy
 */
export async function analyzeCompetitor({ competitorUrl, yourUrl, targetKeywords, preferredProvider }) {
  try {
    // 1. Fetch competitor HTML
    const competitorHtml = await fetchHTML(competitorUrl)
    const competitorSeo = extractSEOData(competitorHtml, competitorUrl)

    // 2. Fetch your HTML if provided
    let yourSeo = null
    if (yourUrl && yourUrl.trim()) {
      const yourHtml = await fetchHTML(yourUrl)
      if (yourHtml) {
        yourSeo = extractSEOData(yourHtml, yourUrl)
      }
    }

    // 3. Generate AI Strategic Intelligence
    const insights = await generateStrategicInsights({
      competitorUrl,
      competitorSeo,
      yourUrl,
      yourSeo,
      targetKeywords,
      preferredProvider,
    })

    return {
      success: true,
      competitorUrl,
      yourUrl: yourUrl || null,
      targetKeywords: targetKeywords || null,
      competitorSeo,
      yourSeo,
      ...insights,
    }
  } catch (error) {
    console.error('Competitor analysis error:', error.message)
    return generateFallbackAnalysis(competitorUrl, yourUrl, targetKeywords)
  }
}

async function generateStrategicInsights({ competitorUrl, competitorSeo, yourUrl, yourSeo, targetKeywords, preferredProvider }) {
  const keywordText = targetKeywords ? `Target keywords to capture: ${targetKeywords}` : ''
  const yourContext = yourSeo
    ? `\n\nYour Site SEO Data (${yourUrl}):\n- Title: ${yourSeo.title}\n- Word Count: ${yourSeo.stats.wordCount}\n- H1: ${yourSeo.h1s.join(' | ')}\n- H2s (${yourSeo.h2s.length}): ${yourSeo.h2s.slice(0, 6).join(' | ')}\n- Benchmark Score: ${yourSeo.stats.overallBenchmark}/100`
    : '\n(Your site was not provided; compare against top 1% industry search benchmarks).'

  const systemMessage = `You are a legendary SEO strategist and competitive intelligence analyst.
Your job is to reverse-engineer competitor content, uncover exploitable content gaps, detect semantic weaknesses, and build a "10x Outrank Playbook" with clear information gain angles.

Rules:
- Be brutally specific and actionable.
- Don't give generic fluff (avoid "add keywords" or "write better content"). Provide concrete topics, angles, and formats.
- Return ONLY valid JSON, no markdown outside JSON.`

  const userMessage = `Competitor URL: ${competitorUrl}
Competitor SEO Data:
- Title: ${competitorSeo.title}
- Meta Description: ${competitorSeo.metaDescription}
- H1 Tags: ${competitorSeo.h1s.join(' | ') || 'None found'}
- H2 Tags (${competitorSeo.h2s.length}): ${competitorSeo.h2s.slice(0, 10).join(' | ') || 'None'}
- Word Count: ${competitorSeo.stats.wordCount} words
- Internal Links: ${competitorSeo.stats.internalLinks} | External Links: ${competitorSeo.stats.externalLinks}
- Images: ${competitorSeo.stats.totalImages} (${competitorSeo.stats.imagesWithAlt} with alt)
- Schema Markup Present: ${competitorSeo.stats.hasSchema}
- OpenGraph Tags: ${competitorSeo.stats.hasOGTags}
${keywordText}
${yourContext}

Return a JSON object with this EXACT structure:
{
  "executiveSummary": "2-3 sentences evaluating the competitor's biggest organic strength and their primary vulnerability you can exploit.",
  "competitorMoat": [
    "Key advantage 1 they currently have",
    "Key advantage 2 they currently have"
  ],
  "competitorVulnerabilities": [
    "Specific weakness 1 in their content or structure",
    "Specific weakness 2 in their content or structure"
  ],
  "outrankPlaybook": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "action": "Concrete action to take",
      "impact": "Very High|High|Medium",
      "effort": "Low|Medium|High",
      "why": "Why this specific move wins search rankings"
    }
  ],
  "contentGaps": [
    {
      "topic": "Specific subtopic or angle missing from competitor",
      "searchIntent": "informational|commercial|transactional",
      "whyImportant": "Why searchers need this",
      "suggestedAngle": "How to write this with 10x Information Gain (e.g. data chart, step-by-step checklist, comparison table)"
    }
  ],
  "keywordOpportunities": [
    {
      "keyword": "High potential keyword",
      "intent": "informational|commercial|transactional",
      "difficulty": "Easy|Medium|Hard",
      "opportunity": "How to target and capture this search query",
      "priority": "High|Medium"
    }
  ],
  "backlinkAngles": [
    {
      "angle": "Linkable asset idea (e.g. original industry study, calculator, cheatsheet)",
      "targetOutreach": "Who will link to this (e.g. industry bloggers, resource pages)"
    }
  ],
  "featuredSnippetSnatch": {
    "targetQuery": "Target query they rank for but have a weak snippet",
    "recommendedFormat": "direct_definition|bullet_list|comparison_table",
    "draftSnippet": "A 45-60 word optimized snippet to snatch position 0"
  }
}`

  try {
    const parsed = await callAIAndParseJSON([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ], { preferredProvider, temperature: 0.4, maxTokens: 5000 })

    return {
      executiveSummary: parsed.executiveSummary || 'Competitor analysis completed.',
      competitorMoat: Array.isArray(parsed.competitorMoat) ? parsed.competitorMoat : [],
      competitorVulnerabilities: Array.isArray(parsed.competitorVulnerabilities) ? parsed.competitorVulnerabilities : [],
      outrankPlaybook: Array.isArray(parsed.outrankPlaybook) ? parsed.outrankPlaybook : [],
      contentGaps: Array.isArray(parsed.contentGaps) ? parsed.contentGaps : [],
      keywordOpportunities: Array.isArray(parsed.keywordOpportunities) ? parsed.keywordOpportunities : [],
      backlinkAngles: Array.isArray(parsed.backlinkAngles) ? parsed.backlinkAngles : [],
      featuredSnippetSnatch: parsed.featuredSnippetSnatch || null,
    }
  } catch (err) {
    console.error('AI Strategic Insights generation error:', err.message)
    return generateFallbackInsights(competitorSeo, yourSeo, targetKeywords)
  }
}

function generateFallbackInsights(competitorSeo, yourSeo, targetKeywords) {
  const keywords = targetKeywords ? targetKeywords.split(',').map(k => k.trim()).filter(Boolean) : []
  const primaryKeyword = keywords[0] || (competitorSeo.h1s[0] || 'your core niche')

  return {
    executiveSummary: `The competitor has established baseline SEO structure with ${competitorSeo.stats.wordCount} words and ${competitorSeo.h2s.length} content sections. However, their content lacks comprehensive interactive formats, structured data schema, and deeper sub-topic coverage that you can exploit to outrank them.`,
    competitorMoat: [
      competitorSeo.title ? `Established indexed title: "${competitorSeo.title}"` : 'Basic site indexation',
      competitorSeo.stats.internalLinks > 5 ? `Active internal linking structure with ${competitorSeo.stats.internalLinks} internal links` : 'Established domain presence',
    ],
    competitorVulnerabilities: [
      competitorSeo.stats.wordCount < 1200 ? 'Thin content depth (under 1,200 words) allowing for a superior comprehensive guide' : 'Superficial content coverage on advanced user questions',
      !competitorSeo.stats.hasSchema ? 'Missing Schema.org structured data markup' : 'Missing rich FAQ / How-To rich snippets',
      competitorSeo.stats.imagesWithoutAlt > 0 ? `${competitorSeo.stats.imagesWithoutAlt} images missing descriptive alt tags` : 'Limited visual data assets',
    ],
    outrankPlaybook: [
      {
        priority: 'HIGH',
        action: `Publish a 2,000+ word comprehensive guide targeting "${primaryKeyword}" with actionable step-by-step frameworks.`,
        impact: 'Very High',
        effort: 'Medium',
        why: 'Google rewards comprehensive information gain over thin overview articles.',
      },
      {
        priority: 'HIGH',
        action: 'Add structured JSON-LD FAQPage and Article Schema markup to your page.',
        impact: 'High',
        effort: 'Low',
        why: 'Enables rich snippets and increases SERP real estate over the competitor.',
      },
      {
        priority: 'MEDIUM',
        action: 'Incorporate original charts, comparison tables, and visual workflows.',
        impact: 'High',
        effort: 'Medium',
        why: 'Increases dwell time and naturally attracts editorial backlinks.',
      },
      {
        priority: 'MEDIUM',
        action: 'Build contextual internal links from your top 5 highest-authority blog posts.',
        impact: 'High',
        effort: 'Low',
        why: 'Flows PageRank and topical authority directly to your ranking target.',
      },
    ],
    contentGaps: [
      {
        topic: `Real-World Case Studies & Performance Benchmarks in ${primaryKeyword}`,
        searchIntent: 'commercial',
        whyImportant: 'Buyers want proof and quantifiable data before deciding.',
        suggestedAngle: 'Include 3 concrete examples with before/after metrics and timeline breakdowns.',
      },
      {
        topic: `Common Pitfalls and How to Avoid Them`,
        searchIntent: 'informational',
        whyImportant: 'Competitor only discusses theory; practical problem-solving wins user trust.',
        suggestedAngle: 'A structured troubleshooting section with exact corrective actions.',
      },
      {
        topic: `Cost Breakdown & Pricing Comparison Table`,
        searchIntent: 'transactional',
        whyImportant: 'High-intent searchers actively compare solutions.',
        suggestedAngle: 'A side-by-side comparison matrix covering features, cost tiers, and ROI.',
      },
    ],
    keywordOpportunities: [
      {
        keyword: `${primaryKeyword} guide`,
        intent: 'informational',
        difficulty: 'Medium',
        opportunity: 'Create a pillar page covering all fundamental aspects.',
        priority: 'High',
      },
      {
        keyword: `best ${primaryKeyword} tools`,
        intent: 'commercial',
        difficulty: 'Medium',
        opportunity: 'Publish an unbiased curated comparison list with pros and cons.',
        priority: 'High',
      },
      {
        keyword: `${primaryKeyword} checklist`,
        intent: 'informational',
        difficulty: 'Easy',
        opportunity: 'Offer a downloadable PDF / interactive checklist.',
        priority: 'Medium',
      },
    ],
    backlinkAngles: [
      {
        angle: `Definitive Industry Statistics & Trends Report for ${primaryKeyword}`,
        targetOutreach: 'Industry publishers, newsletter curators, and roundups.',
      },
      {
        angle: 'Interactive ROI / Cost Calculator Tool',
        targetOutreach: 'Resource pages and agency guides.',
      },
    ],
    featuredSnippetSnatch: {
      targetQuery: `What is the most effective approach to ${primaryKeyword}?`,
      recommendedFormat: 'numbered_steps',
      draftSnippet: `The most effective approach to ${primaryKeyword} involves 4 steps: (1) Conduct an in-depth baseline audit, (2) Define clear KPIs and conversion targets, (3) Implement standardized workflows, and (4) Continuously measure ROI through iterative testing.`,
    },
  }
}

function generateFallbackAnalysis(competitorUrl, yourUrl, targetKeywords) {
  const competitorSeo = extractSEOData(null, competitorUrl)
  const insights = generateFallbackInsights(competitorSeo, null, targetKeywords)
  return {
    success: true,
    competitorUrl,
    yourUrl: yourUrl || null,
    targetKeywords: targetKeywords || null,
    competitorSeo,
    yourSeo: null,
    ...insights,
  }
}

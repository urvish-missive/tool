/**
 * AI Search & GEO (Generative Engine Optimization) Analyzer Service
 * Computes heuristic metrics & multi-provider AI evaluations for LLM search engines.
 */

import * as cheerio from 'cheerio'
import { callAIAndParseJSON } from '../utils/aiProvider.js'
import { fetchWithTimeout, validateURL, resolveAndValidate } from '../utils/helpers.js'

const SYSTEM_PROMPT = `You are a world-class Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO) specialist.
You evaluate digital content for visibility, quoteability, and citation readiness in AI search engines including Google AI Overviews, Perplexity.ai, ChatGPT Search, and Claude.

Evaluation Principles:
- AI search engines favor direct answers, high factual/data density, original research, named entities, and clear structured hierarchy.
- Fluff, repetitive filler, ambiguous definitions, and unbacked claims drastically lower AI citation probability.
- Return ONLY a valid JSON object matching the requested schema. Do not include markdown code fences, think tags, or conversational text.`

/**
 * Fetch and extract clean content, headings, stats, and schema from a URL
 */
export async function fetchUrlForGeoAnalysis(rawUrl) {
  const parsed = validateURL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
  await resolveAndValidate(parsed.hostname)

  const targetUrl = parsed.toString()
  const response = await fetchWithTimeout(
    targetUrl,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MissiveGEOAnalyzer/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    },
    20000
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch URL (${response.status} ${response.statusText})`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // Extract metadata
  const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || ''
  const metaDescription =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    ''
  const author =
    $('meta[name="author"]').attr('content') ||
    $('[rel="author"]').text().trim() ||
    $('.author, .byline, [itemprop="author"]').first().text().trim() ||
    ''
  const canonical = $('link[rel="canonical"]').attr('href') || ''

  // Extract JSON-LD schemas
  const jsonLdSchemas = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsedSchema = JSON.parse($(el).html() || '{}')
      jsonLdSchemas.push(parsedSchema)
    } catch {}
  })

  // Extract headings
  const headings = []
  $('h1, h2, h3').each((_, el) => {
    const tag = el.tagName.toLowerCase()
    const text = $(el).text().trim()
    if (text) {
      headings.push({ tag, text })
    }
  })

  // Extract tables & lists
  const tableCount = $('table').length
  const listCount = $('ul, ol').length
  const blockquoteCount = $('blockquote').length

  // Remove unwanted elements for body text extraction
  $('script, style, noscript, nav, header, footer, svg, iframe, form, select, button, .ad, .ads, .sidebar, .cookie-banner, .menu').remove()

  // Get main content text
  let bodyText = $('article, main, .content, #content, .post-content, .entry-content').text().trim()
  if (!bodyText || bodyText.length < 200) {
    bodyText = $('body').text().trim()
  }
  // Normalize whitespace
  const cleanContent = bodyText.replace(/\s+/g, ' ').trim()

  return {
    url: targetUrl,
    hostname: parsed.hostname,
    title,
    metaDescription,
    author,
    canonical,
    jsonLdSchemas,
    headings,
    tableCount,
    listCount,
    blockquoteCount,
    content: cleanContent,
    wordCount: cleanContent ? cleanContent.split(/\s+/).length : 0,
  }
}

/**
 * Calculate programmatic heuristic metrics for GEO readiness
 */
export function calculateProgrammaticGeoMetrics(content, extractedData = {}) {
  const text = content || ''
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length || 1

  // 1. Factual Density: Numbers, %, Currencies, Dates, Data phrases
  const numbers = text.match(/\b\d+(\.\d+)?\b/g) || []
  const percentages = text.match(/\b\d+(\.\d+)?%/g) || []
  const currencies = text.match(/[\$€£¥₹]\s?\d+([.,]\d+)?/g) || []
  const yearReferences = text.match(/\b(19\d\d|20[0-3]\d)\b/g) || []
  const statIndicators = text.match(/\b(increase|decrease|growth|survey|study|benchmark|report|statistics|percent|average|median|dataset|tested|findings)\b/gi) || []

  const totalDataPoints = numbers.length + percentages.length * 2 + currencies.length * 2 + statIndicators.length
  const factualDensityRatio = ((totalDataPoints / wordCount) * 100).toFixed(2)
  const factualScore = Math.min(100, Math.round(Math.min(factualDensityRatio * 18, 100)))

  // 2. Direct Answer Architecture
  const headings = extractedData.headings || []
  const questionHeadings = headings.filter((h) =>
    /^(what|how|why|when|where|who|which|can|is|are|does|do|should|will|definition|guide|vs|how to)\b/i.test(h.text) ||
    h.text.endsWith('?')
  )
  const directAnswerScore = Math.min(
    100,
    Math.round(
      (headings.length > 0 ? (questionHeadings.length / Math.max(1, headings.length)) * 50 : 20) +
        (text.includes('is defined as') || text.includes('refers to') || text.includes('in summary') || text.includes('key takeaways') ? 30 : 15) +
        (extractedData.listCount > 0 ? 20 : 0)
    )
  )

  // 3. Entity & Brand Grounding
  const hasAuthor = Boolean(extractedData.author && extractedData.author.length > 2)
  const schemas = extractedData.jsonLdSchemas || []
  const schemaTypes = schemas.flatMap((s) => {
    if (Array.isArray(s['@graph'])) return s['@graph'].map((g) => g['@type'])
    return [s['@type']]
  }).filter(Boolean)

  const hasEntitySchema = schemaTypes.some((t) =>
    /Organization|Person|Article|TechArticle|BlogPosting|FAQPage|HowTo|Product/i.test(String(t))
  )
  const entityScore = Math.min(
    100,
    (hasAuthor ? 30 : 10) +
      (hasEntitySchema ? 40 : 15) +
      (extractedData.canonical ? 15 : 5) +
      (extractedData.metaDescription?.length > 40 ? 15 : 5)
  )

  // 4. Quoteability & Soundbites
  const sentences = text.split(/(?<=[.?!])\s+/).filter((s) => s.length > 25)
  const quotableRegex = /\b(proves|discovered|demonstrates|indicates|reveals|according to|our data shows|we found that|rule of thumb|best practice|the key advantage|specifically)\b/i
  const quotableSentences = sentences.filter((s) => quotableRegex.test(s))
  const quoteabilityScore = Math.min(
    100,
    Math.round(
      Math.min(quotableSentences.length * 15, 60) +
        (extractedData.blockquoteCount > 0 ? 15 : 0) +
        (extractedData.tableCount > 0 ? 25 : 10)
    )
  )

  // 5. Structured Data & Technical Hygiene
  const structuredScore = Math.min(
    100,
    (hasEntitySchema ? 45 : 15) +
      (extractedData.tableCount > 0 ? 20 : 5) +
      (extractedData.listCount > 1 ? 20 : 10) +
      (headings.some((h) => h.tag === 'h1') ? 15 : 5)
  )

  const overallHeuristic = Math.round(
    factualScore * 0.25 +
      directAnswerScore * 0.25 +
      entityScore * 0.15 +
      quoteabilityScore * 0.2 +
      structuredScore * 0.15
  )

  return {
    wordCount,
    factualDensityRatio: parseFloat(factualDensityRatio),
    totalDataPoints,
    questionHeadingsCount: questionHeadings.length,
    totalHeadingsCount: headings.length,
    schemaTypesDetected: schemaTypes,
    hasAuthor,
    tableCount: extractedData.tableCount || 0,
    listCount: extractedData.listCount || 0,
    scores: {
      overall: overallHeuristic,
      factualDensity: factualScore,
      directAnswers: directAnswerScore,
      entityGrounding: entityScore,
      quoteability: quoteabilityScore,
      structuredData: structuredScore,
    },
  }
}

/**
 * Main Analysis Orchestrator: Combines Heuristics + AI Provider Evaluation
 */
export async function analyzeGeoReadiness({
  url = null,
  content = '',
  targetQuery = '',
  targetEngine = 'all',
  preferredProvider = null,
}) {
  let extracted = {
    url: url || null,
    hostname: null,
    title: '',
    metaDescription: '',
    author: '',
    canonical: '',
    jsonLdSchemas: [],
    headings: [],
    tableCount: 0,
    listCount: 0,
    blockquoteCount: 0,
    content: content || '',
    wordCount: content ? content.split(/\s+/).length : 0,
  }

  if (url) {
    const fetched = await fetchUrlForGeoAnalysis(url)
    extracted = {
      ...fetched,
      content: content && content.length > 50 ? content : fetched.content,
    }
  }

  if (!extracted.content || extracted.content.trim().length < 50) {
    throw new Error('Not enough text content found to evaluate. Please check the URL or paste your content draft.')
  }

  // Compute programmatic metrics
  const metrics = calculateProgrammaticGeoMetrics(extracted.content, extracted)

  // Truncate content for LLM context window
  const textExcerpt = extracted.content.substring(0, 14000)

  // Build AI Prompt
  const prompt = `Analyze this webpage content for Generative Engine Optimization (GEO) and AI Search Citation Visibility.

Target Query/Topic: ${targetQuery || extracted.title || 'General Topical Authority'}
Target AI Engine Focus: ${targetEngine}
Page Title: ${extracted.title || 'Not specified'}
URL / Host: ${extracted.url || 'Draft Content'}
Author: ${extracted.author || 'None detected'}
Detected Schema Types: ${metrics.schemaTypesDetected.join(', ') || 'None'}
Factual Data Points: ${metrics.totalDataPoints} | Question Headings: ${metrics.questionHeadingsCount}/${metrics.totalHeadingsCount} | Tables: ${metrics.tableCount} | Lists: ${metrics.listCount}

---
CONTENT EXCERPT:
${textExcerpt}
---

Return a JSON object with this EXACT structure:
{
  "overallScore": number (0-100),
  "scoreCategory": "High AI Citation Probability" | "Moderate AI Citation Probability" | "Low / At Risk AI Visibility",
  "executiveSummary": "2-3 sentence summary evaluating citation readiness across Google AI Overviews, Perplexity, and ChatGPT Search",
  "pillars": {
    "factualDensity": {
      "score": number (0-100),
      "status": "Optimal" | "Needs Improvement" | "Critical Gap",
      "summary": "Short assessment of statistics, percentages, and hard verifiable data",
      "strengths": ["string"],
      "improvements": ["string"]
    },
    "directAnswers": {
      "score": number (0-100),
      "status": "Optimal" | "Needs Improvement" | "Critical Gap",
      "summary": "Assessment of direct 40-60 word definitive answer snippets below key question headings",
      "strengths": ["string"],
      "improvements": ["string"]
    },
    "entityGrounding": {
      "score": number (0-100),
      "status": "Optimal" | "Needs Improvement" | "Critical Gap",
      "summary": "Assessment of named entities, author credentials, brand attribution, and trust signals",
      "strengths": ["string"],
      "improvements": ["string"]
    },
    "quoteability": {
      "score": number (0-100),
      "status": "Optimal" | "Needs Improvement" | "Critical Gap",
      "summary": "Assessment of memorable definitions, unique framework terms, and extractable soundbites",
      "strengths": ["string"],
      "improvements": ["string"]
    },
    "structuredData": {
      "score": number (0-100),
      "status": "Optimal" | "Needs Improvement" | "Critical Gap",
      "summary": "Assessment of Schema.org markup, comparison tables, and list hierarchies",
      "strengths": ["string"],
      "improvements": ["string"]
    }
  },
  "simulations": {
    "googleAiOverview": {
      "query": "${targetQuery || extracted.title || 'Summary of ' + (extracted.hostname || 'this topic')}",
      "aiResponse": "Simulated Google AI Overview answer synthesizing this page with bullet points and clear definitions.",
      "citedSources": [
        { "domain": "${extracted.hostname || 'yoursite.com'}", "title": "${extracted.title || 'Your Content'}", "isYourSite": true }
      ],
      "citationProbability": "High" | "Medium" | "Low"
    },
    "perplexity": {
      "query": "${targetQuery || extracted.title || 'Summary of ' + (extracted.hostname || 'this topic')}",
      "searchSteps": ["Searching web for authoritative sources...", "Extracting key statistics & benchmarks...", "Synthesizing consensus..."],
      "directAnswerWithCitations": "Simulated Perplexity answer with inline citation tags like [1] that reference this page.",
      "citationIndex": 1
    },
    "chatGptSearch": {
      "query": "${targetQuery || extracted.title || 'Summary of ' + (extracted.hostname || 'this topic')}",
      "conversationalAnswer": "Simulated ChatGPT Search conversational answer quoting specific data or recommendations from this page.",
      "highlightedQuote": "A specific high-authority sentence extracted from the text"
    }
  },
  "topQuotableSnippets": [
    {
      "snippet": "Exact high-impact sentence from the content",
      "citeProbability": "High" | "Medium",
      "reason": "Why LLMs are eager to quote this (e.g. concrete benchmark, proprietary insight, crisp definition)"
    }
  ],
  "soundbiteRewrites": [
    {
      "original": "A generic or weak sentence from the content",
      "rewritten": "A high-authority, data-backed soundbite ready to replace the original",
      "whyItWins": "Explanation of how the rewrite triggers AI engine citations"
    }
  ],
  "citationGaps": [
    {
      "missingConcept": "Name of missing subtopic, data point, or entity definition",
      "impact": "High" | "Medium",
      "recommendation": "Exact paragraph, comparison table, or statistic to insert"
    }
  ],
  "optimizationPack": {
    "keyTakeawaysBox": {
      "heading": "Key Takeaways (Optimized for AI Search & Humans)",
      "bullets": ["3-5 clear, concise, data-backed bullet points summarizing the entire article"]
    },
    "faqSchemaList": [
      {
        "question": "High-intent question AI searchers ask",
        "answer": "Concise 40-50 word direct answer that LLMs will extract verbatim"
      }
    ],
    "suggestedJsonLdSnippet": "Valid JSON-LD string snippet with Article and FAQPage schema"
  },
  "priorityActionPlan": [
    {
      "priority": "High" | "Medium" | "Low",
      "title": "Action title",
      "action": "Specific implementation instruction",
      "estimatedGeoBoost": "+5 to +15 pts"
    }
  ]
}`

  let aiResult = null
  try {
    aiResult = await callAIAndParseJSON(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      {
        temperature: 0.3,
        maxTokens: 3500,
        preferredProvider,
        jsonMode: true,
      }
    )
  } catch (aiErr) {
    console.warn('AI provider call failed, generating deterministic fallback:', aiErr.message)
    aiResult = generateFallbackGeoResult(extracted, metrics, targetQuery)
  }

  return {
    success: true,
    targetQuery: targetQuery || extracted.title || 'General Topic Analysis',
    targetEngine,
    url: extracted.url,
    hostname: extracted.hostname,
    metadata: {
      title: extracted.title,
      description: extracted.metaDescription,
      author: extracted.author,
      canonical: extracted.canonical,
      wordCount: extracted.wordCount,
    },
    programmaticMetrics: metrics,
    analysis: aiResult,
    analyzedAt: new Date().toISOString(),
  }
}

/**
 * Deterministic Fallback Generator if AI is unreachable
 */
function generateFallbackGeoResult(extracted, metrics, targetQuery) {
  const score = metrics.scores.overall
  const category =
    score >= 75
      ? 'High AI Citation Probability'
      : score >= 50
        ? 'Moderate AI Citation Probability'
        : 'Low / At Risk AI Visibility'

  const domain = extracted.hostname || 'your-domain.com'
  const query = targetQuery || extracted.title || `Insights on ${domain}`

  return {
    overallScore: score,
    scoreCategory: category,
    executiveSummary: `This content scored ${score}/100 for Generative Engine Optimization. ${
      score >= 70
        ? 'It demonstrates solid factual density and clear structure that AI engines can extract.'
        : 'It has opportunities to improve direct-answer snippets and add structured data to win AI Overviews.'
    }`,
    pillars: {
      factualDensity: {
        score: metrics.scores.factualDensity,
        status: metrics.scores.factualDensity >= 70 ? 'Optimal' : 'Needs Improvement',
        summary: `Detected ${metrics.totalDataPoints} verifiable data points across ${metrics.wordCount} words (${metrics.factualDensityRatio}% density).`,
        strengths: ['Included numerical metrics and benchmarks.'],
        improvements: ['Add 2-3 proprietary research statistics or industry survey results.'],
      },
      directAnswers: {
        score: metrics.scores.directAnswers,
        status: metrics.scores.directAnswers >= 70 ? 'Optimal' : 'Needs Improvement',
        summary: `Detected ${metrics.questionHeadingsCount} question-oriented headings.`,
        strengths: ['Uses structured headings to guide readability.'],
        improvements: ['Ensure each H2 question is immediately followed by a 40-50 word direct definition.'],
      },
      entityGrounding: {
        score: metrics.scores.entityGrounding,
        status: metrics.scores.entityGrounding >= 70 ? 'Optimal' : 'Needs Improvement',
        summary: `Author info: ${metrics.hasAuthor ? 'Detected' : 'Missing'}. Schemas: ${metrics.schemaTypesDetected.join(', ') || 'None'}.`,
        strengths: metrics.hasAuthor ? ['Author byline present.'] : ['Topical relevance maintained.'],
        improvements: ['Add Person or Organization JSON-LD schema to strengthen E-E-A-T credentials.'],
      },
      quoteability: {
        score: metrics.scores.quoteability,
        status: metrics.scores.quoteability >= 70 ? 'Optimal' : 'Needs Improvement',
        summary: 'Contains clear takeaway sentences and list breakdowns.',
        strengths: ['Includes structured bullet points.'],
        improvements: ['Coin a named proprietary term or distinct framework for your core methodology.'],
      },
      structuredData: {
        score: metrics.scores.structuredData,
        status: metrics.scores.structuredData >= 70 ? 'Optimal' : 'Needs Improvement',
        summary: `Detected ${metrics.tableCount} comparison tables and ${metrics.listCount} structured lists.`,
        strengths: ['Page structure is parseable by LLM crawlers.'],
        improvements: ['Add FAQPage and Article Schema JSON-LD markup.'],
      },
    },
    simulations: {
      googleAiOverview: {
        query,
        aiResponse: `According to recent analysis from ${domain}, understanding ${query} requires focusing on direct answer architecture, factual benchmarks, and structured schema definitions. Key factors include data transparency, verified author credentials, and comprehensive topical coverage.`,
        citedSources: [{ domain, title: extracted.title || 'Authoritative Source Guide', isYourSite: true }],
        citationProbability: score >= 70 ? 'High' : 'Medium',
      },
      perplexity: {
        query,
        searchSteps: ['Scanning industry benchmarks...', `Synthesizing analysis from ${domain}...`, 'Validating core assertions...'],
        directAnswerWithCitations: `Key findings regarding ${query} highlight that content with clear definitions and data points achieves higher authority [1]. Best practices recommend inverse-pyramid summaries and structured FAQs [1].`,
        citationIndex: 1,
      },
      chatGptSearch: {
        query,
        conversationalAnswer: `Based on content from ${domain}, ${query} emphasizes clear actionable takeaways supported by structured metrics and direct explanations.`,
        highlightedQuote: `Focusing on factual precision and direct definitions yields maximum clarity and citation authority.`,
      },
    },
    topQuotableSnippets: [
      {
        snippet: extracted.title ? `Comprehensive guide on ${extracted.title}` : 'Direct definition and strategic methodology.',
        citeProbability: 'High',
        reason: 'Summarizes key concept cleanly with high topical relevance.',
      },
    ],
    soundbiteRewrites: [
      {
        original: 'SEO is changing rapidly with AI technologies.',
        rewritten: 'Generative Engine Optimization (GEO) requires shifting from keyword density to factual soundbites and structured JSON-LD entities.',
        whyItWins: 'Replaces generic commentary with specific terminology and actionable benchmarks.',
      },
    ],
    citationGaps: [
      {
        missingConcept: 'Comparison Matrix / Data Table',
        impact: 'High',
        recommendation: 'Add a 4-column comparison table summarizing features, costs, or performance metrics.',
      },
      {
        missingConcept: 'FAQ Section with Schema',
        impact: 'High',
        recommendation: 'Embed 3-5 high-intent FAQ questions at the bottom of the content with FAQPage schema.',
      },
    ],
    optimizationPack: {
      keyTakeawaysBox: {
        heading: 'Key Takeaways (Optimized for AI Search)',
        bullets: [
          `Prioritize direct-answer summaries at the beginning of each major section.`,
          `Include concrete statistics, metrics, and dates rather than vague claims.`,
          `Deploy structured JSON-LD schema for Organization and Article entities.`,
        ],
      },
      faqSchemaList: [
        {
          question: `What is the most effective way to optimize for ${query}?`,
          answer: `The most effective approach is structuring content with concise direct answers, high factual data density, and clear schema markup so AI search engines can readily quote your insights.`,
        },
      ],
      suggestedJsonLdSnippet: JSON.stringify(
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: extracted.title || query,
          author: {
            '@type': 'Person',
            name: extracted.author || 'Author Name',
          },
        },
        null,
        2
      ),
    },
    priorityActionPlan: [
      {
        priority: 'High',
        title: 'Add Executive Summary / Takeaway Box',
        action: 'Insert a 3-bullet Key Takeaways box right below your H1 heading.',
        estimatedGeoBoost: '+12 pts',
      },
      {
        priority: 'High',
        title: 'Implement JSON-LD Schema',
        action: 'Copy and paste the suggested Schema markup into your HTML <head>.',
        estimatedGeoBoost: '+10 pts',
      },
      {
        priority: 'Medium',
        title: 'Convert Paragraphs to Comparison Table',
        action: 'Transform descriptive text into a structured comparison table.',
        estimatedGeoBoost: '+8 pts',
      },
    ],
  }
}

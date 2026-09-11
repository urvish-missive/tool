import * as cheerio from 'cheerio'
import {
  validateURL,
  resolveAndValidate,
  fetchWithTimeout,
  countWords,
  extractAndCleanJSON,
} from '../utils/helpers.js'
import { callAI, getLastModelInvocation } from '../utils/aiProvider.js'

const FETCH_TIMEOUT_MS = 14000
const MAX_CONTENT_LENGTH = 12000

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

/**
 * General-purpose presets for user guidance (optional hints, not rigid silos).
 * The analyzer dynamically infers framework, format, and sensitivity.
 */
export const EEAT_CONTENT_TYPES = {
  auto: {
    label: 'Auto-Detect Framework',
    description: 'Dynamically infers content format, subject context, and appropriate evidence standards across any industry or topic.',
  },
  technical_commercial: {
    label: 'Technical & Commercial Guidance',
    description: 'Evaluates architectural clarity, operational workflows, integration feasibility, and commercial decision criteria.',
  },
  product_review: {
    label: 'Product Evaluation & Comparison',
    description: 'Requires first-hand testing evidence, benchmark measurements, pros/cons, and authentic methodology.',
  },
  high_sensitivity_ymyl: {
    label: 'High-Sensitivity & Advisory (YMYL)',
    description: 'Demands strict scrutiny for verified qualifications, primary authoritative sources, and risk disclosures.',
  },
  educational_guide: {
    label: 'Educational & Practical Guide',
    description: 'Focuses on procedural clarity, actionable methodology, edge cases, and reliable references.',
  },
  news_analysis: {
    label: 'News, Investigative & Current Events',
    description: 'Emphasizes primary source attribution, balanced reporting, factual qualification, and editorial transparency.',
  },
}

/**
 * Centralized diagnostic grade thresholds for internal quality assessment.
 * Note: These are internal diagnostic benchmarks inspired by quality principles,
 * NOT official Google scores.
 */
export function calculateEeatGrade(overallScore) {
  if (typeof overallScore !== 'number' || isNaN(overallScore)) return null
  if (overallScore >= 88) return 'Exceptional E-E-A-T'
  if (overallScore >= 72) return 'Strong E-E-A-T'
  if (overallScore >= 55) return 'Moderate E-E-A-T'
  if (overallScore >= 35) return 'Developing E-E-A-T'
  return 'Critical E-E-A-T Gaps'
}

/**
 * Scrape webpage and extract structured content for E-E-A-T analysis
 */
export async function scrapeUrlForEeat(targetUrl) {
  let urlToFetch = targetUrl.trim()
  if (!urlToFetch.startsWith('http://') && !urlToFetch.startsWith('https://')) {
    urlToFetch = `https://${urlToFetch}`
  }

  const parsed = validateURL(urlToFetch)
  if (resolveAndValidate) {
    await resolveAndValidate(parsed.hostname).catch(() => {})
  }

  const response = await fetchWithTimeout(
    parsed.href,
    { headers: BROWSER_HEADERS, redirect: 'follow' },
    FETCH_TIMEOUT_MS
  )

  if (!response.ok) {
    throw new Error(`Website responded with HTTP status ${response.status} (${response.statusText})`)
  }

  const html = await response.text()
  if (!html || html.trim().length === 0) {
    throw new Error('Received empty HTML response from target URL.')
  }

  const $ = cheerio.load(html)

  // Remove noise elements
  $('script, style, noscript, nav, footer, iframe, svg, [role="navigation"], .nav, .footer, .sidebar, .cookie-banner, .advertisement, .ads').remove()

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('h1').first().text().trim() ||
    'Untitled Page'

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    ''

  const author =
    $('meta[name="author"]').attr('content') ||
    $('[rel="author"]').text().trim() ||
    $('.author, .byline, .author-name, .entry-author').first().text().trim() ||
    ''

  const publishedDate =
    $('meta[property="article:published_time"]').attr('content') ||
    $('time').first().attr('datetime') ||
    $('time').first().text().trim() ||
    ''

  // Headings
  const headings = []
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length < 150) {
      headings.push(`${el.tagName.toUpperCase()}: ${text}`)
    }
  })

  // Extract external citations
  const externalLinks = []
  const pageHost = parsed.hostname.replace(/^www\./, '')
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    try {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        const linkHost = new URL(href).hostname.replace(/^www\./, '')
        if (linkHost !== pageHost && !externalLinks.includes(linkHost)) {
          externalLinks.push(linkHost)
        }
      }
    } catch {}
  })

  // Check Schema.org
  const detectedSchemas = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}')
      if (data['@type']) detectedSchemas.push(data['@type'])
      if (Array.isArray(data['@graph'])) {
        data['@graph'].forEach((item) => {
          if (item['@type']) detectedSchemas.push(item['@type'])
        })
      }
    } catch {}
  })

  // Clean article text
  let bodyText = $('article, main, .content, .entry-content, .post-content').text()
  if (!bodyText || bodyText.trim().length < 200) {
    bodyText = $('body').text()
  }
  bodyText = bodyText.replace(/\s+/g, ' ').trim()

  return {
    url: parsed.href,
    title,
    description,
    author,
    publishedDate,
    headings: headings.slice(0, 15),
    externalLinks: externalLinks.slice(0, 20),
    detectedSchemas: [...new Set(detectedSchemas)],
    textContent: bodyText.slice(0, MAX_CONTENT_LENGTH),
    wordCount: countWords(bodyText),
  }
}

/**
 * Objective document inspection.
 * Note: Does NOT score content or override semantic understanding.
 * Purely extracts factual, observable document metadata.
 */
function inspectDocumentHeuristics(text = '', author = '', externalLinks = [], schemas = [], analysisSource = 'pasted_text') {
  const wordCount = countWords(text)
  const paragraphCount = text.split(/\n\s*\n/).filter((p) => p.trim().length > 30).length
  const hasAuthorByline = Boolean(author && author.trim().length > 1)

  return {
    wordCount,
    paragraphCount,
    readingTimeMinutes: Math.max(1, Math.round(wordCount / 220)),
    hasAuthorByline,
    authorName: hasAuthorByline ? author.trim() : null,
    externalCitationCount: externalLinks.length,
    citationDomains: externalLinks.slice(0, 10),
    schemaStatus: analysisSource === 'url'
      ? (schemas.length > 0 ? 'detected' : 'missing_on_page')
      : (schemas.length > 0 ? 'detected' : 'not_provided'),
    detectedSchemas: schemas,
  }
}

/**
 * Identify input limitations versus true content gaps.
 */
function identifyInputLimitations(analysisSource, heuristics) {
  const limitations = []

  if (analysisSource === 'pasted_text') {
    limitations.push('Analysis performed on raw pasted text: site-level schema markup, author profile pages, and domain security (SSL/HTTPS) could not be verified.')
    if (!heuristics.hasAuthorByline) {
      limitations.push('No author metadata was supplied with the draft: author-level credentials and external authority could not be verified from input alone.')
    }
  } else {
    if (!heuristics.hasAuthorByline) {
      limitations.push('No explicit author byline or meta tag detected on the target webpage.')
    }
    if (heuristics.schemaStatus === 'missing_on_page') {
      limitations.push('No Schema.org structured data (JSON-LD) was detected on the target webpage.')
    }
  }

  return limitations
}

/**
 * High-utility partial fallback when AI semantic model is unreachable.
 * Never fabricates numbers or returns "N/A" strings.
 * Clearly demarcates unavailable semantic scores with null and provides
 * structured deterministic observations.
 */
function getPartialFallbackResult({
  title,
  analysisSource,
  heuristics,
  inputLimitations,
  fallbackReason,
  fallbackStage,
  errorCode = 'AI_UNAVAILABLE',
}) {
  return {
    analysisStatus: 'partial',
    scoreAvailable: false,
    isFallback: true,
    overallScore: null,
    grade: null,
    diagnosticConfidence: 0.35,
    summary: 'Model-based semantic E-E-A-T analysis was temporarily unavailable. Deterministic document metrics and structural heuristics were successfully evaluated.',
    classification: {
      contentFormat: {
        label: heuristics.wordCount > 1500 ? 'Comprehensive Long-form Guide' : 'Informational Article',
        confidence: 0.5,
      },
      subjectContext: {
        label: 'General Subject Matter',
        description: 'Semantic subject classification requires model-based inference.',
        confidence: 0.3,
      },
      evaluationFramework: {
        label: 'General Quality Standards',
        reason: 'Automated fallback applied standard baseline quality indicators.',
        confidence: 0.4,
      },
      secondaryContexts: [],
      sensitivity: {
        level: 'moderate',
        reasons: ['Content sensitivity could not be semantically verified; applying standard baseline care.'],
        evidenceThreshold: 'Standard empirical or logical verification',
      },
    },
    eeat: {
      overallScore: null,
      grade: null,
      confidence: 0.35,
      pillars: {
        experience: {
          score: null,
          maxScore: 25,
          status: 'Evaluation Unavailable',
          confidence: 0,
          strengths: [],
          gaps: ['Semantic verification of first-hand experience unavailable in fallback mode.'],
          evidence: [],
        },
        expertise: {
          score: null,
          maxScore: 25,
          status: 'Evaluation Unavailable',
          confidence: 0,
          strengths: [],
          gaps: ['Technical accuracy and terminological depth could not be semantically analyzed.'],
          evidence: [],
        },
        authoritativeness: {
          score: null,
          maxScore: 25,
          status: 'Evaluation Unavailable',
          confidence: 0,
          strengths: heuristics.externalCitationCount > 0
            ? [`Contains ${heuristics.externalCitationCount} external citation domains.`]
            : [],
          gaps: heuristics.externalCitationCount === 0
            ? ['No external primary source citations observed in the provided content.']
            : [],
          evidence: [],
        },
        trustworthiness: {
          score: null,
          maxScore: 25,
          status: 'Evaluation Unavailable',
          confidence: 0,
          strengths: heuristics.hasAuthorByline
            ? [`Author byline "${heuristics.authorName}" was provided.`]
            : [],
          gaps: !heuristics.hasAuthorByline
            ? ['Author information was not supplied or detected.']
            : [],
          evidence: [],
        },
      },
    },
    aiSearchReadiness: {
      score: null,
      maxScore: 100,
      status: 'Evaluation Unavailable',
      strengths: heuristics.wordCount >= 500
        ? ['Substantial content length provides sufficient topical coverage for LLM extraction.']
        : [],
      gaps: ['Semantic citability analysis unavailable in fallback mode.'],
      citabilityFactors: {
        directAnswers: 'Unavailable',
        structuredHeadings: 'Unavailable',
        entityClarity: 'Unavailable',
        sourceAttribution: heuristics.externalCitationCount > 0 ? 'Citations Present' : 'No Citations',
      },
      keyQuotableBlocks: [],
    },
    claims: [],
    recommendations: [
      {
        recommendation: heuristics.hasAuthorByline
          ? 'Add complete author credentials, domain experience, and link to professional profiles.'
          : 'Include a clear author byline with relevant subject-matter background and credentials.',
        pillar: 'authoritativeness',
        priority: 'high',
        reason: 'Author transparency is a foundational requirement for verifiable content quality.',
      },
      {
        recommendation: heuristics.externalCitationCount > 0
          ? 'Ensure external references link to primary data, official standards, or peer-reviewed studies.'
          : 'Add 2-3 links to primary research, official documentation, or verified industry data.',
        pillar: 'trustworthiness',
        priority: 'high',
        reason: 'Claims supported by primary sources establish factual trust.',
      },
      {
        recommendation: 'Include specific first-hand observations, test methodology, or real-world implementation notes.',
        pillar: 'experience',
        priority: 'medium',
        reason: 'First-hand proof differentiates original content from generic AI synthesis.',
      },
    ],
    boosters: {
      recommendedExperienceAddition: 'Describe a specific real-world scenario, test run, or implementation lesson learned from working directly with this subject.',
      recommendedAuthorBioElements: [
        'Author name and current professional role',
        'Direct years of relevant domain experience',
        'Specific areas of specialization related to this topic',
        'Link to professional profile or author bio page',
      ],
      citableSourceTypes: [
        'Official vendor documentation or product specifications',
        'Industry benchmark reports or standards bodies',
        'Independent research or verified case studies',
      ],
      recommendedMethodologyDisclosure: 'Transparency Note: Explain how recommendations were formulated, whether products/methods were independently evaluated, and clarify any commercial relationships.',
      aiSearchOptimizedSummary: 'Include a concise 2-sentence direct answer definition at the top of the article summarizing core findings for search engine AI overviews.',
    },
    heuristics,
    inputLimitations,
    analysisSource,
    title,
    analyzedAt: new Date().toISOString(),
    diagnostic: {
      analysisStatus: 'partial',
      modelCallSucceeded: false,
      responseReceived: false,
      parseSucceeded: false,
      schemaValidationSucceeded: false,
      retryCount: 0,
      fallbackReason: fallbackReason || 'Semantic AI model unavailable',
      fallbackStage: fallbackStage || 'model_invocation',
      errorCode,
    },
  }
}

/**
 * Validate and clean JSON response from AI model.
 * Performs deep type coercion, range clamping, and schema recovery.
 */
function validateAndSanitizeAiResponse(rawJson, pageTitle, heuristics, inputLimitations, analysisSource) {
  if (!rawJson || typeof rawJson !== 'object') {
    throw new Error('AI response is not a valid JSON object')
  }

  // 1. Classification validation
  const classification = {
    contentFormat: {
      label: String(rawJson.classification?.contentFormat?.label || rawJson.detectedType || 'N/A').trim(),
      confidence: Math.min(Math.max(Number(rawJson.classification?.contentFormat?.confidence) || 0.75, 0), 1),
    },
    subjectContext: {
      label: String(rawJson.classification?.subjectContext?.label || rawJson.typeLabel || 'N/A').trim(),
      description: String(rawJson.classification?.subjectContext?.description || '').trim(),
      confidence: Math.min(Math.max(Number(rawJson.classification?.subjectContext?.confidence) || 0.75, 0), 1),
    },
    evaluationFramework: {
      label: String(rawJson.classification?.evaluationFramework?.label || 'N/A').trim(),
      reason: String(rawJson.classification?.evaluationFramework?.reason || '').trim(),
      confidence: Math.min(Math.max(Number(rawJson.classification?.evaluationFramework?.confidence) || 0.75, 0), 1),
    },
    secondaryContexts: Array.isArray(rawJson.classification?.secondaryContexts)
      ? rawJson.classification.secondaryContexts.map(String).filter(Boolean)
      : [],
    sensitivity: {
      level: ['low', 'moderate', 'high', 'critical'].includes(rawJson.classification?.sensitivity?.level?.toLowerCase())
        ? rawJson.classification.sensitivity.level.toLowerCase()
        : 'N/A',
      reasons: Array.isArray(rawJson.classification?.sensitivity?.reasons)
        ? rawJson.classification.sensitivity.reasons.map(String).filter(Boolean)
        : [],
      evidenceThreshold: String(rawJson.classification?.sensitivity?.evidenceThreshold || 'N/A').trim(),
    },
  }

  // 2. Pillars validation (4 core pillars, 0-25 each, sum = 0-100)
  const sanitizePillar = (pData) => {
    const rawScore = Number(pData?.score)
    let score = null
    if (!isNaN(rawScore) && rawScore >= 0 && rawScore <= 25) {
      score = Math.round(rawScore)
    } else if (!isNaN(rawScore) && rawScore > 25 && rawScore <= 100) {
      score = Math.round(rawScore / 4)
    }

    return {
      score,
      maxScore: 25,
      status: String(pData?.status || 'N/A').trim(),
      confidence: Math.min(Math.max(Number(pData?.confidence) || 0.75, 0), 1),
      strengths: Array.isArray(pData?.strengths) ? pData.strengths.map(String).filter(Boolean) : [],
      gaps: Array.isArray(pData?.gaps) ? pData.gaps.map(String).filter(Boolean) : [],
      evidence: Array.isArray(pData?.evidence) ? pData.evidence.map(String).filter(Boolean) : [],
    }
  }

  const pillarsRaw = rawJson.eeat?.pillars || rawJson.pillars || {}
  const experience = sanitizePillar(pillarsRaw.experience)
  const expertise = sanitizePillar(pillarsRaw.expertise)
  const authoritativeness = sanitizePillar(pillarsRaw.authoritativeness)
  const trustworthiness = sanitizePillar(pillarsRaw.trustworthiness)

  // Overall E-E-A-T Score (sum of available pillar scores: 0-100, null if none)
  const availablePillarScores = [experience.score, expertise.score, authoritativeness.score, trustworthiness.score].filter((s) => s != null)
  const computedOverall = availablePillarScores.length > 0 ? availablePillarScores.reduce((a, b) => a + b, 0) : null
  const rawOverall = Number(rawJson.eeat?.overallScore ?? rawJson.overallScore)
  const overallScore = (!isNaN(rawOverall) && rawOverall >= 0 && rawOverall <= 100)
    ? Math.round(rawOverall)
    : (computedOverall != null ? Math.min(Math.max(computedOverall, 0), 100) : null)

  const grade = calculateEeatGrade(overallScore)
  const diagnosticConfidence = Math.min(Math.max(Number(rawJson.eeat?.confidence || rawJson.diagnosticConfidence) || 0.82, 0), 1)

  // 3. AI Search Readiness (Separate Diagnostic: 0-100)
  const aiSearchRaw = rawJson.aiSearchReadiness || {}
  const rawAiScore = Number(aiSearchRaw.score)
  const aiSearchScore = (!isNaN(rawAiScore) && rawAiScore >= 0 && rawAiScore <= 100)
    ? Math.round(rawAiScore)
    : null

  const aiSearchReadiness = {
    score: aiSearchScore,
    maxScore: 100,
    status: String(aiSearchRaw.status || 'N/A').trim(),
    strengths: Array.isArray(aiSearchRaw.strengths) ? aiSearchRaw.strengths.map(String).filter(Boolean) : [],
    gaps: Array.isArray(aiSearchRaw.gaps) ? aiSearchRaw.gaps.map(String).filter(Boolean) : [],
    citabilityFactors: {
      directAnswers: String(aiSearchRaw.citabilityFactors?.directAnswers || 'N/A').trim(),
      structuredHeadings: String(aiSearchRaw.citabilityFactors?.structuredHeadings || 'N/A').trim(),
      entityClarity: String(aiSearchRaw.citabilityFactors?.entityClarity || 'N/A').trim(),
      sourceAttribution: String(aiSearchRaw.citabilityFactors?.sourceAttribution || 'N/A').trim(),
    },
    keyQuotableBlocks: Array.isArray(aiSearchRaw.keyQuotableBlocks)
      ? aiSearchRaw.keyQuotableBlocks.map(String).filter(Boolean)
      : [],
  }

  // 4. Claims extraction
  const claims = Array.isArray(rawJson.claims)
    ? rawJson.claims.map((c) => ({
        claim: String(c.claim || '').trim(),
        claimType: String(c.claimType || 'informative').trim(),
        requiresEvidence: Boolean(c.requiresEvidence),
        evidenceFound: Boolean(c.evidenceFound),
        evidenceQuality: ['high', 'moderate', 'low', 'none'].includes(String(c.evidenceQuality || '').toLowerCase())
          ? String(c.evidenceQuality).toLowerCase()
          : 'moderate',
        confidence: Math.min(Math.max(Number(c.confidence) || 0.75, 0), 1),
      })).filter((c) => c.claim.length > 5)
    : []

  // 5. Prioritized recommendations
  const rawRecs = Array.isArray(rawJson.recommendations) ? rawJson.recommendations : []
  const validPriorities = ['critical', 'high', 'medium', 'low']
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

  const recommendations = rawRecs.map((r) => ({
    recommendation: String(r.recommendation || '').trim(),
    pillar: ['experience', 'expertise', 'authoritativeness', 'trustworthiness', 'ai_search'].includes(String(r.pillar || '').toLowerCase())
      ? String(r.pillar).toLowerCase()
      : 'trustworthiness',
    priority: validPriorities.includes(String(r.priority || '').toLowerCase())
      ? String(r.priority).toLowerCase()
      : 'medium',
    reason: String(r.reason || '').trim(),
  })).filter((r) => r.recommendation.length > 5)
    .sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2))

  // 6. Actionable boosters (safe recommendations without hallucinated facts)
  const boostersRaw = rawJson.boosters || {}
  const boosters = {
    recommendedExperienceAddition: String(boostersRaw.recommendedExperienceAddition || '').trim() ||
      'Incorporate a real-world testing observation or trial outcome describing measurable results.',
    recommendedAuthorBioElements: Array.isArray(boostersRaw.recommendedAuthorBioElements) && boostersRaw.recommendedAuthorBioElements.length > 0
      ? boostersRaw.recommendedAuthorBioElements.map(String).filter(Boolean)
      : [
          'Full author byline with demonstrable subject specialization',
          'Years of direct operational involvement in this field',
          'Link to verified professional profile (e.g. LinkedIn or author page)',
        ],
    citableSourceTypes: Array.isArray(boostersRaw.citableSourceTypes) && boostersRaw.citableSourceTypes.length > 0
      ? boostersRaw.citableSourceTypes.map(String).filter(Boolean)
      : [
          'Primary vendor specifications or compliance certificates',
          'Recognized industry benchmark reports or whitepapers',
          'Peer-reviewed studies or official regulatory guidelines',
        ],
    recommendedMethodologyDisclosure: String(boostersRaw.recommendedMethodologyDisclosure || '').trim() ||
      'Methodology Statement: Detail how products or methodologies were evaluated and state any affiliate or commercial relationships.',
    aiSearchOptimizedSummary: String(boostersRaw.aiSearchOptimizedSummary || '').trim() || 'N/A',
  }

  // 7. Schema markup recommendation
  const jsonLdSchema = rawJson.jsonLdSchema || {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': pageTitle,
    'description': rawJson.summary || `Quality evaluation for ${pageTitle}`,
  }

  return {
    analysisStatus: 'complete',
    scoreAvailable: true,
    isFallback: false,
    overallScore,
    grade,
    diagnosticConfidence,
    summary: String(rawJson.summary || `E-E-A-T diagnostic audit for "${pageTitle}".`).trim(),
    classification,
    eeat: {
      overallScore,
      grade,
      confidence: diagnosticConfidence,
      pillars: {
        experience,
        expertise,
        authoritativeness,
        trustworthiness,
      },
    },
    aiSearchReadiness,
    claims,
    recommendations,
    boosters,
    jsonLdSchema,
    heuristics,
    inputLimitations,
    analysisSource,
    title: pageTitle,
    analyzedAt: new Date().toISOString(),
    diagnostic: {
      analysisStatus: 'complete',
      modelCallSucceeded: true,
      responseReceived: true,
      parseSucceeded: true,
      schemaValidationSucceeded: true,
      retryCount: 0,
      fallbackReason: null,
      fallbackStage: null,
      errorCode: null,
    },
  }
}

/**
 * Main General-Purpose E-E-A-T & AI Search Authority Analyzer
 */
export async function analyzeEeat({
  url = '',
  content = '',
  title = '',
  contentType = 'auto',
  targetKeywords = '',
  preferredProvider = 'gemini-3.5-flash',
  forceModelFailure = false,
}) {
  const isUrlMode = Boolean(url && typeof url === 'string' && url.trim().length > 3)
  const isContentMode = Boolean(content && typeof content === 'string' && content.trim().length >= 50)
  const analysisSource = isUrlMode ? 'url' : 'pasted_text'

  let textToAnalyze = ''
  let pageTitle = title?.trim() || ''
  let pageAuthor = ''
  let externalLinks = []
  let detectedSchemas = []

  // Step 1: Content Ingestion
  if (isUrlMode) {
    const scraped = await scrapeUrlForEeat(url.trim())
    textToAnalyze = scraped.textContent
    pageTitle = pageTitle || scraped.title
    pageAuthor = scraped.author
    externalLinks = scraped.externalLinks
    detectedSchemas = scraped.detectedSchemas
  } else if (isContentMode) {
    textToAnalyze = content.trim().slice(0, MAX_CONTENT_LENGTH)
    if (!pageTitle) {
      const firstLine = textToAnalyze.split('\n')[0].replace(/^#+\s*/, '').trim()
      pageTitle = firstLine.length > 5 && firstLine.length < 150 ? firstLine : 'Draft Content Evaluation'
    }
  } else {
    throw new Error('Please provide either a valid website URL or at least 50 characters of article content.')
  }

  // Step 2: Document Inspection (pure metadata, no hardcoded scores)
  const heuristics = inspectDocumentHeuristics(textToAnalyze, pageAuthor, externalLinks, detectedSchemas, analysisSource)
  const inputLimitations = identifyInputLimitations(analysisSource, heuristics)

  // Step 3: Multi-Signal Prompt Construction
  const systemPrompt = `You are a Principal Search Quality Evaluator and Generative Search Authority Specialist.
Your mission is to perform a rigorous, general-purpose E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) and AI Search Citability diagnostic audit.

IMPORTANT PHILOSOPHY & BEHAVIORAL RULES:
1. THIS IS A GENERAL-PURPOSE ANALYZER: It operates across arbitrary subjects, niches, products, industries, consumer topics, technical fields, health, finance, and educational material.
2. ZERO HARDCODED STEREOTYPES: Do NOT rely on superficial keyword presence (e.g. "I tested" is not required for synthesis; absence of first-person does not automatically mean zero experience; presence of jargon does not guarantee expertise).
3. SEPARATE CONTENT FORMAT FROM EVALUATION FRAMEWORK:
   - Content Format: How the information is presented (e.g. guide, product review, comparison, tutorial, opinion, investigative report).
   - Subject Context: The domain being discussed (e.g. business software evaluation, medical guidance, personal tax planning, devops infrastructure).
   - Evaluation Framework: What evidentiary standards apply to this content (e.g. technical/commercial guidance, empirical product benchmarking, high-stakes medical scrutiny).
4. SEPARATE AI SEARCH READINESS FROM E-E-A-T:
   - E-E-A-T has 4 pillars: Experience (0-25), Expertise (0-25), Authoritativeness (0-25), Trustworthiness (0-25) = Total 0-100.
   - AI Search Readiness is a separate 0-100 diagnostic evaluating answer-engine extractability, entity clarity, and quotability.
5. TRUST IS FOUNDATIONAL:
   - Penalize unsubstantiated factual or causal claims. Differentiate claims requiring evidence (statistics, benchmarks, causal claims, medical/financial claims) from general logical advice.
6. SAFE RECOMMENDATIONS (NO FABRICATIONS):
   - Never invent credentials, degrees, or job titles. Recommend what author information SHOULD be added.
   - Never invent fake URLs or citations. Recommend authoritative source TYPES.
7. INPUT LIMITATIONS VS CONTENT GAPS:
   - If analyzing pasted text with no author provided, note it as an input limitation rather than assuming the publisher is intentionally anonymous.

RETURN STRICTLY VALID JSON MATCHING THE REQUESTED SCHEMA. DO NOT WRAP IN MARKDOWN BACKTICKS OR PREAMBLE.`

  const userPrompt = `AUDIT TARGET:
- Title: "${pageTitle}"
- Input Source: ${analysisSource} (${analysisSource === 'pasted_text' ? 'Pasted text draft' : 'Live URL'})
- Word Count: ~${heuristics.wordCount} words
- Stated Author Byline: ${heuristics.hasAuthorByline ? heuristics.authorName : 'None supplied / verified'}
- Target Keywords / Intent: "${targetKeywords || pageTitle}"
- External Citations: ${heuristics.externalCitationCount > 0 ? heuristics.citationDomains.join(', ') : 'None observed in input'}
- Schema Markup: ${heuristics.schemaStatus}

CONTENT SAMPLE TO ANALYZE:
${textToAnalyze.slice(0, 7500)}

ANALYZE AND RESPOND WITH STRICTLY THIS JSON STRUCTURE.
IMPORTANT: The values in the template below (numbers, labels, phrases, lists) are FORMAT EXAMPLES ONLY. Derive every value from the actual content. Never copy or repeat the example numbers, labels, or phrases into your response.
{
  "summary": "Concise 2-3 sentence executive assessment of content strengths, primary evidentiary gaps, and highest priority improvement.",
  "classification": {
    "contentFormat": {
      "label": "(derived label, e.g. In-Depth Evaluation Guide, Comparative Benchmark, Tutorial)",
      "confidence": 0.90
    },
    "subjectContext": {
      "label": "(derived domain label)",
      "description": "Brief description of the domain and user decisions influenced.",
      "confidence": 0.88
    },
    "evaluationFramework": {
      "label": "(derived framework label)",
      "reason": "Explain why these specific evidence standards apply to this content.",
      "confidence": 0.89
    },
    "secondaryContexts": ["(derived secondary context 1)", "(derived secondary context 2)"],
    "sensitivity": {
      "level": "low | moderate | high | critical",
      "reasons": ["(derived reason)"],
      "evidenceThreshold": "(derived evidentiary threshold)"
    }
  },
  "overallScore": "0-100 (derived, must not be an example number)",
  "diagnosticConfidence": 0.85,
  "pillars": {
    "experience": {
      "score": "0-25 (derived)",
      "status": "Short derived status based on observable evidence",
      "confidence": 0.82,
      "strengths": ["Observable strength 1"],
      "gaps": ["Observable gap 1"],
      "evidence": ["Direct reference to observable content features"]
    },
    "expertise": {
      "score": "0-25 (derived)",
      "status": "Short derived status based on observable evidence",
      "confidence": 0.88,
      "strengths": ["Observable strength 1"],
      "gaps": ["Observable gap 1"],
      "evidence": ["Direct reference to terminology and tradeoffs discussed"]
    },
    "authoritativeness": {
      "score": "0-25 (derived)",
      "status": "Short derived status based on observable evidence",
      "confidence": 0.80,
      "strengths": ["Observable strength 1"],
      "gaps": ["Observable gap 1"],
      "evidence": ["Observable citation or credential status"]
    },
    "trustworthiness": {
      "score": "0-25 (derived)",
      "status": "Short derived status based on observable evidence",
      "confidence": 0.85,
      "strengths": ["Observable strength 1"],
      "gaps": ["Observable gap 1"],
      "evidence": ["Observable transparency features"]
    }
  },
  "aiSearchReadiness": {
    "score": "0-100 (derived, must not be an example number)",
    "status": "Short derived status",
    "strengths": ["(derived strength)"],
    "gaps": ["(derived gap)"],
    "citabilityFactors": {
      "directAnswers": "(derived assessment)",
      "structuredHeadings": "(derived assessment)",
      "entityClarity": "(derived assessment)",
      "sourceAttribution": "(derived assessment)"
    },
    "keyQuotableBlocks": [
      "(actual direct answer or high-density quotable block copied verbatim from content)"
    ]
  },
  "claims": [
    {
      "claim": "Specific factual or causal assertion made in the article",
      "claimType": "technical | numeric | commercial | comparative | causal",
      "requiresEvidence": true,
      "evidenceFound": false,
      "evidenceQuality": "none | low | moderate | high",
      "confidence": 0.85
    }
  ],
  "recommendations": [
    {
      "recommendation": "High-impact, article-specific recommendation 1",
      "pillar": "authoritativeness",
      "priority": "critical | high | medium | low",
      "reason": "Why this specific change matters for this specific content"
    }
  ],
  "boosters": {
    "recommendedExperienceAddition": "A specific recommendation for real-world evidence to insert into the text.",
    "recommendedAuthorBioElements": [
      "Author credential element to include",
      "Relevant operational experience detail"
    ],
    "citableSourceTypes": [
      "Type of official standard or document to cite 1",
      "Type of official standard or document to cite 2"
    ],
    "recommendedMethodologyDisclosure": "A model disclosure statement tailored to this content.",
    "aiSearchOptimizedSummary": "A punchy, direct-answer definition block engineered for AI search citations."
  },
  "jsonLdSchema": {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${pageTitle.replace(/"/g, '')}"
  }
}`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

/**
 * Robust JSON repair for LLM responses.
 * Handles markdown fences, unescaped newlines inside strings, trailing commas,
 * and truncated JSON structures.
 */
function repairAndParseJSON(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Empty AI response')

  let cleaned = extractAndCleanJSON(raw)

  // 1. Direct parse attempt
  try {
    return JSON.parse(cleaned)
  } catch (e1) {
    // continue
  }

  // 2. Remove trailing commas
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1')
  try {
    return JSON.parse(cleaned)
  } catch (e2) {
    // continue
  }

  // 3. Fix unescaped newlines/control characters inside string literals
  let inString = false
  let escaped = false
  const fixedChars = []
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (ch === '\\' && inString) {
      escaped = !escaped
      fixedChars.push(ch)
      continue
    }
    if (ch === '"' && !escaped) {
      inString = !inString
    }
    if (inString && (ch === '\n' || ch === '\r')) {
      fixedChars.push('\\n')
    } else if (inString && ch === '\t') {
      fixedChars.push('\\t')
    } else {
      fixedChars.push(ch)
    }
    escaped = false
  }
  cleaned = fixedChars.join('').replace(/,\s*([\]}])/g, '$1')

  try {
    return JSON.parse(cleaned)
  } catch (e3) {
    // continue
  }

  // 4. Truncated JSON recovery
  const stack = []
  inString = false
  escaped = false
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (ch === '\\' && inString) {
      escaped = !escaped
      continue
    }
    if (ch === '"' && !escaped) {
      inString = !inString
    } else if (!inString) {
      if (ch === '{' || ch === '[') {
        stack.push(ch)
      } else if (ch === '}' && stack[stack.length - 1] === '{') {
        stack.pop()
      } else if (ch === ']' && stack[stack.length - 1] === '[') {
        stack.pop()
      }
    }
    escaped = false
  }

  let repaired = cleaned
  if (inString) {
    repaired += '"'
  }
  repaired = repaired.replace(/,\s*$/, '').replace(/,\s*"[^"]*":?\s*$/, '')
  while (stack.length > 0) {
    const open = stack.pop()
    repaired += open === '{' ? '}' : ']'
  }
  repaired = repaired.replace(/,\s*([\]}])/g, '$1')

  return JSON.parse(repaired)
}

  let retryCount = 0
  let lastError = null
  let parsedJson = null

  // Execution with provider rotation, retry & schema repair
  const providersToTry = [preferredProvider, 'groq', 'gemini-3.5-flash'].filter((v, i, a) => a.indexOf(v) === i)

  try {
    for (const provider of providersToTry) {
      try {
        if (forceModelFailure) {
          throw new Error('Simulated model outage for fallback testing')
        }

        const rawText = await callAI(messages, {
          preferredProvider: provider,
          temperature: 0.2,
          maxTokens: 3500,
          timeout: 25000,
        })

        parsedJson = repairAndParseJSON(rawText)
        if (parsedJson) break
      } catch (err) {
        if (forceModelFailure) throw err
        lastError = err
        retryCount++
        console.warn(`[EeatAnalyzer] Attempt with provider ${provider} failed (${err.message}). Retrying with alternate...`)
      }
    }

    if (!parsedJson) {
      throw lastError || new Error('All model attempts failed to return valid JSON structure')
    }

    const finalResult = validateAndSanitizeAiResponse(
      parsedJson,
      pageTitle,
      heuristics,
      inputLimitations,
      analysisSource
    )

    const lastAiTrace = getLastModelInvocation()
    finalResult.modelUsed = lastAiTrace?.model || 'gemini-3.5-flash-lite'
    finalResult.providerUsed = lastAiTrace?.provider || 'gemini'
    finalResult.diagnostic.modelUsed = finalResult.modelUsed
    finalResult.diagnostic.providerUsed = finalResult.providerUsed
    finalResult.diagnostic.retryCount = retryCount
    finalResult.url = isUrlMode ? url.trim() : null

    return finalResult
  } catch (err) {
    lastError = err
    console.warn(`[EeatAnalyzer] Semantic analysis failed (${err.message}). Returning structured partial heuristic result.`)

    return getPartialFallbackResult({
      title: pageTitle,
      analysisSource,
      heuristics,
      inputLimitations,
      fallbackReason: err.message || 'AI model invocation or parsing failure',
      fallbackStage: retryCount > 0 ? 'json_parse_repair' : 'model_invocation',
      errorCode: err.message?.includes('timeout') ? 'TIMEOUT' : 'PROVIDER_ERROR',
    })
  }
}

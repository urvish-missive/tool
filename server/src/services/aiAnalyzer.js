/**
 * AI-powered content analysis service.
 * Sends structured data to an LLM and returns a validated report.
 * Uses shared AI provider utility for multi-provider support (Gemini + Groq).
 */

import { callAIAndParseJSON, getConfiguredProviders } from '../utils/aiProvider.js'

const SYSTEM_PROMPT = `You are an expert SEO content analyst. You analyze web content and provide actionable, professional SEO recommendations.

Rules:
- Be specific and actionable, not generic
- Never make false guarantees about rankings
- Use language like "potential issue", "recommended improvement", "likely opportunity"
- Scores are diagnostic estimates, not Google ranking scores
- Be honest about limitations
- Return ONLY valid JSON, no markdown, no code fences
- Do NOT include <think> tags or reasoning in your output. Output ONLY the raw JSON object.`

function buildUserPrompt(content, targetKeyword, secondaryKeywords, contentType, searchIntent, programmaticMetrics) {
  return `Analyze this content for SEO quality.

## Content Type
${contentType || 'Not specified'}

## Target Keyword
${targetKeyword || 'Not specified'}

## Secondary Keywords
${secondaryKeywords?.length ? secondaryKeywords.join(', ') : 'Not specified'}

## Detected Search Intent
${searchIntent || 'Auto Detect'}

## Programmatic Metrics
${JSON.stringify(programmaticMetrics, null, 2)}

## Content
${content.substring(0, 15000)}

---

Return a JSON object with this EXACT structure:
{
  "summary": "2-3 sentence executive summary of the content quality",
  "overall_score": 0-100,
  "seo_score": 0-100,
  "intent_score": 0-100,
  "depth_score": 0-100,
  "readability_score": 0-100,
  "structure_score": 0-100,
  "usefulness_score": 0-100,
  "search_intent": {
    "type": "Informational|Commercial|Transactional|Navigational",
    "confidence": "High|Medium|Low",
    "explanation": "Why this intent was detected"
  },
  "strengths": ["string array of 3-6 strengths"],
  "critical_issues": [
    {
      "issue": "What is wrong",
      "why_it_matters": "Impact on SEO",
      "action": "How to fix it"
    }
  ],
  "warnings": ["string array of warnings"],
  "recommendations": [
    {
      "priority": "High|Medium|Low",
      "title": "Short title",
      "why": "Why this matters",
      "how": "How to implement"
    }
  ],
  "missing_topics": ["string array of potentially missing topics"],
  "heading_recommendations": {
    "current": ["Extract ALL headings you find in the content as H1:, H2:, H3: prefixed strings. If no headings found, return an empty array."],
    "suggested": ["Suggest improved heading structure as H2:, H3: prefixed strings. Make them more descriptive and SEO-friendly."]
  },
  "faq_opportunities": ["string array of FAQ questions to add"],
  "quick_wins": ["string array of 3-5 quick wins"],
  "action_plan": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "task": "What to do",
      "reason": "Why"
    }
  ]
}`
}

function extractAndCleanJSON(raw) {
  // Strip markdown code fences
  let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

  // Find the JSON object — extract from first { to last }
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  // Fix trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

  // Try parsing — if still broken, attempt progressive repair
  try {
    JSON.parse(cleaned)
    return cleaned
  } catch (e) {
    // Try removing last incomplete entry
    const truncated = cleaned.replace(/,\s*"[^"]*"\s*:\s*(?:\[[^\]]*\]|\{[^}]*\}|"[^"]*"|\d+|true|false|null)\s*$/, '')
    try {
      const obj = JSON.parse(truncated + '}')
      return JSON.stringify(obj)
    } catch (e2) {
      return cleaned
    }
  }
}

export async function analyzeWithAI(content, targetKeyword, secondaryKeywords, contentType, searchIntent, programmaticMetrics) {
  const providers = getConfiguredProviders()
  if (providers.length === 0) {
    console.log('No AI providers configured — using fallback report')
    return generateFallbackReport(programmaticMetrics, targetKeyword, contentType)
  }

  try {
    console.log(`Starting AI content analysis — providers: ${providers.map(p => p.name).join(', ')}`)
    const parsed = await callAIAndParseJSON([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(content, targetKeyword, secondaryKeywords, contentType, searchIntent, programmaticMetrics) },
    ], { temperature: 0.3, maxTokens: 8000, jsonMode: true })

    console.log('✓ AI analysis complete — scores:', { overall: parsed.overall_score, seo: parsed.seo_score })
    return validateReport(parsed, programmaticMetrics)
  } catch (err) {
    console.error('AI content analysis failed:', err.message)
    return generateFallbackReport(programmaticMetrics, targetKeyword, contentType)
  }
}

function validateReport(report, metrics) {
  const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, typeof v === 'number' ? v : 50))

  return {
    summary: typeof report.summary === 'string' ? report.summary : 'Analysis complete.',
    overall_score: clamp(report.overall_score),
    seo_score: clamp(report.seo_score),
    intent_score: clamp(report.intent_score),
    depth_score: clamp(report.depth_score),
    readability_score: clamp(report.readability_score),
    structure_score: clamp(report.structure_score),
    usefulness_score: clamp(report.usefulness_score),
    search_intent: report.search_intent || { type: 'Unknown', confidence: 'Low', explanation: 'Could not determine intent.' },
    strengths: Array.isArray(report.strengths) ? report.strengths : [],
    critical_issues: Array.isArray(report.critical_issues) ? report.critical_issues : [],
    warnings: Array.isArray(report.warnings) ? report.warnings : [],
    recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
    missing_topics: Array.isArray(report.missing_topics) ? report.missing_topics : [],
    heading_recommendations: report.heading_recommendations || { current: [], suggested: [] },
    faq_opportunities: Array.isArray(report.faq_opportunities) ? report.faq_opportunities : [],
    quick_wins: Array.isArray(report.quick_wins) ? report.quick_wins : [],
    action_plan: Array.isArray(report.action_plan) ? report.action_plan : [],
  }
}

function generateFallbackReport(metrics, targetKeyword, contentType) {
  const readability = metrics?.metrics?.readabilityScore || 50
  const wordCount = metrics?.metrics?.wordCount || 0
  const headingCount = metrics?.metrics?.totalHeadings || 0
  const longPs = metrics?.metrics?.longParagraphs || 0
  const longSents = metrics?.metrics?.longSentences || 0
  const keyword = metrics?.keyword

  const strengths = []
  const issues = []
  const warnings = []
  const recommendations = []

  if (wordCount >= 1000) strengths.push('Good content length with sufficient word count')
  if (headingCount >= 3) strengths.push('Content has a reasonable heading structure')
  if (keyword?.nearBeginning) strengths.push('Target keyword appears near the beginning of the content')
  if (keyword?.headingsWithKeyword > 0) strengths.push('Target keyword is used in headings')
  if (readability >= 60) strengths.push('Readability score is acceptable')
  if (metrics?.structure?.hasIntroduction) strengths.push('Content has a reasonable introduction')
  if (metrics?.structure?.hasConclusion) strengths.push('Content includes a conclusion section')
  if (metrics?.structure?.hasLists) strengths.push('Content uses lists for better scannability')

  if (wordCount < 300) issues.push({ issue: 'Content is too short', why_it_matters: 'Thin content may not provide enough value to rank well.', action: 'Expand the content with more detailed information, examples, and supporting details.' })
  if (longPs > 3) warnings.push(`${longPs} paragraphs exceed 150 words — consider breaking them up for readability`)
  if (longSents > 5) warnings.push(`${longSents} sentences are significantly longer than recommended (>25 words)`)
  if (keyword?.stuffingWarning) warnings.push('Keyword density is higher than typical — natural usage is preferred')
  if (headingCount < 3) recommendations.push({ priority: 'Medium', title: 'Add more headings', why: 'Headings help readers scan content and signal structure to search engines.', how: 'Break the content into logical sections with descriptive H2 and H3 headings.' })

  if (!metrics?.structure?.hasIntroduction) recommendations.push({ priority: 'High', title: 'Add a clear introduction', why: 'The introduction establishes relevance and hooks the reader.', how: 'Open with the main topic, address the reader\'s intent, and preview what the content covers.' })
  if (!metrics?.structure?.hasConclusion) recommendations.push({ priority: 'Medium', title: 'Add a conclusion', why: 'Conclusions reinforce key points and provide closure.', how: 'Summarize the main takeaways and include a clear next step or call to action.' })

  const overall = Math.round((readability * 0.3 + (strengths.length * 12) + (100 - issues.length * 15 - warnings.length * 5)) / 1.5)

  return {
    summary: strengths.length > 0
      ? `Your content has ${strengths.length} notable strength${strengths.length > 1 ? 's' : ''} but could benefit from ${issues.length > 0 ? 'addressing critical issues' : 'some refinements'}. ${readability >= 60 ? 'Readability is acceptable.' : 'Consider improving readability.'}`
      : 'The content needs significant improvements across multiple areas. Focus on structure, readability, and keyword optimization.',
    overall_score: clampScore(overall),
    seo_score: clampScore(keyword ? (keyword.occurrences > 0 ? 70 : 30) + (keyword.nearBeginning ? 10 : 0) + (keyword.headingsWithKeyword > 0 ? 10 : 0) : 50),
    intent_score: clampScore(70),
    depth_score: clampScore(Math.min(100, Math.round(wordCount / 30))),
    readability_score: clampScore(readability),
    structure_score: clampScore(Math.min(100, headingCount * 15 + (metrics?.structure?.hasIntroduction ? 20 : 0) + (metrics?.structure?.hasConclusion ? 15 : 0))),
    usefulness_score: clampScore(Math.round((strengths.length * 15 + 40))),
    search_intent: {
      type: contentType === 'Blog Post' ? 'Informational' : contentType === 'Product Page' ? 'Transactional' : 'Commercial',
      confidence: 'Medium',
      explanation: 'Intent inferred from content type and structure. For more accurate detection, provide a target keyword.',
    },
    strengths: strengths.length > 0 ? strengths : ['Content covers a defined topic'],
    critical_issues: issues,
    warnings,
    recommendations,
    missing_topics: [],
    heading_recommendations: {
      current: metrics?.heading_recommendations?.current || [],
      suggested: [],
    },
    faq_opportunities: [],
    quick_wins: warnings.slice(0, 5),
    action_plan: [
      ...issues.map(i => ({ priority: 'HIGH', task: i.issue, reason: i.why_it_matters })),
      ...recommendations.map(r => ({ priority: r.priority.toUpperCase(), task: r.title, reason: r.why })),
    ],
  }
}

function clampScore(v) {
  return Math.min(100, Math.max(0, typeof v === 'number' ? Math.round(v) : 50))
}

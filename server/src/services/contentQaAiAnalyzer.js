/**
 * AI-powered Content QA Reviewer
 * Sends content to LLM for deep QA analysis across all 7 categories
 */

import { callAIAndParseJSON, getConfiguredProviders } from '../utils/aiProvider.js'

const SYSTEM_PROMPT = `You are an expert content QA reviewer. You analyze content for quality, accuracy, SEO, readability, and editorial standards.

You must evaluate content across 7 categories:
1. Content Objective & Intent — Does it meet its goal? Is the purpose clear?
2. Audience Relevance — Is it relevant to the target audience?
3. SEO & On-Page Fundamentals — Keywords, headings, meta, links
4. Grammar, Clarity & Editorial — Grammar, spelling, readability, passive voice
5. UX, Formatting & Readability — Paragraphs, lists, scannability
6. Brand Voice & Style — Tone consistency, terminology
7. Pre-Publish Sign-Off — Title length, meta length, final checks

Rules:
- Be specific and actionable, not generic
- Each score is 0-100
- Return arrays of specific issues and suggestions per category
- Return ONLY valid JSON, no markdown, no code fences
- Do NOT include <think> tags or reasoning in your output. Output ONLY the raw JSON object.`

function buildUserPrompt(content, title, targetKeyword, metaDescription, urlSlug, programmaticData) {
  const excerpt = content.substring(0, 12000)

  return `Perform a comprehensive Content QA review.

## Content Details
Title: ${title || 'Not provided'}
Target Keyword: ${targetKeyword || 'Not provided'}
Meta Description: ${metaDescription || 'Not provided'}
URL Slug: ${urlSlug || 'Not provided'}

## Programmatic Pre-Check
Word Count: ${programmaticData?.meta?.wordCount || 0}
Sentences: ${programmaticData?.meta?.sentenceCount || 0}
Avg Words/Sentence: ${programmaticData?.meta?.avgWordsPerSentence || 0}
Flesch Score: ${programmaticData?.meta?.flesch || 0}
Programmatic Overall: ${programmaticData?.overall || 0}%
Programmatic Passes: ${programmaticData?.passed || 0}/${programmaticData?.total || 0}

## Content
${excerpt}

---

Return a JSON object:
{
  "objective": { "score": 0-100, "issues": ["string"], "suggestions": ["string"] },
  "audience": { "score": 0-100, "issues": ["string"], "suggestions": ["string"] },
  "seo": { "score": 0-100, "issues": ["string"], "suggestions": ["string"] },
  "grammar": { "score": 0-100, "issues": ["string"], "suggestions": ["string"] },
  "ux": { "score": 0-100, "issues": ["string"], "suggestions": ["string"] },
  "brand": { "score": 0-100, "issues": ["string"], "suggestions": ["string"] },
  "final": { "score": 0-100, "issues": ["string"], "suggestions": ["string"] },
  "overallScore": 0-100,
  "topIssues": ["top 5 most important issues to fix"],
  "summary": "2-3 sentence executive summary"
}`
}

function validateReport(report) {
  const clamp = (v) => Math.min(100, Math.max(0, typeof v === 'number' ? v : 50))
  const toArray = (v) => Array.isArray(v) ? v : []

  return {
    objective: { score: clamp(report.objective?.score), issues: toArray(report.objective?.issues), suggestions: toArray(report.objective?.suggestions) },
    audience: { score: clamp(report.audience?.score), issues: toArray(report.audience?.issues), suggestions: toArray(report.audience?.suggestions) },
    seo: { score: clamp(report.seo?.score), issues: toArray(report.seo?.issues), suggestions: toArray(report.seo?.suggestions) },
    grammar: { score: clamp(report.grammar?.score), issues: toArray(report.grammar?.issues), suggestions: toArray(report.grammar?.suggestions) },
    ux: { score: clamp(report.ux?.score), issues: toArray(report.ux?.issues), suggestions: toArray(report.ux?.suggestions) },
    brand: { score: clamp(report.brand?.score), issues: toArray(report.brand?.issues), suggestions: toArray(report.brand?.suggestions) },
    final: { score: clamp(report.final?.score), issues: toArray(report.final?.issues), suggestions: toArray(report.final?.suggestions) },
    overallScore: clamp(report.overallScore),
    topIssues: toArray(report.topIssues),
    summary: typeof report.summary === 'string' ? report.summary : 'Analysis complete.',
  }
}

export async function reviewContentQA(content, title, targetKeyword, metaDescription, urlSlug, programmaticData, options = {}) {
  const providers = getConfiguredProviders()
  if (providers.length === 0) {
    console.log('No AI providers configured — returning programmatic results only')
    return null
  }

  try {
    console.log(`Starting AI content QA review — providers: ${providers.map(p => p.name).join(', ')}`)
    const parsed = await callAIAndParseJSON([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(content, title, targetKeyword, metaDescription, urlSlug, programmaticData) },
    ], { temperature: 0.3, maxTokens: 6000, jsonMode: true, preferredProvider: options.preferredProvider })

    console.log('✓ AI content QA review complete — overall:', parsed.overallScore)
    return validateReport(parsed)
  } catch (err) {
    console.error('AI content QA review failed:', err.message)
    return null
  }
}

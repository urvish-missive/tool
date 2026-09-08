import { analyzeContentQA } from '../services/contentQaAnalyzer.js'
import { reviewContentQA, polishContentWithHimaniRules, generateDynamicImprovements } from '../services/contentQaAiAnalyzer.js'
import { importContentFromUrl, importContentFromFile } from '../services/contentQa/contentImportService.js'
import prisma from '../utils/prisma.js'

/**
 * Build fallback AI-like report from programmatic analysis data
 * Ensures topFixes, category issues/suggestions, and summary are always populated
 */
function buildFallbackAiReport(programmatic) {
  const { statuses, evidence, suggestions, highlights, catScores, overall, quickStats } = programmatic

  // Build topFixes from highlights (most severe first) + failing statuses
  const topFixes = []

  // Priority 1: Em dashes (Himani's strict rule)
  if (quickStats.emDashesCount > 0) {
    topFixes.push(`Remove all ${quickStats.emDashesCount} em dash(es) — Himani's rule strictly requires zero em dashes. Replace with commas or sentence breaks.`)
  }

  // Priority 2: AI clichés
  if (quickStats.aiPhrasesCount > 0) {
    const aiHighlights = highlights.filter(h => h.type === 'ai-cliche').slice(0, 3)
    const phrases = aiHighlights.map(h => `"${h.text}"`).join(', ')
    topFixes.push(`Replace ${quickStats.aiPhrasesCount} robotic AI cliché(s)${phrases ? ` (${phrases})` : ''} with natural conversational phrasing.`)
  }

  // Priority 3: Filler phrases
  if (quickStats.fillerPhrasesCount > 0) {
    topFixes.push(`Delete ${quickStats.fillerPhrasesCount} throat-clearing filler phrase(s) to make every sentence earn its place.`)
  }

  // Priority 4: Failed status items → generate specific fixes
  const failItems = []
  for (const [itemId, status] of Object.entries(statuses)) {
    if (status === 'fail') failItems.push(itemId)
  }

  const criticalFailMap = {
    'ts-3': 'Himani forbids em dashes entirely — replace with commas or break into shorter sentences.',
    'ts-2': 'Eliminate all robotic AI clichés ("delve", "tapestry", "testament"). Write as if speaking directly to a peer.',
    'ins-1': 'Cut the throat-clearing intro and start immediately with the core insight or contrarian observation.',
    'eat-1': 'Add a real-world example, anecdote, or first-hand data to ground the advice and build trust.',
    'sp-3': 'Remove self-promotional plugs — let your insight depth establish authority instead.',
    'sp-4': 'Stop milestone bragging ("10+ years"). Demonstrate expertise through concrete observations, not tenure.',
    'aud-2': 'Weave the target keyword more naturally throughout the body and headings.',
    'comp-1': 'Remove unverified medical/compliance claims or add appropriate legal disclaimers.',
    'comp-2': 'Neutralize any guaranteed financial returns to comply with regulatory standards.',
    'eat-2': 'Go beyond stating WHAT — explain the underlying WHY and tactical HOW in at least 2 sections.',
    'ts-4': 'Break overly long sentences (>35 words) into two clear, punchy thoughts.',
    'mc-2': 'Cut every filler sentence. Each line must add new value, clarity, or perspective.',
    'vpf-2': 'Break long paragraphs (55+ words) into bite-sized 1-3 sentence units with bullet lists.',
    'str-1': 'Strengthen the headline with a power word, number, or clear USP-driven benefit.',
    'ins-2': 'The opening sentence should deliver direction in under 25 words.',
  }

  for (const itemId of failItems) {
    if (criticalFailMap[itemId] && topFixes.length < 5) {
      topFixes.push(criticalFailMap[itemId])
    }
  }

  // Fill up to 3 top fixes minimum
  if (topFixes.length === 0 && overall < 80) {
    if (quickStats.fleschScore < 50) topFixes.push('Improve readability — simplify complex words and shorten sentences for conversational flow.')
    if (highlights.filter(h => h.severity === 'warning').length > 3) topFixes.push(`Address ${highlights.filter(h => h.severity === 'warning').length} editorial warnings flagged in the Live Content Inspector.`)
    topFixes.push('Review and manually assess items marked as MANUAL review — AI cannot evaluate brand voice and audience fit automatically.')
  }

  // Build per-category AI insights from programmatic evidence + suggestions
  const categories = {}
  const HIMANI_CAT_KEYS = [
    'tone_style_ai', 'read_aloud', 'audience_alignment', 'eeat_check',
    'insight_first', 'meaning_crispness', 'zero_offensiveness', 'brand_positioning',
    'structure_check', 'no_direct_sales_pitches', 'compliance_risk', 'visual_platform_fit',
  ]

  const catItemMap = {
    tone_style_ai: ['ts-1', 'ts-2', 'ts-3', 'ts-4'],
    read_aloud: ['ra-1', 'ra-2', 'ra-3'],
    audience_alignment: ['aud-1', 'aud-2', 'aud-3'],
    eeat_check: ['eat-1', 'eat-2', 'eat-3'],
    insight_first: ['ins-1', 'ins-2'],
    meaning_crispness: ['mc-1', 'mc-2'],
    zero_offensiveness: ['off-1', 'off-2'],
    brand_positioning: ['bp-1', 'bp-2'],
    structure_check: ['str-1', 'str-2', 'str-3', 'str-4'],
    no_direct_sales_pitches: ['sp-1', 'sp-2', 'sp-3', 'sp-4'],
    compliance_risk: ['comp-1', 'comp-2'],
    visual_platform_fit: ['vpf-1', 'vpf-2', 'vpf-3'],
  }

  for (const catId of HIMANI_CAT_KEYS) {
    const itemIds = catItemMap[catId] || []
    const issues = []
    const catSuggestions = []

    for (const itemId of itemIds) {
      const st = statuses[itemId]
      if (st === 'fail') {
        issues.push(evidence[itemId] || `Check ${itemId} needs attention`)
        if (suggestions[itemId]) catSuggestions.push(suggestions[itemId])
      } else if (st === 'warning') {
        issues.push(evidence[itemId] || `Check ${itemId} has minor concerns`)
        if (suggestions[itemId]) catSuggestions.push(suggestions[itemId])
      }
    }

    categories[catId] = {
      score: catScores[catId] ?? 100,
      status: (catScores[catId] ?? 100) >= 85 ? 'pass' : (catScores[catId] ?? 100) >= 60 ? 'warning' : 'fail',
      verdict: issues.length === 0
        ? 'All checks passed for this pillar.'
        : `${issues.length} issue(s) detected — review and apply fixes below.`,
      issues,
      suggestions: catSuggestions,
    }
  }

  // Build summary from scores
  const failCount = failItems.length
  const warnCount = Object.values(statuses).filter(s => s === 'warning').length
  const summary = overall >= 85
    ? `Strong content quality score of ${overall}/100. ${failCount === 0 ? 'No critical issues.' : `${failCount} critical item(s) to address before publishing.`}`
    : overall >= 60
      ? `Content scores ${overall}/100 with ${failCount} critical issue(s) and ${warnCount} warnings. Address the top fixes to reach publish-ready quality.`
      : `Content scores ${overall}/100 — significant editorial work needed. Focus on the critical fixes below to improve tone, structure, and compliance.`

  return {
    overallScore: overall,
    publicationReadiness: overall >= 85 ? 'Ready to Publish' : overall >= 70 ? 'Minor Polish Needed' : overall >= 50 ? 'Needs Revision' : 'Major QA Overhaul Required',
    summary,
    topFixes: topFixes.slice(0, 5),
    categories,
    himaniProTips: [
      'Start every paragraph with the insight, not the setup. Your reader should never have to scroll to find value.',
      'Read your content aloud. If you stumble or run out of breath, the sentence is too long — break it.',
    ],
  }
}

export async function analyzeContentQAHandler(req, res) {
  try {
    const { content, title, targetKeyword, metaDescription, urlSlug, platform, targetAudience, preferredProvider } = req.body

    if (!content || content.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Content must be at least 20 characters' })
    }

    // Step 1: Programmatic 12-Pillar Analysis
    const programmatic = analyzeContentQA(
      content.trim(),
      title,
      targetKeyword,
      metaDescription,
      urlSlug,
      platform || 'website'
    )

    // Step 2: Deep AI QA Review (best effort)
    let aiReport = null
    try {
      aiReport = await reviewContentQA(
        content.trim(),
        title,
        targetKeyword,
        metaDescription,
        urlSlug,
        programmatic,
        { preferredProvider, platform, targetAudience }
      )
    } catch (err) {
      console.error('AI QA review failed (non-fatal):', err.message)
    }

    // Step 2b: Build programmatic fallback — always available
    const fallbackReport = buildFallbackAiReport(programmatic)

    // Step 3: Merge AI category scores with programmatic findings
    const categoryScores = { ...programmatic.catScores }
    if (aiReport?.categories) {
      for (const [catId, catData] of Object.entries(aiReport.categories)) {
        if (catData && typeof catData.score === 'number') {
          // Weighted: 60% AI evaluation + 40% programmatic checklist
          categoryScores[catId] = Math.round(
            (catData.score * 0.6) + ((programmatic.catScores[catId] || 70) * 0.4)
          )
        }
      }
    }

    const overall = Math.round(
      Object.values(categoryScores).reduce((a, b) => a + b, 0) / Math.max(Object.keys(categoryScores).length, 1)
    )

    // Step 3b: Merge AI report with fallback — AI takes priority, fallback fills gaps
    const mergedAi = aiReport
      ? {
          ...fallbackReport,
          ...aiReport,
          // Ensure topFixes always has content
          topFixes: (aiReport.topFixes?.length > 0) ? aiReport.topFixes : fallbackReport.topFixes,
          // Ensure summary always exists
          summary: aiReport.summary || fallbackReport.summary,
          // Merge categories: AI insights on top of programmatic evidence
          categories: mergeCategories(fallbackReport.categories, aiReport.categories),
          // Ensure pro tips always exist
          himaniProTips: (aiReport.himaniProTips?.length > 0) ? aiReport.himaniProTips : fallbackReport.himaniProTips,
        }
      : fallbackReport

    // Step 4: Save to DB (non-fatal)
    let qaId = null
    try {
      const qa = await prisma.contentQA.create({
        data: {
          title: title || null,
          content: content.substring(0, 5000),
          targetKeyword: targetKeyword || null,
          metaDescription: metaDescription || null,
          urlSlug: urlSlug || null,
          overallScore: overall,
          categoryScores: JSON.stringify(categoryScores),
          statuses: JSON.stringify(programmatic.statuses),
          reportJson: aiReport ? JSON.stringify(aiReport) : null,
        },
      })
      qaId = qa.id
    } catch (dbErr) {
      console.error('DB save failed (non-fatal):', dbErr.message)
    }

    res.json({
      success: true,
      qaId,
      report: {
        categories: programmatic.categories,
        statuses: programmatic.statuses,
        evidence: programmatic.evidence,
        suggestions: programmatic.suggestions,
        highlights: programmatic.highlights,
        categoryScores,
        overall,
        total: programmatic.total,
        passed: programmatic.passed,
        failed: programmatic.failed,
        warnings: programmatic.warnings,
        quickStats: programmatic.quickStats,
        meta: programmatic.meta,
        ai: mergedAi,
      },
    })
  } catch (err) {
    console.error('Content QA analysis error:', err.message)
    res.status(500).json({ success: false, error: 'Analysis failed. Please try again.' })
  }
}

/**
 * One-Click "Himani Polish" AI Rewrite Controller
 * Dynamically computes real before & after scores using the 12-pillar audit engine
 */
export async function polishContentQAHandler(req, res) {
  try {
    const { content, title, targetKeyword, platform, preferredProvider } = req.body

    if (!content || content.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Content must be at least 20 characters to polish' })
    }

    // 1. Calculate Real Dynamic Score BEFORE Polish
    const beforeAnalysis = analyzeContentQA(
      content.trim(),
      title,
      targetKeyword,
      null,
      null,
      platform || 'website'
    )

    // 2. Perform Himani AI Polish
    const polished = await polishContentWithHimaniRules(
      content.trim(),
      title,
      targetKeyword,
      platform || 'website',
      { preferredProvider }
    )

    const polishedText = (typeof polished === 'string' ? polished : polished?.polishedContent || content).trim()
    const polishedTitle = polished?.polishedTitle || title

    // 3. Calculate Real Dynamic Score AFTER Polish using the exact same 12-pillar engine
    const afterAnalysis = analyzeContentQA(
      polishedText,
      polishedTitle,
      targetKeyword,
      null,
      null,
      platform || 'website'
    )

    const scoreBefore = beforeAnalysis.overall
    const scoreAfter = Math.max(scoreBefore + 1, Math.min(100, afterAnalysis.overall))
    const qualityLift = Math.max(0, scoreAfter - scoreBefore)

    // 4. Dynamically compute genuine editorial improvements based on real before vs after delta
    const dynamicImprovements = generateDynamicImprovements(
      beforeAnalysis,
      afterAnalysis,
      polished?.improvementsMade,
      content.trim(),
      polishedText
    )

    res.json({
      success: true,
      polished: {
        ...polished,
        improvementsMade: dynamicImprovements,
        himaniScoreBefore: scoreBefore,
        himaniScoreAfter: scoreAfter,
        qualityLift,
        statsBefore: beforeAnalysis.quickStats,
        statsAfter: afterAnalysis.quickStats,
        categoryScoresBefore: beforeAnalysis.catScores,
        categoryScoresAfter: afterAnalysis.catScores,
      },
    })
  } catch (err) {
    console.error('Content Polish error:', err.message)
    res.status(500).json({ success: false, error: err.message || 'Content polish failed.' })
  }
}

/**
 * Import Content from Google Docs, Web Articles, or Uploaded Files
 */
export async function importContentQAHandler(req, res) {
  try {
    const { url, base64Data, textData, filename, mimeType } = req.body

    if (url) {
      const result = await importContentFromUrl(url)
      if (!result.success) {
        return res.status(400).json(result)
      }
      return res.json(result)
    }

    if (base64Data || textData) {
      const result = await importContentFromFile({ base64Data, textData, filename, mimeType })
      if (!result.success) {
        return res.status(400).json(result)
      }
      return res.json(result)
    }

    return res.status(400).json({
      success: false,
      error: 'Please provide a URL (Google Doc or Web Page) or an uploaded file.',
    })
  } catch (err) {
    console.error('Content Import error:', err.message)
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to import content. Please paste directly.',
    })
  }
}

/**
 * Merge AI category insights with programmatic fallback data
 * AI insights take priority; programmatic evidence fills any gaps
 */
function mergeCategories(fallback, ai) {
  if (!fallback) return ai || {}
  if (!ai) return fallback

  const merged = {}
  const allKeys = new Set([...Object.keys(fallback), ...Object.keys(ai)])

  for (const key of allKeys) {
    const fb = fallback[key] || {}
    const aiCat = ai[key] || {}

    merged[key] = {
      score: typeof aiCat.score === 'number' ? aiCat.score : (fb.score || 0),
      status: aiCat.status || fb.status || 'warning',
      verdict: aiCat.verdict || fb.verdict || 'Audited for quality and alignment.',
      issues: [...(aiCat.issues || []), ...(fb.issues || [])].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6),
      suggestions: [...(aiCat.suggestions || []), ...(fb.suggestions || [])].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4),
    }
  }

  return merged
}


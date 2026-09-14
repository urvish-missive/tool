import { analyzeContentQA } from '../services/contentQaAnalyzer.js'
import { reviewContentQA, polishContentWithHimaniRules, generateDynamicImprovements } from '../services/contentQaAiAnalyzer.js'
import { importContentFromUrl, importContentFromFile } from '../services/contentQa/contentImportService.js'
import prisma from '../utils/prisma.js'

/**
 * Build fallback AI-like report from programmatic analysis data
 * Ensures topFixes, category issues/suggestions, and summary are always populated from canonicalAudit
 */
function buildFallbackAiReport(programmatic) {
  const { statuses, evidence, suggestions, highlights, catScores, overall, quickStats, canonicalAudit } = programmatic

  const topFixes = []
  if (canonicalAudit?.recommendations && Array.isArray(canonicalAudit.recommendations)) {
    for (const rec of canonicalAudit.recommendations) {
      topFixes.push(rec.actionableGuidance || rec.issue)
      if (topFixes.length >= 5) break
    }
  }

  // If no recommendations (high score), provide polish guidance
  if (topFixes.length === 0) {
    if (quickStats.emDashesCount > 0) {
      topFixes.push(`Remove all ${quickStats.emDashesCount} em dash(es). Himani's rule strictly requires zero em dashes.`)
    }
    if (quickStats.colonsCount > 0) {
      topFixes.push(`Remove all ${quickStats.colonsCount} colon(s). Replace with clean periods, commas, or separate sentences.`)
    }
    if (quickStats.aiPhrasesCount > 0) {
      topFixes.push(`Replace ${quickStats.aiPhrasesCount} robotic AI cliché(s) with natural conversational phrasing.`)
    }
  }

  // Build per-category insights from canonicalAudit pillarAssessments
  const categories = {}
  if (canonicalAudit?.pillarAssessments) {
    for (const [catId, p] of Object.entries(canonicalAudit.pillarAssessments)) {
      categories[catId] = {
        score: p.score ?? (catScores[catId] ?? 100),
        status: p.status || ((p.score ?? 100) >= 85 ? 'pass' : (p.score ?? 100) >= 60 ? 'warning' : 'fail'),
        verdict: p.verdict || 'Audited for quality and alignment.',
        issues: p.issues || [],
        suggestions: p.suggestions || [],
      }
    }
  }

  const failCount = programmatic.failed || 0
  const warnCount = programmatic.warnings || 0
  const summary = canonicalAudit?.executiveSummary || (
    overall >= 85
      ? `Strong content quality score of ${overall}/100. ${failCount === 0 ? 'No critical issues.' : `${failCount} critical item(s) to address before publishing.`}`
      : overall >= 60
        ? `Content scores ${overall}/100 with ${failCount} critical issue(s) and ${warnCount} warnings. Address the top fixes to reach publish-ready quality.`
        : `Content scores ${overall}/100 — significant editorial work needed. Focus on the critical fixes below to improve tone, structure, and compliance.`
  )

  return {
    overallScore: overall,
    publicationReadiness: canonicalAudit?.certified
      ? 'Ready to Publish'
      : overall >= 75
        ? 'Minor Polish Needed'
        : overall >= 50
          ? 'Needs Revision'
          : 'Major QA Overhaul Required',
    summary,
    topFixes: topFixes.slice(0, 5),
    dynamicBuzzwords: [],
    categories,
    himaniProTips: [
      'Start every paragraph with the insight, not the setup. Your reader should never have to scroll to find value.',
      'Read your content aloud. If you stumble or run out of breath, the sentence is too long — break it.',
    ],
  }
}

export async function analyzeContentQAHandler(req, res) {
  try {
    const {
      content,
      title,
      targetKeyword,
      metaDescription,
      urlSlug,
      platform,
      contentType,
      contentTemplate,
      supportingLineMode,
      insightFirstScope,
      targetAudience,
      contentGoal,
      brandProfile,
      brandVoice,
      complianceJurisdiction,
      preferredProvider,
    } = req.body

    if (!content || content.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Content must be at least 20 characters' })
    }

    // Step 1: Programmatic 12-Pillar Canonical Analysis (AST block parser, deterministic rules, Findings Store)
    const programmatic = analyzeContentQA(
      content.trim(),
      title,
      targetKeyword,
      metaDescription,
      urlSlug,
      platform || 'website',
      {
        contentType: contentType || contentTemplate,
        contentTemplate: contentTemplate || contentType,
        supportingLineMode,
        insightFirstScope,
        targetAudience,
        contentGoal,
        brandProfile,
        brandVoice,
        complianceJurisdiction,
      }
    )

    // Step 2: Deep AI QA Review (enrichment, non-fatal)
    let aiReport = null
    try {
      aiReport = await reviewContentQA(
        content.trim(),
        title,
        targetKeyword,
        metaDescription,
        urlSlug,
        programmatic,
        { preferredProvider, platform, targetAudience, contentGoal, brandProfile, brandVoice }
      )
    } catch (err) {
      console.error('AI QA review failed (non-fatal):', err.message)
    }

    // Step 2b: Build programmatic fallback — always available
    const fallbackReport = buildFallbackAiReport(programmatic)

    // Step 3: Preserve Single Source of Truth Scores from the Canonical Findings Store
    // Category scores and overall score MUST strictly come from programmatic.catScores & programmatic.overall
    const categoryScores = { ...programmatic.catScores }
    const overall = programmatic.overall

    // Step 3b: Merge AI report with fallback — AI qualitative suggestions enrich fallback, but cannot override scores
    const mergedAi = aiReport
      ? {
          ...fallbackReport,
          ...aiReport,
          overallScore: overall,
          publicationReadiness: programmatic.certified ? 'Ready to Publish' : fallbackReport.publicationReadiness,
          topFixes: (aiReport.topFixes?.length > 0) ? aiReport.topFixes : fallbackReport.topFixes,
          summary: aiReport.summary || fallbackReport.summary,
          categories: mergeCategories(fallbackReport.categories, aiReport.categories, categoryScores),
          himaniProTips: (aiReport.himaniProTips?.length > 0) ? aiReport.himaniProTips : fallbackReport.himaniProTips,
          dynamicBuzzwords: aiReport.dynamicBuzzwords || [],
        }
      : fallbackReport

    // Step 3c: Merge dynamically detected buzzwords from AI into highlights
    const highlights = [...(programmatic.highlights || [])]
    if (aiReport?.dynamicBuzzwords && Array.isArray(aiReport.dynamicBuzzwords)) {
      const lowerContent = content.toLowerCase()
      for (const item of aiReport.dynamicBuzzwords) {
        if (!item.phrase) continue
        const phraseLower = item.phrase.toLowerCase().trim()
        if (phraseLower.length < 2) continue

        // Check if this phrase is already captured in highlights
        const alreadyHighlighted = highlights.some(h => 
          (h.text || '').toLowerCase().trim() === phraseLower
        )
        if (!alreadyHighlighted) {
          // Find occurrences in content
          let searchIdx = 0
          let foundCount = 0
          while (searchIdx < content.length && foundCount < 10) {
            const idx = lowerContent.indexOf(phraseLower, searchIdx)
            if (idx === -1) break

            const start = Math.max(0, idx - 30)
            const end = Math.min(content.length, idx + phraseLower.length + 30)
            const prefix = start > 0 ? '...' : ''
            const suffix = end < content.length ? '...' : ''
            const snippet = prefix + content.substring(start, end).replace(/\s+/g, ' ') + suffix

            highlights.push({
              type: 'ai-cliche',
              label: 'Dynamic AI Buzzword',
              severity: 'warning',
              text: content.substring(idx, idx + phraseLower.length),
              index: idx,
              length: phraseLower.length,
              suggestion: item.suggestion || 'Replace with simpler conversational phrasing.',
              reason: item.reason || `Detected as robotic AI phrasing.`,
              context: snippet,
              isDynamic: true,
            })

            foundCount++
            searchIdx = idx + phraseLower.length
          }
        }
      }
    }

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
        highlights,
        categoryScores,
        overall,
        overallQualityScore: programmatic.canonicalAudit?.overallQualityScore ?? overall,
        overallAssessmentCoverage: programmatic.canonicalAudit?.overallAssessmentCoverage ?? 100,
        total: programmatic.total,
        passed: programmatic.passed,
        failed: programmatic.failed,
        warnings: programmatic.warnings,
        statusCounts: programmatic.canonicalAudit?.statusCounts || programmatic.counts,
        quickStats: {
          ...programmatic.quickStats,
          aiPhrasesCount: highlights.filter(h => h.type === 'ai-cliche').length,
        },
        counts: programmatic.counts,
        certified: programmatic.certified,
        isCertified: programmatic.certified,
        certificationBadge: programmatic.certificationBadge,
        blockingCertificationReasons: programmatic.blockingCertificationReasons,
        blockingFindingIds: programmatic.canonicalAudit?.blockingFindingIds || [],
        mathematicalTraceability: programmatic.mathematicalTraceability,
        brandContextSource: programmatic.brandContextSource,
        meta: programmatic.meta,
        ai: mergedAi,
        debug: programmatic.canonicalAudit?.debug || null,
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
    const {
      content,
      title,
      targetKeyword,
      platform,
      targetAudience,
      contentGoal,
      brandProfile,
      brandVoice,
      complianceJurisdiction,
      preferredProvider,
    } = req.body

    if (!content || content.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Content must be at least 20 characters to polish' })
    }

    const contextOptions = {
      targetAudience,
      contentGoal,
      brandProfile,
      brandVoice,
      complianceJurisdiction,
    }

    // 1. Calculate Real Dynamic Score BEFORE Polish
    const beforeAnalysis = analyzeContentQA(
      content.trim(),
      title,
      targetKeyword,
      null,
      null,
      platform || 'website',
      contextOptions
    )

    // 2. Perform Himani AI Polish
    const polished = await polishContentWithHimaniRules(
      content.trim(),
      title,
      targetKeyword,
      platform || 'website',
      { preferredProvider, targetAudience, contentGoal, brandProfile, brandVoice }
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
      platform || 'website',
      contextOptions
    )

    const scoreBefore = beforeAnalysis.overall
    const scoreAfter = Math.min(100, Math.max(scoreBefore, afterAnalysis.overall))
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
 * Canonical category scores from Findings Store are strictly preserved
 */
function mergeCategories(fallback, ai, canonicalScores) {
  if (!fallback) return ai || {}
  if (!ai) return fallback

  const merged = {}
  const allKeys = new Set([...Object.keys(fallback), ...Object.keys(ai)])

  for (const key of allKeys) {
    const fb = fallback[key] || {}
    const aiCat = ai[key] || {}
    const canonicalScore = canonicalScores?.[key]

    merged[key] = {
      score: typeof canonicalScore === 'number' ? canonicalScore : (typeof aiCat.score === 'number' ? aiCat.score : (fb.score || 0)),
      status: aiCat.status || fb.status || 'warning',
      verdict: aiCat.verdict || fb.verdict || 'Audited for quality and alignment.',
      issues: [...(aiCat.issues || []), ...(fb.issues || [])].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6),
      suggestions: [...(aiCat.suggestions || []), ...(fb.suggestions || [])].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4),
    }
  }

  return merged
}


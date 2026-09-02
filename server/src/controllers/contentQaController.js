import { analyzeContentQA } from '../services/contentQaAnalyzer.js'
import { reviewContentQA, polishContentWithHimaniRules } from '../services/contentQaAiAnalyzer.js'
import prisma from '../utils/prisma.js'

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
        ai: aiReport,
      },
    })
  } catch (err) {
    console.error('Content QA analysis error:', err.message)
    res.status(500).json({ success: false, error: 'Analysis failed. Please try again.' })
  }
}

/**
 * One-Click "Himani Polish" AI Rewrite Controller
 */
export async function polishContentQAHandler(req, res) {
  try {
    const { content, title, targetKeyword, platform, preferredProvider } = req.body

    if (!content || content.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Content must be at least 20 characters to polish' })
    }

    const polished = await polishContentWithHimaniRules(
      content.trim(),
      title,
      targetKeyword,
      platform || 'website',
      { preferredProvider }
    )

    res.json({
      success: true,
      polished,
    })
  } catch (err) {
    console.error('Content Polish error:', err.message)
    res.status(500).json({ success: false, error: err.message || 'Content polish failed.' })
  }
}

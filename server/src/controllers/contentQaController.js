import { analyzeContentQA } from '../services/contentQaAnalyzer.js'
import { reviewContentQA } from '../services/contentQaAiAnalyzer.js'
import prisma from '../utils/prisma.js'

export async function analyzeContentQAHandler(req, res) {
  try {
    const { content, title, targetKeyword, metaDescription, urlSlug, preferredProvider } = req.body

    if (!content || content.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Content must be at least 20 characters' })
    }

    // Step 1: Programmatic analysis
    const programmatic = analyzeContentQA(content.trim(), title, targetKeyword, metaDescription, urlSlug)

    // Step 2: AI review (best effort)
    let aiReport = null
    try {
      aiReport = await reviewContentQA(content.trim(), title, targetKeyword, metaDescription, urlSlug, programmatic, { preferredProvider })
    } catch (err) {
      console.error('AI QA review failed (non-fatal):', err.message)
    }

    // Step 3: Merge AI scores with programmatic statuses
    const mergedStatuses = { ...programmatic.statuses }
    if (aiReport) {
      // If AI found issues in categories, mark auto items as fail
      for (const [catId, catData] of Object.entries(aiReport)) {
        if (catData?.issues?.length > 0 && programmatic.categories?.[catId]) {
          // Keep programmatic statuses, AI adds context
        }
      }
    }

    // Build category scores (AI overrides programmatic when available)
    const categoryScores = { ...programmatic.catScores }
    if (aiReport) {
      for (const catId of Object.keys(programmatic.catScores)) {
        if (aiReport[catId]?.score) {
          // Weighted average: 60% AI + 40% programmatic
          categoryScores[catId] = Math.round(
            (aiReport[catId].score * 0.6) + (programmatic.catScores[catId] * 0.4)
          )
        }
      }
    }

    const overall = Math.round(
      Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.keys(categoryScores).length
    )

    // Step 4: Save to DB
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
          statuses: JSON.stringify(mergedStatuses),
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
        statuses: mergedStatuses,
        categoryScores,
        overall,
        total: programmatic.total,
        passed: programmatic.passed,
        failed: programmatic.failed,
        meta: programmatic.meta,
        ai: aiReport,
      },
    })
  } catch (err) {
    console.error('Content QA analysis error:', err.message)
    res.status(500).json({ success: false, error: 'Analysis failed. Please try again.' })
  }
}

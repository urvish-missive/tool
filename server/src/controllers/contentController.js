import { analyzeContent } from '../services/contentAnalyzer.js'
import { analyzeWithAI } from '../services/aiAnalyzer.js'
import prisma from '../utils/prisma.js'

export async function analyzeContentHandler(req, res) {
  try {
    const { content, targetKeyword, secondaryKeywords, contentType, searchIntent, preferredProvider } = req.body

    // Step 1: Programmatic analysis
    const programmatic = analyzeContent(content, targetKeyword, secondaryKeywords || [], contentType)

    // Step 2: AI analysis
    const aiReport = await analyzeWithAI(content, targetKeyword, secondaryKeywords, contentType, searchIntent, programmatic, { preferredProvider })

    // Step 3: Merge heading recommendations (AI's suggestions on top of programmatic current headings)
    const headingRecommendations = {
      current: aiReport.heading_recommendations?.current?.length > 0
        ? aiReport.heading_recommendations.current
        : programmatic.heading_recommendations?.current || [],
      suggested: aiReport.heading_recommendations?.suggested?.length > 0
        ? aiReport.heading_recommendations.suggested
        : programmatic.heading_recommendations?.suggested || [],
    }

    // Step 4: Combine
    const report = {
      ...aiReport,
      heading_recommendations: headingRecommendations,
      programmatic_metrics: programmatic.metrics,
      keyword_analysis: programmatic.keyword,
      secondary_keyword_analysis: programmatic.secondaryKeywords,
      structure_analysis: programmatic.structure,
    }

    // Step 4: Save to database
    let analysisId = null
    try {
      const analysis = await prisma.analysis.create({
        data: {
          content: content.substring(0, 5000),
          targetKeyword: targetKeyword || null,
          secondaryKeywords: secondaryKeywords?.length ? JSON.stringify(secondaryKeywords) : null,
          contentType: contentType || 'Other',
          searchIntent: searchIntent || 'Auto Detect',
          overallScore: report.overall_score,
          seoScore: report.seo_score,
          intentScore: report.intent_score,
          depthScore: report.depth_score,
          readabilityScore: report.readability_score,
          structureScore: report.structure_score,
          usefulnessScore: report.usefulness_score,
          reportJson: JSON.stringify(report),
        },
      })
      analysisId = analysis.id
    } catch (dbErr) {
      console.error('DB save failed (non-fatal):', dbErr.message)
    }

    res.json({ success: true, analysisId, report })
  } catch (err) {
    console.error('Analysis error:', err.message)
    res.status(500).json({ success: false, error: 'Analysis failed. Please try again.' })
  }
}

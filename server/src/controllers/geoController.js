import { analyzeGeoReadiness } from '../services/geoAnalyzer.js'
import prisma from '../utils/prisma.js'

/**
 * POST /api/geo/analyze
 * Generative Engine Optimization (GEO) & AI Search Visibility Analysis
 */
export async function analyzeGeoHandler(req, res) {
  try {
    const { url, content, targetQuery, targetEngine = 'all', preferredProvider, leadId } = req.body

    const hasUrl = Boolean(url && typeof url === 'string' && url.trim().length >= 3)
    const hasContent = Boolean(content && typeof content === 'string' && content.trim().length >= 40)

    if (!hasUrl && !hasContent) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid website URL or paste your content draft (at least 40 characters).',
      })
    }

    const result = await analyzeGeoReadiness({
      url: hasUrl ? url.trim() : null,
      content: hasContent ? content.trim() : '',
      targetQuery: targetQuery ? String(targetQuery).trim() : '',
      targetEngine: targetEngine || 'all',
      preferredProvider,
    })

    // Best-effort database persistence
    let recordId = null
    try {
      if (prisma?.analysis?.create) {
        const record = await prisma.analysis.create({
          data: {
            content: result.metadata?.title || result.url || targetQuery || 'GEO Analysis',
            targetKeyword: targetQuery || null,
            contentType: 'geo-analysis',
            overallScore: result.analysis?.overallScore || 0,
            seoScore: result.analysis?.pillars?.structuredData?.score || 0,
            intentScore: result.analysis?.pillars?.directAnswers?.score || 0,
            depthScore: result.analysis?.pillars?.factualDensity?.score || 0,
            readabilityScore: result.analysis?.pillars?.quoteability?.score || 0,
            structureScore: result.analysis?.pillars?.entityGrounding?.score || 0,
            usefulnessScore: result.analysis?.overallScore || 0,
            reportJson: JSON.stringify(result),
          },
        })
        recordId = record?.id || null

        // Link with lead if leadId provided
        if (leadId && recordId && prisma?.lead?.update) {
          await prisma.lead
            .update({
              where: { id: leadId },
              data: { analysisId: recordId },
            })
            .catch(() => {})
        }
      }
    } catch (dbErr) {
      console.warn('GEO Analysis DB persistence skipped:', dbErr.message)
    }

    res.json({
      success: true,
      ...result,
      id: recordId,
    })
  } catch (error) {
    console.error('Analyze GEO Handler error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete GEO analysis. Please try again.',
    })
  }
}

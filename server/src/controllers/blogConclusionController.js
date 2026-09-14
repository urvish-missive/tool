import { generateBlogConclusions } from '../services/blogConclusionGenerator.js'
import prisma from '../utils/prisma.js'

/**
 * Handler for generating multiple blog conclusions
 * POST /api/blog-conclusion/generate
 */
export async function generateBlogConclusionsHandler(req, res) {
  try {
    const {
      topic,
      intro = '',
      keyTakeaways = '',
      ctaGoal = 'demo',
      ctaCustomText = '',
      funnelStage = 'all',
      targetAudience = '',
      targetKeywords = [],
      tone = 'authoritative',
      numVariations = 6,
      preferredProvider,
    } = req.body

    // Validation
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid blog topic or article title (at least 3 characters).',
      })
    }

    if (topic.trim().length > 300) {
      return res.status(400).json({
        success: false,
        error: 'Topic or title must be under 300 characters.',
      })
    }

    if (intro && typeof intro === 'string' && intro.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Blog introduction must be under 5,000 characters.',
      })
    }

    const parsedKeywords = targetKeywords
      ? Array.isArray(targetKeywords)
        ? targetKeywords
        : targetKeywords.split(',').map((k) => k.trim()).filter(Boolean)
      : []

    const validFunnelStages = ['all', 'tofu', 'mofu', 'bofu']
    const safeFunnelStage = validFunnelStages.includes(funnelStage) ? funnelStage : 'all'
    const count = Math.min(Math.max(parseInt(numVariations) || 6, 3), 9)

    const result = await generateBlogConclusions({
      topic: topic.trim(),
      intro: (intro || '').trim(),
      keyTakeaways: (keyTakeaways || '').trim(),
      ctaGoal: ctaGoal || 'demo',
      ctaCustomText: (ctaCustomText || '').trim(),
      funnelStage: safeFunnelStage,
      audience: (targetAudience || 'business professionals').trim(),
      targetKeywords: parsedKeywords,
      tone: tone || 'authoritative',
      numVariations: count,
      preferredProvider,
    })

    // Persist so a lead captured after viewing this result (via
    // DynamicLeadForm's relatedIdField="blogConclusionId") can be linked to
    // it, and so a PDF generated client-side can be stored here for later
    // sending (see storeBlogConclusionPdfHandler below).
    let blogConclusionId = null
    try {
      const saved = await prisma.blogConclusion.create({
        data: {
          topic: topic.trim(),
          intro: (intro || '').trim() || null,
          keyTakeaways: (keyTakeaways || '').trim() || null,
          ctaGoal: ctaGoal || 'demo',
          funnelStage: safeFunnelStage,
          audience: (targetAudience || 'business professionals').trim(),
          targetKeywords: parsedKeywords.join(', ') || null,
          tone: tone || 'authoritative',
          conclusionsJson: JSON.stringify(result.conclusions || []),
        },
      })
      blogConclusionId = saved.id
    } catch (dbErr) {
      console.error('BlogConclusion save failed (non-fatal):', dbErr.message)
    }

    return res.status(200).json({ ...result, blogConclusionId })
  } catch (error) {
    console.error('[blogConclusionController] Error:', error.message)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate blog conclusions. Please try again.',
    })
  }
}

/**
 * Store the client-generated PDF for a Blog Conclusion result as soon as
 * it's rendered — independent of whether the user ever submits their email.
 * Mirrors contentQaController.js's storeContentQaPdfHandler.
 */
export async function storeBlogConclusionPdfHandler(req, res) {
  try {
    const { id } = req.params
    const { pdfBase64 } = req.body

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'PDF content is missing.' })
    }

    await prisma.blogConclusion.update({
      where: { id },
      data: { pdfBase64 },
    })

    res.json({ success: true })
  } catch (err) {
    console.error('storeBlogConclusionPdfHandler error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to store PDF report.' })
  }
}

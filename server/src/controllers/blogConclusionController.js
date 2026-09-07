import { generateBlogConclusions } from '../services/blogConclusionGenerator.js'

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

    return res.status(200).json(result)
  } catch (error) {
    console.error('[blogConclusionController] Error:', error.message)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate blog conclusions. Please try again.',
    })
  }
}

import { generateBlogIntroductions } from '../services/blogIntroGenerator.js'

/**
 * Handler for generating multiple blog post introductions (TOFU, MOFU, BOFU)
 * POST /api/blog-intros/generate
 */
export async function generateBlogIntrosHandler(req, res) {
  try {
    const {
      topic,
      targetKeywords,
      targetAudience,
      funnelStage = 'all',
      tone = 'conversational',
      count = 6,
      preferredProvider,
    } = req.body

    // Validation
    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid blog topic or title (at least 2 characters).',
      })
    }

    if (topic.trim().length > 300) {
      return res.status(400).json({
        success: false,
        error: 'Topic or title must be under 300 characters.',
      })
    }

    const parsedKeywords = targetKeywords
      ? Array.isArray(targetKeywords)
        ? targetKeywords
        : targetKeywords.split(',').map((k) => k.trim()).filter(Boolean)
      : []

    if (parsedKeywords.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Please limit keywords to 20 or fewer.',
      })
    }

    const validFunnelStages = ['all', 'tofu', 'mofu', 'bofu']
    const safeFunnelStage = validFunnelStages.includes(funnelStage) ? funnelStage : 'all'

    const introCount = Math.min(Math.max(parseInt(count) || 9, 3), 18)

    // Generate blog post introductions
    const result = await generateBlogIntroductions({
      topic: topic.trim(),
      targetKeywords: parsedKeywords,
      targetAudience: targetAudience?.trim() || '',
      funnelStage: safeFunnelStage,
      tone: tone || 'conversational',
      count: introCount,
      preferredProvider,
    })

    res.json({
      success: true,
      summary: result.summary,
      targetAudiences: result.targetAudiences || result.summary?.targetAudiences || [],
      introductions: result.introductions,
      generatedAt: result.generatedAt,
      isFallback: result.isFallback || false,
    })
  } catch (err) {
    console.error('Blog introduction generation error:', err.message)
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate blog introductions. Please try again.',
    })
  }
}

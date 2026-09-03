import { generateSocialPlan } from '../services/socialPlannerService.js'
import prisma from '../utils/prisma.js'

/**
 * POST /api/social-planner/generate
 * Generate tailored social media posts, calendar schedule, viral hooks, and hashtags
 */
export async function generateSocialPlanHandler(req, res) {
  try {
    const {
      topic,
      platforms,
      planType = 'single',
      tone = 'thought_leadership',
      audience = 'B2B Founders, Marketers & Creators',
      ctaType = 'engagement',
      preferredProvider,
      leadId,
    } = req.body

    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid topic, concept, or summary (at least 3 characters).',
      })
    }

    const result = await generateSocialPlan({
      topic: topic.trim(),
      platforms: Array.isArray(platforms) && platforms.length > 0 ? platforms : ['linkedin', 'twitter', 'instagram'],
      planType,
      tone,
      audience,
      ctaType,
      preferredProvider,
    })

    // Persist to database (best effort)
    let recordId = null
    try {
      if (prisma?.socialPlannerProject?.create) {
        const record = await prisma.socialPlannerProject.create({
          data: {
            topic: result.topic,
            planType: result.planType,
            platformsJson: JSON.stringify(result.platforms),
            tone: result.tone,
            audience: result.audience,
            postsJson: JSON.stringify(result.posts),
            calendarJson: JSON.stringify(result.calendar),
            strategySummary: result.strategySummary,
          },
        })
        recordId = record?.id || null

        // Link with lead if provided
        if (leadId && recordId && prisma?.lead?.update) {
          await prisma.lead
            .update({
              where: { id: leadId },
              data: { socialPlannerId: recordId },
            })
            .catch(() => {})
        }
      }
    } catch (dbErr) {
      console.warn('SocialPlannerProject persistence skipped:', dbErr.message)
    }

    res.json({
      success: true,
      ...result,
      id: recordId,
    })
  } catch (error) {
    console.error('Social Planner Handler error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate social media content plan.',
    })
  }
}

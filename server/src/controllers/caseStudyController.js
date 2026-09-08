import { generateCaseStudy } from '../services/caseStudyGenerator.js'

/**
 * Handler for generating a conversion-engineered Case Study & Marketing Distribution Plan
 * POST /api/case-study/generate
 */
export async function generateCaseStudyHandler(req, res) {
  try {
    const {
      clientName = '',
      niche,
      challenge,
      solution,
      metrics,
      targetAudience = '',
      tone = 'authoritative',
      preferredProvider,
    } = req.body

    // Validation
    if (!niche || typeof niche !== 'string' || niche.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid niche or industry (at least 2 characters).',
      })
    }

    if (!challenge || typeof challenge !== 'string' || challenge.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Please describe the core challenge or bottleneck (at least 5 characters).',
      })
    }

    if (!solution || typeof solution !== 'string' || solution.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Please describe the solution or methodology deployed (at least 5 characters).',
      })
    }

    if (!metrics || typeof metrics !== 'string' || metrics.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one quantifiable metric or business result.',
      })
    }

    // Call generator service
    const result = await generateCaseStudy({
      clientName: clientName?.trim() || '',
      niche: niche.trim(),
      challenge: challenge.trim(),
      solution: solution.trim(),
      metrics: metrics.trim(),
      targetAudience: targetAudience?.trim() || '',
      tone: tone || 'authoritative',
      preferredProvider,
    })

    return res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Case Study Generation Handler Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate case study. Please try again.',
    })
  }
}

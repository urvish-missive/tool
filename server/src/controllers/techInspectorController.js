import { inspectWebsiteTechAndTheme } from '../services/techAndThemeInspector.js'
import prisma from '../utils/prisma.js'

/**
 * POST /api/tech-inspector/inspect
 * Extract website theme colors, tech stack / CMS, and Google font families
 */
export async function inspectTechAndThemeHandler(req, res) {
  try {
    const { url, leadId } = req.body

    if (!url || typeof url !== 'string' || url.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid website URL (e.g., https://example.com or example.com).',
      })
    }

    const result = await inspectWebsiteTechAndTheme(url.trim())

    // Persist to database (best effort)
    let recordId = null
    try {
      if (prisma?.extractedTechProject?.create) {
        const record = await prisma.extractedTechProject.create({
          data: {
            websiteUrl: result.websiteUrl,
            hostname: result.hostname,
            colorsJson: JSON.stringify(result.colors),
            techJson: JSON.stringify(result.tech),
            fontsJson: JSON.stringify(result.fonts),
            statsJson: JSON.stringify(result.stats),
          },
        })
        recordId = record?.id || null

        // Link with lead if provided
        if (leadId && recordId && prisma?.lead?.update) {
          await prisma.lead
            .update({
              where: { id: leadId },
              data: { extractedTechId: recordId },
            })
            .catch(() => {})
        }
      }
    } catch (dbErr) {
      console.warn('ExtractedTechProject persistence skipped:', dbErr.message)
    }

    res.json({
      success: true,
      ...result,
      id: recordId,
    })
  } catch (error) {
    console.error('Tech Inspector Handler error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to inspect website tech and theme. Please check the URL.',
    })
  }
}

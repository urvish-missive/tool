import { generateLogo, generateLogoVariations } from '../services/logoGenerator.js'
import prisma from '../utils/prisma.js'

/**
 * Generate a single AI logo
 * POST /api/logo/generate
 */
export async function generateLogoHandler(req, res) {
  try {
    const { brandName, description, industry, style, primaryColor, secondaryColor, preferredProvider } = req.body

    if (!brandName || typeof brandName !== 'string' || brandName.trim().length < 1) {
      return res.status(400).json({ success: false, error: 'Please provide a brand name.' })
    }

    if (!industry) {
      return res.status(400).json({ success: false, error: 'Please select an industry.' })
    }

    const result = await generateLogo({
      brandName: brandName.trim(),
      description: description?.trim() || '',
      industry,
      style: style || 'modern',
      primaryColor,
      secondaryColor,
      preferredProvider,
    })

    // Save to database
    let savedId = null
    try {
      const saved = await prisma.generatedLogo.create({
        data: {
          brandName: brandName.trim(),
          description: description?.trim() || null,
          industry,
          style: style || 'modern',
          primaryColor: '#0C81F3',
          secondaryColor: '#67A7FF',
          svgContent: result.svg,
          designJson: JSON.stringify({ style: result.style, industry: result.industry }),
        },
      })
      savedId = saved.id
    } catch (dbErr) {
      console.error('DB save failed (non-fatal):', dbErr.message)
    }

    res.json({
      success: true,
      logoId: savedId,
      svg: result.svg,
      brandName: result.brandName,
      style: result.style,
      generatedAt: result.generatedAt,
    })
  } catch (err) {
    console.error('Logo generation error:', err.message)
    res.status(500).json({ success: false, error: err.message || 'Failed to generate logo. Please try again.' })
  }
}

/**
 * Generate multiple logo variations
 * POST /api/logo/variations
 */
export async function generateVariationsHandler(req, res) {
  try {
    const { brandName, description, industry, count = 4, preferredProvider } = req.body

    if (!brandName || typeof brandName !== 'string' || brandName.trim().length < 1) {
      return res.status(400).json({ success: false, error: 'Please provide a brand name.' })
    }

    if (!industry) {
      return res.status(400).json({ success: false, error: 'Please select an industry.' })
    }

    const variationCount = Math.min(Math.max(parseInt(count) || 4, 1), 8)
    const result = await generateLogoVariations({
      brandName: brandName.trim(),
      description: description?.trim() || '',
      industry,
      count: variationCount,
      preferredProvider,
    })

    res.json({
      success: true,
      brandName: result.brandName,
      variations: result.variations,
      generatedAt: result.generatedAt,
    })
  } catch (err) {
    console.error('Logo variations error:', err.message)
    res.status(500).json({ success: false, error: err.message || 'Failed to generate logo variations. Please try again.' })
  }
}

/**
 * Get a saved logo by ID
 * GET /api/logo/:id
 */
export async function getLogoHandler(req, res) {
  try {
    const { id } = req.params
    const logo = await prisma.generatedLogo.findUnique({ where: { id } })

    if (!logo) {
      return res.status(404).json({ success: false, error: 'Logo not found.' })
    }

    res.json({
      success: true,
      logo: {
        id: logo.id,
        brandName: logo.brandName,
        description: logo.description,
        industry: logo.industry,
        style: logo.style,
        svg: logo.svgContent,
        createdAt: logo.createdAt,
      },
    })
  } catch (err) {
    console.error('Get logo error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to retrieve logo.' })
  }
}

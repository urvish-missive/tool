import { analyzeBusinessCompetitor } from '../services/businessCompetitorAnalyzer.js'
import prisma from '../utils/prisma.js'

export const analyzeBusinessCompetitorSite = async (req, res) => {
  try {
    const { competitorUrl, companyName, industry, preferredProvider } = req.body

    if (!competitorUrl || typeof competitorUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Competitor website URL is required',
      })
    }

    // Normalize URL
    let normalizedUrl = competitorUrl.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    // Validate URL
    try {
      const url = new URL(normalizedUrl)
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid URL (e.g., https://example.com)',
      })
    }

    const result = await analyzeBusinessCompetitor({
      competitorUrl: normalizedUrl,
      companyName: companyName?.trim() || undefined,
      industry: industry?.trim() || undefined,
      preferredProvider,
    })

    // Save to DB (non-fatal)
    try {
      const saved = await prisma.businessCompetitor.create({
        data: {
          competitorUrl: normalizedUrl,
          companyName: companyName?.trim() || null,
          industry: industry?.trim() || null,
          reportJson: JSON.stringify(result),
        },
      })

      // Save lead if provided
      const { leadName, leadEmail, leadCompany, leadWebsite, leadPhone } = req.body
      if (leadEmail && leadName) {
        try {
          await prisma.lead.create({
            data: {
              name: leadName,
              email: leadEmail,
              company: leadCompany || null,
              website: leadWebsite || null,
              phone: leadPhone || null,
              source: 'business-competitor-analytics',
              businessCompetitorId: saved.id,
            },
          })
        } catch {}
      }
    } catch (dbErr) {
      console.error('DB save failed (non-fatal):', dbErr.message)
    }

    res.json(result)
  } catch (error) {
    console.error('Business competitor analysis error:', error.message)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze competitor. Please check the URL and try again.',
    })
  }
}

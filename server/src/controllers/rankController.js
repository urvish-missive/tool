import { checkRank, checkBatchRanks } from '../services/rankChecker.js'
import prisma from '../utils/prisma.js'

export const checkGoogleRank = async (req, res) => {
  try {
    const {
      domain,
      keyword,
      keywords,
      country = 'US',
      device = 'desktop',
      leadId,
      preferredProvider,
    } = req.body

    if (!domain || typeof domain !== 'string' || domain.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'A valid target domain or website URL is required (e.g. missivedigital.com).',
      })
    }

    let result
    // Check if batch check is requested
    const hasBatch = (keywords && (Array.isArray(keywords) ? keywords.length > 1 : keywords.includes('\n') || keywords.includes(',')))

    if (hasBatch) {
      result = await checkBatchRanks({
        domain: domain.trim(),
        keywords: keywords,
        country,
        device,
        preferredProvider,
      })
    } else {
      const singleKeyword = (keyword || (Array.isArray(keywords) ? keywords[0] : keywords) || '').trim()
      if (!singleKeyword) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a target keyword to check Google rankings.',
        })
      }
      result = await checkRank({
        domain: domain.trim(),
        keyword: singleKeyword,
        country,
        device,
        preferredProvider,
      })
    }

    // Persist to database if available
    let recordId = null
    try {
      if (prisma?.rankCheck?.create) {
        const record = await prisma.rankCheck.create({
          data: {
            domain: result.domain,
            keyword: result.keyword,
            country: result.country,
            device: result.device,
            position: result.position,
            rankingUrl: result.rankingUrl,
            resultJson: JSON.stringify(result),
          },
        })
        recordId = record?.id || null

        // Link with lead if provided
        if (leadId && recordId && prisma?.lead?.update) {
          await prisma.lead.update({
            where: { id: leadId },
            data: { rankCheckId: recordId },
          }).catch(() => {})
        }
      }
    } catch (dbErr) {
      console.warn('RankCheck persistence skipped:', dbErr.message)
    }

    res.json({
      ...result,
      id: recordId,
    })
  } catch (error) {
    console.error('Google Rank Check error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check Google rank. Please try again.',
    })
  }
}

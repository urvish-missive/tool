import { researchKeywords } from '../services/keywords/researchService.js'
import { withTimeout } from '../utils/helpers.js'
import prisma from '../utils/prisma.js'

export async function createResearch(req, res) {
  try {
    const { seedKeyword, websiteUrl, country, language, businessType } = req.body

    if (!seedKeyword || seedKeyword.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please enter a keyword (at least 2 characters).' })
    }
    if (seedKeyword.length > 100) {
      return res.status(400).json({ success: false, error: 'Keyword must be under 100 characters.' })
    }

    console.log(`Starting keyword research for: "${seedKeyword}"`)

    const report = await withTimeout(
      researchKeywords({ seedKeyword: seedKeyword.trim(), websiteUrl, country, language, businessType }),
      90000, 'Keyword research'
    )

    // Save to DB
    let researchId = null
    try {
      const research = await prisma.keywordResearch.create({
        data: {
          seedKeyword: seedKeyword.trim(),
          websiteUrl: websiteUrl || null,
          country: country || null,
          language: language || null,
          businessType: businessType || null,
          reportJson: JSON.stringify(report),
        },
      })
      researchId = research.id

      // Save keywords in batch
      const keywordOps = (report.keywords || []).slice(0, 80).map(kw =>
        prisma.keyword.create({
          data: {
            researchId,
            keyword: kw.keyword,
            intent: kw.intent,
            type: kw.type,
            opportunityScore: kw.opportunityScore,
            businessRelevance: kw.businessRelevance,
            reason: kw.reason,
          },
        })
      )
      await Promise.all(keywordOps)
    } catch (dbErr) {
      console.error('DB save failed (non-fatal):', dbErr.message)
    }

    console.log(`✓ Keyword research complete — ${report.keywords?.length || 0} keywords`)
    res.json({ success: true, researchId, report })
  } catch (err) {
    console.error('Keyword research error:', err.message)
    res.status(500).json({ success: false, error: 'Research failed. Please try again.' })
  }
}

export async function getResearch(req, res) {
  try {
    const research = await prisma.keywordResearch.findUnique({ where: { id: req.params.id } })
    if (!research) return res.status(404).json({ success: false, error: 'Research not found.' })
    res.json({ success: true, report: JSON.parse(research.reportJson) })
  } catch (err) {
    console.error('Get research error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to retrieve research.' })
  }
}

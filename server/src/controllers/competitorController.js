import { analyzeCompetitor } from '../services/competitorAnalyzer.js'

export const analyzeCompetitorSite = async (req, res) => {
  try {
    const { competitorUrl, yourUrl, targetKeywords } = req.body

    if (!competitorUrl || typeof competitorUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Competitor URL is required',
      })
    }

    // Validate URL
    try {
      const url = new URL(competitorUrl)
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid URL (e.g., https://example.com)',
      })
    }

    // Validate your URL if provided
    if (yourUrl) {
      try {
        const url = new URL(yourUrl)
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid protocol')
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid URL for your website',
        })
      }
    }

    const result = await analyzeCompetitor({
      competitorUrl,
      yourUrl: yourUrl?.trim() || undefined,
      targetKeywords: targetKeywords?.trim() || undefined,
    })

    res.json(result)
  } catch (error) {
    console.error('Competitor analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze competitor. Please try again.',
    })
  }
}

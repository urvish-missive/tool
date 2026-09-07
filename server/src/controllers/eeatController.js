import { analyzeEeat, EEAT_CONTENT_TYPES } from '../services/eeatAnalyzer.js'

/**
 * Handler for E-E-A-T and AI Search Authority Audit
 * POST /api/eeat/analyze
 */
export async function analyzeEeatHandler(req, res) {
  try {
    const {
      url,
      content,
      title,
      contentType = 'auto',
      targetKeywords,
      preferredProvider,
    } = req.body

    const hasUrl = url && typeof url === 'string' && url.trim().length > 3
    const hasContent = content && typeof content === 'string' && content.trim().length > 50

    if (!hasUrl && !hasContent) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a valid webpage URL or paste at least 50 characters of draft article text.',
      })
    }

    const validTypes = Object.keys(EEAT_CONTENT_TYPES)
    const safeType = validTypes.includes(contentType) ? contentType : 'auto'

    const result = await analyzeEeat({
      url: hasUrl ? url.trim() : '',
      content: hasContent ? content.trim() : '',
      title: title?.trim() || '',
      contentType: safeType,
      targetKeywords: targetKeywords?.trim() || '',
      preferredProvider: preferredProvider || 'gemini-3.5-flash-lite',
    })

    return res.json({
      success: true,
      data: result,
    })
  } catch (err) {
    console.error('[EeatController] Analysis error:', err.message)
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to complete E-E-A-T analysis. Please check the URL or content and try again.',
    })
  }
}

/**
 * Handler for retrieving supported E-E-A-T content types
 * GET /api/eeat/types
 */
export async function getEeatTypesHandler(req, res) {
  return res.json({
    success: true,
    types: EEAT_CONTENT_TYPES,
  })
}

import { analyzeEeat, EEAT_CONTENT_TYPES } from '../services/eeatAnalyzer.js'

/**
 * Handler for E‑E‑A‑T and AI Search Authority Audit
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
    const hasContent = content && typeof content === 'string' && content.trim().length >= 50

    if (!hasUrl && !hasContent) {
      return res.status(400).json({
        success: false,
        analysisStatus: 'failed',
        isFallback: false,
        errors: ['Please provide either a valid webpage URL or paste at least 50 characters of draft article text.'],
        data: null,
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
      preferredProvider: preferredProvider || 'gemini-3.5-flash',
    })

    const isDev = process.env.NODE_ENV !== 'production'

    return res.json({
      success: true,
      analysisStatus: result.analysisStatus || 'complete',
      isFallback: Boolean(result.isFallback),
      errors: result.isFallback && result.diagnostic?.fallbackReason ? [result.diagnostic.fallbackReason] : [],
      data: {
        ...result,
        modelUsed: result.modelUsed || (result.isFallback ? 'Deterministic Document Heuristics Engine' : 'Gemini 3.5 Flash'),
        providerUsed: result.providerUsed || (result.isFallback ? 'heuristic' : 'gemini'),
      },
      modelUsed: result.modelUsed || (result.isFallback ? 'Deterministic Document Heuristics Engine' : 'Gemini 3.5 Flash'),
      providerUsed: result.providerUsed || (result.isFallback ? 'heuristic' : 'gemini'),
      ...(isDev ? { diagnostic: result.diagnostic } : {}),
    })
  } catch (err) {
    console.error('[EeatController] Analysis error:', err.message)
    return res.status(500).json({
      success: false,
      analysisStatus: 'failed',
      isFallback: true,
      errors: [err.message || 'Failed to complete E‑E‑A‑T analysis.'],
      data: null,
      diagnostic: {
        analysisStatus: 'failed',
        modelCallSucceeded: false,
        responseReceived: false,
        parseSucceeded: false,
        schemaValidationSucceeded: false,
        retryCount: 0,
        fallbackReason: err.message,
        fallbackStage: 'controller_handler',
        errorCode: 'CONTROLLER_EXCEPTION',
      },
    })
  }
}

/**
 * Handler for retrieving supported E‑E‑A‑T evaluation frameworks & types
 * GET /api/eeat/types
 */
export async function getEeatTypesHandler(req, res) {
  return res.json({
    success: true,
    types: EEAT_CONTENT_TYPES,
  })
}

import { fetchPortalData, parseCurl, parseHeaderBlock } from '../services/portalDataFetcher.js'
import { issueBatchToken, MAX_BATCH_CALLS } from '../utils/batchToken.js'
import { fetchBrowserPortalData } from '../services/portalBrowserFetcher.js'

/**
 * POST /api/portal-fetcher/fetch
 * Body: { curl } or { request: { method, url, headers (object | "Name: value" lines), body } },
 *       plus optional { pagination, dataPath }.
 *
 * Request headers/cookies are used only for the outgoing call(s). They are not
 * stored in the database and are never logged.
 */
export async function fetchPortalDataHandler(req, res) {
  try {
    res.set('Cache-Control', 'no-store')
    if (req.body?.browser) {
      const result = await fetchBrowserPortalData(req.body.browser)
      return res.json({ success: true, ...result })
    }
    const { curl, request, pagination, dataPath, batch } = req.body || {}

    // Bulk search: the first call of a run asks for a token covering the rest.
    const batchTotal = parseInt(batch?.total)
    if (batchTotal > MAX_BATCH_CALLS) {
      return res.status(400).json({
        success: false,
        error: `A bulk search can run at most ${MAX_BATCH_CALLS} combinations. Use fewer keywords or countries.`,
      })
    }

    let parsed
    if (typeof curl === 'string' && curl.trim()) {
      if (curl.length > 200000) {
        return res.status(400).json({ success: false, error: 'The cURL command is too long.' })
      }
      parsed = parseCurl(curl)
    } else if (request && typeof request === 'object') {
      parsed = {
        method: String(request.method || 'GET').toUpperCase(),
        url: String(request.url || '').trim(),
        headers: typeof request.headers === 'string' ? parseHeaderBlock(request.headers) : request.headers || {},
        body: request.body === '' || request.body == null ? null : String(request.body),
      }
    } else {
      return res.status(400).json({ success: false, error: 'Paste a cURL command or enter the API URL.' })
    }

    if (!/^https?:\/\//i.test(parsed.url)) {
      return res.status(400).json({ success: false, error: 'The API URL must start with http:// or https://.' })
    }

    const result = await fetchPortalData({
      request: parsed,
      pagination: pagination && typeof pagination === 'object' ? pagination : null,
      dataPath: typeof dataPath === 'string' ? dataPath : '',
    })

    const deviceId = req.headers['x-device-id']
    const batchToken =
      batch?.start && batchTotal > 1 && deviceId && !req.headers['x-batch-token']
        ? issueBatchToken(deviceId, 'portal-data-fetcher', batchTotal - 1)
        : undefined

    return res.json({ success: true, ...result, ...(batchToken ? { batchToken } : {}) })
  } catch (err) {
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 400
    // Log only the message: never the request, headers or cookies.
    console.warn('[portal-fetcher]', err.message)
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to fetch data from the portal.',
      ...(err.preview ? { rawPreview: err.preview } : {}),
    })
  }
}

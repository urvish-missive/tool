/**
 * Signed batch tokens for multi-request tool runs.
 *
 * A bulk run (e.g. Portal Data Fetcher searching 6 keywords x 4 countries)
 * makes one API call per combination. The first call counts against the
 * device's usage limit and returns a short-lived token; follow-up calls that
 * carry it (x-batch-token) are not counted again. The token is bound to the
 * device ID and tool, expires, and caps how many calls it covers.
 */
import crypto from 'crypto'
import { getJwtSecret } from '../middleware/adminAuth.js'

const TTL_MS = 30 * 60 * 1000
export const MAX_BATCH_CALLS = 200

// Calls made per token, kept in memory (tokens are short-lived).
const used = new Map()
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of used) if (v.exp < now) used.delete(k)
}, 600000).unref?.()

function sign(payload) {
  return crypto.createHmac('sha256', getJwtSecret()).update(payload).digest('base64url')
}

export function issueBatchToken(deviceId, toolSlug, calls) {
  const exp = Date.now() + TTL_MS
  const max = Math.min(Math.max(parseInt(calls) || 1, 1), MAX_BATCH_CALLS)
  const nonce = crypto.randomBytes(8).toString('base64url')
  const payload = `${toolSlug}.${deviceId}.${exp}.${max}.${nonce}`
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`
}

/** True when the request carries a valid, unexpired, not-exhausted token. Consumes one call. */
export function consumeBatchToken(req, toolSlug) {
  const token = req.headers['x-batch-token']
  const deviceId = req.headers['x-device-id']
  if (!token || !deviceId || typeof token !== 'string') return false
  const [b64, sig] = token.split('.')
  if (!b64 || !sig) return false
  let payload
  try {
    payload = Buffer.from(b64, 'base64url').toString('utf8')
  } catch {
    return false
  }
  const expected = sign(payload)
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false

  const [slug, dev, expStr, maxStr] = payload.split('.')
  const exp = Number(expStr)
  const max = Number(maxStr)
  if (slug !== toolSlug || dev !== deviceId || !(exp > Date.now())) return false

  const entry = used.get(token) || { count: 0, exp }
  if (entry.count >= max) return false
  entry.count++
  used.set(token, entry)
  return true
}

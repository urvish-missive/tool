/**
 * CORS Configuration and Origin Validator
 * 
 * Explicit Allowed Origins List:
 * - https://tool-2jmg.onrender.com/api/
 * - local (http://localhost:5173, http://127.0.0.1:5173, ports 5174, 3000, 4173, 5000)
 * - https://tool.missivedigital.com/
 */

/**
 * Normalized helper to extract protocol + host from any origin/URL string,
 * safely handling paths (e.g. /api/) and trailing slashes.
 */
export function normalizeOriginUrl(urlStr) {
  if (!urlStr) return ''
  const trimmed = urlStr.trim()
  try {
    const url = new URL(trimmed)
    return `${url.protocol}//${url.host}`
  } catch {
    return trimmed.replace(/\/+$/, '')
  }
}

/**
 * Explicit Array List of Allowed Origins
 */
export const ALLOWED_ORIGINS = [
  // 1. Render API Backend
  'https://tool-2jmg.onrender.com/api/',
  'https://tool-2jmg.onrender.com',

  // 2. Local Development Origins
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',

  // 3. Missive Digital Production Frontends
  'https://tool.missivedigital.com/',
  'https://tool.missivedigital.com',
  'https://tools.missivedigital.com/',
  'https://tools.missivedigital.com',
  'https://missivedigital.com/',
  'https://missivedigital.com',
  'https://www.missivedigital.com',
]

/**
 * Validates if an incoming request origin is permitted.
 * @param {string|undefined|null} origin The Origin header from the incoming request.
 * @param {object} [env=process.env] Optional environment object for testing.
 * @returns {boolean} True if origin is allowed, false otherwise.
 */
export function isAllowedOrigin(origin, env = process.env) {
  // Allow requests without an Origin header (e.g. server-to-server, curl, Postman, same-origin)
  if (!origin) return true

  const cleanOrigin = normalizeOriginUrl(origin)

  // 1. Check explicit ALLOWED_ORIGINS array list
  const normalizedAllowedList = ALLOWED_ORIGINS.map(normalizeOriginUrl)
  if (normalizedAllowedList.includes(cleanOrigin)) {
    return true
  }

  // 2. Check dynamic CLIENT_URL from environment (supports comma-separated list and *)
  const rawClientUrl = env.CLIENT_URL || ''
  const configuredOrigins = rawClientUrl
    ? rawClientUrl.split(',').map((s) => normalizeOriginUrl(s)).filter(Boolean)
    : []

  if (configuredOrigins.includes('*') || configuredOrigins.includes(cleanOrigin)) {
    return true
  }

  // 3. Dynamic Localhost / 127.0.0.1 / IPv6 [::1] on any port
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:[0-9]+)?$/i.test(cleanOrigin)) {
    return true
  }

  // 4. Missive Digital subdomains (*.missivedigital.com)
  if (/^https:\/\/(?:[a-zA-Z0-9-_.]+\.)?missivedigital\.com$/i.test(cleanOrigin)) {
    return true
  }

  // 5. Vercel preview & production deployments (*.vercel.app)
  if (/^https:\/\/[a-zA-Z0-9-_.]+\.vercel\.app$/i.test(cleanOrigin)) {
    return true
  }

  // 6. Render deployments (*.onrender.com)
  if (/^https:\/\/[a-zA-Z0-9-_.]+\.onrender\.com$/i.test(cleanOrigin)) {
    return true
  }

  // 7. Private local network LAN IPs (e.g. mobile testing in development)
  if (env.NODE_ENV !== 'production') {
    if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:[0-9]+)?$/i.test(cleanOrigin)) {
      return true
    }
  }

  return false
}

/**
 * Returns CORS middleware options tailored for Express.
 * @param {object} [env=process.env] Optional environment object.
 * @returns {object} CORS options object for cors() middleware.
 */
export function getCorsOptions(env = process.env) {
  return {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin, env)) {
        return callback(null, true)
      }
      if (env.NODE_ENV !== 'production') {
        console.warn(
          `[CORS] Blocked request from origin: "${origin}". ` +
          `Add it to ALLOWED_ORIGINS in corsConfig.js or CLIENT_URL in server/.env.`
        )
      }
      return callback(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    // Omitting allowedHeaders allows cors to dynamically reflect requested headers
    // (e.g. x-device-id, Authorization, Content-Type, cache-control, etc.) without preflight rejection
    exposedHeaders: ['Content-Disposition', 'x-device-id'],
    optionsSuccessStatus: 200,
    maxAge: 86400,
  }
}

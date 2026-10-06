/**
 * Client-safe configuration only. Values come from VITE_* build variables and
 * are visible to anyone who installs the extension. No secrets belong here:
 * AI keys stay in server/.env and are only used by the Express backend.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://toolapi.missive.digital/api').replace(
  /\/+$/,
  '',
)

export const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL || 'https://tool-blue-three.vercel.app/content-qa'

/** Must match the toolAccess('content-qa') slug in server/src/app.js so limits are shared. */
export const TOOL_SLUG = 'content-qa'

/** Same ceiling the web form enforces (client/src/schemas/contentQa.schema.js). */
export const MAX_CONTENT_CHARS = 50000
export const MAX_TITLE_CHARS = 200
export const MIN_CONTENT_CHARS = 20

/** Matches the web client's axios/RTK timeout. Covers a cold-starting backend. */
export const ANALYZE_TIMEOUT_MS = 120000
export const STATUS_TIMEOUT_MS = 15000

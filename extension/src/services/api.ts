/**
 * Thin client for the EXISTING Express API. No new backend endpoints:
 *   POST /api/content-qa/analyze   (same handler the web app uses)
 *   GET  /api/devices/status       (per-device usage)
 *   POST /api/devices/link-email   (request extended access)
 */
import { ANALYZE_TIMEOUT_MS, API_BASE_URL, STATUS_TIMEOUT_MS, TOOL_SLUG } from '../config'
import type { AnalyzeRequest, AnalyzeResponse, DeviceStatus } from '../types/analysis'
import { getDeviceId } from './identity'

export type ApiErrorCode =
  | 'OFFLINE'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'USAGE_LIMIT'
  | 'BLOCKED'
  | 'TOOL_DISABLED'
  | 'RATE_LIMIT'
  | 'AUTH_EXPIRED'
  | 'BAD_REQUEST'
  | 'SERVER'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details: Record<string, unknown>

  constructor(code: ApiErrorCode, message: string, status = 0, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

function safeServerMessage(body: Record<string, unknown> | null, fallback: string): string {
  const msg = body?.error
  // Server messages for 4xx are written for end users; cap length defensively.
  return typeof msg === 'string' && msg.length > 0 && msg.length < 300 ? msg : fallback
}

function toApiError(status: number, body: Record<string, unknown> | null): ApiError {
  if (status === 429 && body?.deviceLimitReached) {
    return new ApiError(
      'USAGE_LIMIT',
      safeServerMessage(body, 'You have used all of your free Content QA analyses.'),
      status,
      body,
    )
  }
  if (status === 403 && body?.deviceBlocked) {
    return new ApiError('BLOCKED', 'Access to Content QA is restricted for this device. Please contact Missive support.', status, body)
  }
  if (status === 403 && body?.toolDisabled) {
    return new ApiError('TOOL_DISABLED', safeServerMessage(body, 'Content QA is temporarily unavailable.'), status, body)
  }
  if (status === 429) {
    const retryAfter = Number(body?.retryAfter) || 0
    const wait = retryAfter > 0 ? ` Try again in about ${Math.ceil(retryAfter / 60)} min.` : ' Please try again later.'
    return new ApiError('RATE_LIMIT', `Too many analyses in a short time.${wait}`, status, body ?? {})
  }
  if (status === 401) {
    return new ApiError('AUTH_EXPIRED', 'Your session has expired. Please reopen the extension and try again.', status)
  }
  if (status >= 400 && status < 500) {
    return new ApiError('BAD_REQUEST', safeServerMessage(body, 'The page content could not be analyzed.'), status)
  }
  return new ApiError('SERVER', 'The Missive SEO server ran into a problem. Please try again in a moment.', status)
}

async function request<T>(path: string, init: RequestInit, timeoutMs: number): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError('OFFLINE', 'You appear to be offline. Check your internet connection and try again.')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const deviceId = await getDeviceId()

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        ...(init.headers || {}),
      },
      credentials: 'omit',
      signal: controller.signal,
    })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'The analysis is taking longer than expected. Please try again.')
    }
    throw new ApiError('NETWORK', 'Could not reach the Missive SEO server. It may be down or your network is blocking it.')
  } finally {
    clearTimeout(timer)
  }

  let body: Record<string, unknown> | null = null
  try {
    body = (await res.json()) as Record<string, unknown>
  } catch {
    body = null
  }

  if (!res.ok) throw toApiError(res.status, body)
  if (!body) throw new ApiError('SERVER', 'The server returned an unexpected response.', res.status)
  return body as T
}

export async function analyzeContentQa(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  const data = await request<AnalyzeResponse>(
    '/content-qa/analyze',
    { method: 'POST', body: JSON.stringify(payload) },
    ANALYZE_TIMEOUT_MS,
  )
  if (!data.success || !data.report) {
    throw new ApiError('SERVER', safeServerMessage(data as unknown as Record<string, unknown>, 'Analysis failed. Please try again.'))
  }
  return data
}

export async function getDeviceStatus(): Promise<DeviceStatus> {
  const data = await request<DeviceStatus & { success: boolean }>(
    `/devices/status?toolSlug=${encodeURIComponent(TOOL_SLUG)}`,
    { method: 'GET' },
    STATUS_TIMEOUT_MS,
  )
  return {
    usageCount: Number(data.usageCount) || 0,
    limit: Number(data.limit) || 0,
    remaining: typeof data.remaining === 'number' ? data.remaining : undefined,
    isBlocked: Boolean(data.isBlocked),
    email: data.email ?? null,
  }
}

export async function linkDeviceEmail(email: string): Promise<void> {
  await request<{ success: boolean }>(
    '/devices/link-email',
    { method: 'POST', body: JSON.stringify({ email, toolSlug: TOOL_SLUG }) },
    STATUS_TIMEOUT_MS,
  )
}

import { API_BASE_URL } from '../utils/apiUrl.js'
import { getOrCreateDeviceId } from '../utils/deviceId.js'

/**
 * API-003: Case Study API service helper.
 * Normalizes backend response so consumers can safely access both
 * response.data.caseStudy and response.data.result.
 */
export function normalizeCaseStudyResponse(response) {
  if (!response) return response
  const data = response.data !== undefined ? response.data : response
  const caseStudy = data?.caseStudy || data?.result?.caseStudy || data?.result || data

  return {
    ...response,
    data: {
      ...(typeof data === 'object' && data !== null ? data : {}),
      caseStudy,
      result: data?.result || caseStudy,
    },
  }
}

export async function generateCaseStudyApi(payload) {
  const deviceId = getOrCreateDeviceId()
  const headers = { 'Content-Type': 'application/json' }
  if (deviceId) {
    headers['x-device-id'] = deviceId
  }

  const res = await fetch(`${API_BASE_URL}/case-study/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `Request failed with status ${res.status}`)
  }

  const json = await res.json()
  return normalizeCaseStudyResponse(json)
}

export default {
  generateCaseStudyApi,
  normalizeCaseStudyResponse,
}

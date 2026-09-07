/**
 * Shared helper utilities for the SEO analysis platform.
 */

import * as dns from 'dns'
import { URL } from 'url'

// ─── Issue Builder ─────────────────────────────────────────────

export function createIssue(category, severity, title, description, recommendation, extra = {}) {
  const affectedPages = extra?.affectedPages || []
  const affectedItems =
    extra?.affectedItems ||
    (affectedPages.length > 0
      ? affectedPages.map((url) => ({ url, evidence: extra?.evidence || '' }))
      : [])

  return {
    category,
    severity,
    title,
    description,
    recommendation,
    affectedPages,
    affectedItems,
    evidence: extra?.evidence || '',
    ...(typeof extra === 'object' ? extra : {}),
  }
}

// ─── Safe Fetch with Timeout ───────────────────────────────────

export async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeout)
    return response
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

// ─── URL Validation & SSRF Protection ─────────────────────────

const PRIVATE_IP_RE = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|localhost|::1|fc00:|fe80:|169\.254\.)/

export function isPrivateIP(ip) {
  return PRIVATE_IP_RE.test(ip)
}

export function validateURL(inputUrl) {
  const parsed = new URL(inputUrl)
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol')
  if (isPrivateIP(parsed.hostname) || parsed.hostname === 'localhost') throw new Error('Internal URL blocked')
  return parsed
}

export function resolveAndValidate(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { all: true }, (err, addresses) => {
      if (err) {
        dns.resolve4(hostname, (err4, addresses4) => {
          if (err4 && err4.code !== 'ENODATA') {
            console.warn(`DNS resolution warning for ${hostname}:`, err4.message)
            return resolve(true)
          }
          if (addresses4 && addresses4.some(isPrivateIP)) return reject(new Error('Private/internal IP blocked'))
          resolve(true)
        })
        return
      }
      if (addresses && addresses.some(a => isPrivateIP(a.address))) {
        return reject(new Error('Private/internal IP blocked'))
      }
      resolve(true)
    })
  })
}

// ─── Text Analysis ────────────────────────────────────────────

export function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length
}

export function countSentences(text) {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
}

export function findDuplicates(items) {
  const counts = {}
  items.forEach(item => { counts[item] = (counts[item] || 0) + 1 })
  return Object.entries(counts).filter(([, count]) => count > 1)
}

export function keywordFrequency(text, keyword) {
  if (!keyword) return { count: 0, density: 0 }
  const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  const matches = text.match(regex) || []
  const words = countWords(text)
  return {
    count: matches.length,
    density: words > 0 ? parseFloat(((matches.length / words) * 100).toFixed(2)) : 0,
  }
}

export function textContains(text, needle) {
  return text.toLowerCase().includes(needle.toLowerCase())
}

// ─── Score Utilities ──────────────────────────────────────────

export function clampScore(score, min = 0, max = 100) {
  return Math.min(max, Math.max(min, typeof score === 'number' ? Math.round(score) : 50))
}

export function scoreLabel(score) {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 50) return 'Needs Improvement'
  return 'Critical'
}

export function countSeverities(issues) {
  const counts = {}
  issues.forEach(i => { counts[i.severity] = (counts[i.severity] || 0) + 1 })
  return counts
}

export function calculateCategoryScore(checks, issueCount, severityCounts) {
  let score = 100
  score -= (severityCounts.CRITICAL || 0) * 20
  score -= (severityCounts.HIGH || 0) * 10
  score -= (severityCounts.MEDIUM || 0) * 5
  score -= (severityCounts.LOW || 0) * 2

  if (checks) {
    const checkList = Object.values(checks)
    const passed = checkList.filter(c => c.pass).length
    if (checkList.length > 0) score = Math.max(score, Math.round((passed / checkList.length) * 100))
  }

  return clampScore(score)
}

// ─── JSON Repair ──────────────────────────────────────────────

export function extractAndCleanJSON(raw) {
  if (!raw || typeof raw !== 'string') return '{}'

  // 1. Remove think tags if any
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // 2. Remove markdown fences anywhere in text
  cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()

  // 3. Locate outermost JSON object {...} or array [...]
  const firstBrace = cleaned.indexOf('{')
  const firstBracket = cleaned.indexOf('[')

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    const matchingBrace = findMatchingClosing(cleaned, firstBrace, '{', '}')
    if (matchingBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, matchingBrace + 1)
    } else {
      cleaned = cleaned.substring(firstBrace)
    }
  } else if (firstBracket !== -1) {
    const matchingBracket = findMatchingClosing(cleaned, firstBracket, '[', ']')
    if (matchingBracket !== -1) {
      cleaned = cleaned.substring(firstBracket, matchingBracket + 1)
    } else {
      cleaned = cleaned.substring(firstBracket)
    }
  }

  // 4. Fix trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

  // 5. Try parsing as-is first
  try {
    JSON.parse(cleaned)
    return cleaned
  } catch {
    // continue to repair
  }

  // 6. Fix unescaped quotes, newlines, and tabs inside string values
  let repaired = repairJSONStrings(cleaned)
  try {
    JSON.parse(repaired)
    return repaired
  } catch {
    // continue
  }

  // 7. Auto-close truncated JSON using balanced stack
  repaired = autoCloseTruncatedJSON(repaired)
  try {
    JSON.parse(repaired)
    return repaired
  } catch {
    return cleaned
  }
}

/**
 * Find the matching closing brace or bracket for the root element.
 * Returns -1 if not closed (e.g. truncated).
 */
function findMatchingClosing(str, startIndex, openChar, closeChar) {
  let depth = 0
  let inString = false
  let isEsc = false
  for (let i = startIndex; i < str.length; i++) {
    const c = str[i]
    if (inString) {
      if (isEsc) {
        isEsc = false
      } else if (c === '\\') {
        isEsc = true
      } else if (c === '"') {
        inString = false
      }
    } else {
      if (c === '"') {
        inString = true
      } else if (c === openChar) {
        depth++
      } else if (c === closeChar) {
        depth--
        if (depth === 0) return i
      }
    }
  }
  return -1
}

/**
 * Walk a JSON string and escape unescaped double-quotes, newlines, and tabs inside string values.
 */
function repairJSONStrings(str) {
  let result = ''
  let inString = false
  let i = 0

  while (i < str.length) {
    const ch = str[i]

    if (!inString) {
      result += ch
      if (ch === '"') inString = true
      i++
    } else {
      if (ch === '\\') {
        // Escaped character — copy both
        result += ch + (str[i + 1] || '')
        i += 2
      } else if (ch === '"') {
        // Check if this is the real end of the JSON string
        const rest = str.substring(i + 1).replace(/^[\s\r\n]*/, '')
        const nextChar = rest[0] || ''
        if (nextChar === ':' || nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === '') {
          result += ch
          inString = false
          i++
        } else {
          // Unescaped quote inside content — escape it
          result += '\\"'
          i++
        }
      } else if (ch === '\n') {
        result += '\\n'
        i++
      } else if (ch === '\r') {
        result += '\\r'
        i++
      } else if (ch === '\t') {
        result += '\\t'
        i++
      } else {
        result += ch
        i++
      }
    }
  }

  if (inString) {
    result += '"'
  }

  return result
}

/**
 * Auto-close truncated JSON by maintaining an opening brace/bracket stack.
 */
function autoCloseTruncatedJSON(str) {
  let truncated = str.trim()

  truncated = truncated.replace(/,\s*$/, '')
  truncated = truncated.replace(/:\s*$/, ': ""')

  let openQuote = false
  let isEsc = false
  const stack = []

  for (let i = 0; i < truncated.length; i++) {
    const c = truncated[i]
    if (openQuote) {
      if (isEsc) {
        isEsc = false
      } else if (c === '\\') {
        isEsc = true
      } else if (c === '"') {
        openQuote = false
      }
    } else {
      if (c === '"') {
        openQuote = true
      } else if (c === '{') {
        stack.push('}')
      } else if (c === '[') {
        stack.push(']')
      } else if (c === '}') {
        if (stack.length && stack[stack.length - 1] === '}') stack.pop()
      } else if (c === ']') {
        if (stack.length && stack[stack.length - 1] === ']') stack.pop()
      }
    }
  }

  if (openQuote) {
    truncated += '"'
  }

  truncated = truncated.replace(/,\s*$/, '')
  truncated = truncated.replace(/:\s*$/, ': ""')

  while (stack.length) {
    truncated += stack.pop()
  }

  return truncated
}

// ─── Retry Wrapper ────────────────────────────────────────────

export async function withRetry(fn, maxRetries = 2, delayMs = 2000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, delayMs * attempt))
      return await fn()
    } catch (err) {
      if (attempt === maxRetries) throw err
    }
  }
}

// ─── Timeout Wrapper ──────────────────────────────────────────

export function withTimeout(promise, ms, label = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ])
}

import { fetchWithTimeout, extractAndCleanJSON } from './helpers.js'

/* ── Configuration ─────────────────────────────────────────────── */

const AI_TIMEOUT = 45000

const PROVIDERS = {
  gemini: {
    url: process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.7-flash',
    key: process.env.AI_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    key: process.env.GROQ_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
}

/* ── Core AI Call ───────────────────────────────────────────────── */

async function callProvider(providerName, messages, options = {}) {
  const provider = PROVIDERS[providerName]
  if (!provider || !provider.key) {
    throw new Error(`Provider "${providerName}" not configured (missing API key)`)
  }

  const { temperature = 0.4, maxTokens = 8000, timeout = AI_TIMEOUT, jsonMode = false } = options

  const body = {
      model: provider.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }
    if (jsonMode) body.response_format = { type: 'json_object' }

    const response = await fetchWithTimeout(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [provider.headerName]: `${provider.headerPrefix}${provider.key}`,
      },
      body: JSON.stringify(body),
    }, timeout)

  if (!response.ok) {
    const status = response.status
    const body = await response.text().catch(() => '')
    throw new Error(`AI API ${providerName} returned ${status}: ${body.substring(0, 200)}`)
  }

  const data = await response.json()
  let content = data.choices?.[0]?.message?.content || ''
  if (!content) throw new Error(`AI API ${providerName} returned empty content`)

  // Strip <think>...</think> tags (some models include reasoning)
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // Strip ```json...``` fences if present
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

  return content
}

/* ── High-Level Call with Fallback ─────────────────────────────── */

/**
 * Call AI with automatic provider fallback.
 * Tries the primary provider first, then falls back to others.
 *
 * @param {Array} messages - Chat messages array
 * @param {Object} options - { temperature, maxTokens, timeout, preferredProvider }
 * @returns {string} AI response text
 */
export async function callAI(messages, options = {}) {
  const { preferredProvider, ...callOpts } = options

  // Determine provider order: preferred first, then others
  const providerOrder = preferredProvider
    ? [preferredProvider, ...Object.keys(PROVIDERS).filter(p => p !== preferredProvider)]
    : Object.keys(PROVIDERS).filter(p => PROVIDERS[p].key)

  const errors = []

  for (const providerName of providerOrder) {
    if (!PROVIDERS[providerName]?.key) continue

    try {
      const result = await callProvider(providerName, messages, callOpts)
      console.log(`✓ AI response from ${providerName}`)
      return result
    } catch (err) {
      console.log(`AI ${providerName} failed: ${err.message}`)
      errors.push(`${providerName}: ${err.message}`)

      // Don't retry if it's a quota/rate limit error — move to next provider
      if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('rate')) {
        continue
      }
      // For 503 (overloaded), try next provider
      if (err.message.includes('503')) {
        continue
      }
    }
  }

  throw new Error(`All AI providers failed: ${errors.join(' | ')}`)
}

/**
 * Call AI and parse JSON response with automatic cleanup.
 * Falls back to extracting JSON from markdown code blocks.
 */
export async function callAIAndParseJSON(messages, options = {}) {
  const rawText = await callAI(messages, options)
  const cleaned = extractAndCleanJSON(rawText)
  return JSON.parse(cleaned)
}

/**
 * Get the list of configured providers
 */
export function getConfiguredProviders() {
  return Object.entries(PROVIDERS)
    .filter(([_, p]) => p.key)
    .map(([name, p]) => ({ name, model: p.model }))
}

/**
 * Get the primary provider name
 */
export function getPrimaryProvider() {
  const preferred = process.env.AI_PROVIDER?.toLowerCase()
  if (preferred && PROVIDERS[preferred]?.key) return preferred
  // Default: first configured provider
  const configured = Object.keys(PROVIDERS).filter(p => PROVIDERS[p].key)
  return configured[0] || null
}

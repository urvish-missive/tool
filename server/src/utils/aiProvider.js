import { fetchWithTimeout, extractAndCleanJSON } from './helpers.js'

/* ── Configuration ─────────────────────────────────────────────── */

const AI_TIMEOUT = 45000

const PROVIDERS = {
  'gemini-3.5-flash': {
    url: process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: process.env.GEMINI_3_5_MODEL || 'gemini-3.5-flash',
    key: process.env.AI_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
  'gemini-3.7-flash': {
    url: process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: process.env.GEMINI_3_7_MODEL || process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.7-flash',
    key: process.env.AI_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
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
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: process.env.OPENROUTER_MODEL || 'google/gemini-3.5-flash',
    key: process.env.OPENROUTER_API_KEY,
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

  const { temperature = 0.4, maxTokens = 4000, timeout = AI_TIMEOUT, jsonMode = false } = options

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
    const bodyText = await response.text().catch(() => '')

    // Handle 402 (credits exceeded) — retry with fewer tokens
    if (status === 402 && maxTokens > 1000) {
      console.log(`Retrying ${providerName} with reduced tokens (${Math.floor(maxTokens / 2)})`)
      return callProvider(providerName, messages, { ...options, maxTokens: Math.floor(maxTokens / 2) })
    }

    throw new Error(`AI API ${providerName} returned ${status}: ${bodyText.substring(0, 200)}`)
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

  // Normalize provider alias
  let targetProvider = preferredProvider
  if (targetProvider === 'gemini-3.5' || targetProvider === 'gemini_3_5') targetProvider = 'gemini-3.5-flash'
  if (targetProvider === 'gemini-3.7' || targetProvider === 'gemini_3_7') targetProvider = 'gemini-3.7-flash'

  // Determine provider order
  // If a specific provider is selected, ONLY use that one (no fallback)
  const providerOrder = targetProvider
    ? [targetProvider]
    : ['gemini-3.7-flash', 'groq', 'openrouter', 'gemini-3.5-flash'].filter(p => PROVIDERS[p]?.key)

  console.log(`AI provider: ${providerOrder.join(' → ')}${targetProvider ? ' (strict)' : ' (auto-fallback)'}`)
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
    }
  }

  throw new Error(`AI provider failed: ${errors.join(' | ')}`)
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

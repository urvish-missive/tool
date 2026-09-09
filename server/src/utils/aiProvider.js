import { fetchWithTimeout, extractAndCleanJSON } from './helpers.js'

/* ── Configuration ─────────────────────────────────────────────── */

const AI_TIMEOUT = 12000

const PROVIDERS = {
  'gemini-3.5-flash-lite': {
    url: process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: process.env.GEMINI_3_5_LITE_MODEL || 'gemini-3.5-flash-lite',
    key: process.env.AI_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
  'gemini-3.5-flash': {
    url: process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: process.env.GEMINI_3_5_MODEL || 'gemini-3.5-flash',
    key: process.env.AI_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
  gemini: {
    url: process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    key: process.env.AI_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    key: process.env.GROQ_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: process.env.OPENROUTER_MODEL || 'cohere/north-mini-code:free',
    key: process.env.OPENROUTER_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
  zen: {
    url: process.env.ZEN_API_URL || 'https://opencode.ai/zen/v1/chat/completions',
    model: process.env.ZEN_MODEL || 'big-pickle',
    key: process.env.ZEN_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
  'zen-pickle': {
    url: process.env.ZEN_API_URL || 'https://opencode.ai/zen/v1/chat/completions',
    model: 'big-pickle',
    key: process.env.ZEN_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
  'zen-mimo': {
    url: process.env.ZEN_API_URL || 'https://opencode.ai/zen/v1/chat/completions',
    model: 'mimo-v2.5-free',
    key: process.env.ZEN_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
  'qwen-3.8': {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'qwen/qwen3.8-27b',
    key: process.env.GROQ_API_KEY,
    headerName: 'Authorization',
    headerPrefix: 'Bearer ',
  },
  'north-mini': {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'cohere/north-mini-code:free',
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

  const {
    temperature = 0.4,
    maxTokens = 4000,
    timeout = (providerName.startsWith('zen') ? 25000 : AI_TIMEOUT),
    jsonMode = false
  } = options

  const body = {
    model: provider.model,
    messages,
    temperature,
    max_tokens: maxTokens,
  }
  if (jsonMode && providerName !== 'groq' && !provider.noJsonFormat) {
    body.response_format = { type: 'json_object' }
  }

  const headers = {
    'Content-Type': 'application/json',
    [provider.headerName]: `${provider.headerPrefix}${provider.key}`,
  }

  // OpenCode Zen requires x-opencode-session header and opencode user-agent for free-tier models
  if (providerName.startsWith('zen') || provider.url?.includes('opencode.ai')) {
    headers['x-opencode-session'] = 'session_' + Math.random().toString(36).substring(2, 12)
    headers['User-Agent'] = 'opencode/1.0.0'
  }

  const response = await fetchWithTimeout(provider.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }, timeout)

  if (!response.ok) {
    const status = response.status
    const bodyText = await response.text().catch(() => '')

    // Handle 402 (credits exceeded) on OpenRouter — try free tier model
    if (status === 402 && providerName === 'openrouter' && !provider.model.includes(':free')) {
      console.log('OpenRouter paid credits exhausted; falling back to free tier model minimax/minimax-m2.7:free...')
      try {
        const freeOpts = { ...options, maxTokens: Math.min(maxTokens, 4000) }
        const freeBody = {
          model: 'minimax/minimax-m2.7:free',
          messages,
          temperature,
          max_tokens: freeOpts.maxTokens,
        }
        if (jsonMode) freeBody.response_format = { type: 'json_object' }

        const freeRes = await fetchWithTimeout(provider.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [provider.headerName]: `${provider.headerPrefix}${provider.key}`,
          },
          body: JSON.stringify(freeBody),
        }, timeout)

        if (freeRes.ok) {
          const freeData = await freeRes.json()
          let freeContent = freeData.choices?.[0]?.message?.content || ''
          if (freeContent) {
            freeContent = freeContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
            freeContent = freeContent.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
            return freeContent
          }
        }
      } catch (freeErr) {
        console.warn('OpenRouter free tier fallback failed:', freeErr.message)
      }
    }

    // Handle 402 (credits exceeded) — retry with fewer tokens if applicable
    if (status === 402 && maxTokens > 1000) {
      console.log(`Retrying ${providerName} with reduced tokens (${Math.floor(maxTokens / 2)})`)
      return callProvider(providerName, messages, { ...options, maxTokens: Math.floor(maxTokens / 2) })
    }

    throw new Error(`AI API ${providerName} returned ${status}: ${bodyText.substring(0, 200)}`)
  }

  const data = await response.json()
  let content = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content || ''
  if (!content) throw new Error(`AI API ${providerName} returned empty content`)

  // Strip <think>...</think> tags (some models include reasoning)
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // Strip ```json...``` fences if present
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

  return content
}

/* ── High-Level Call with Auto-Rotation ────────────────────────── */

// Providers ordered by quality (best/latest first). The primary provider rotates
// for every request so token usage is spread across models while staying on the
// best available results, falling back down the list if the primary fails.
const QUALITY_PROVIDER_ORDER = [
  'gemini-3.5-flash',
  'zen',
  'zen-mimo',
  'gemini-3.5-flash-lite',
  'groq',
  'qwen-3.8',
  'north-mini',
  'openrouter',
]

let rotationIndex = -1

function getRotationProviderOrder() {
  const configured = QUALITY_PROVIDER_ORDER.filter((p) => PROVIDERS[p]?.key)
  rotationIndex += 1
  const startIndex = rotationIndex % configured.length
  return [...configured.slice(startIndex), ...configured.slice(0, startIndex)]
}

/**
 * Call AI with automatic provider rotation and fallback.
 * The primary provider changes for every request (round-robin across configured
 * providers, best/latest first). Any preferredProvider sent by the client is
 * ignored in favor of rotation.
 *
 * @param {Array} messages - Chat messages array
 * @param {Object} options - { temperature, maxTokens, timeout }
 * @returns {string} AI response text
 */
export async function callAI(messages, options = {}) {
  const { preferredProvider, ...callOpts } = options
  const providerOrder = getRotationProviderOrder()

  console.log(`AI provider (auto-rotate): ${providerOrder.join(' → ')}`)
  const errors = []

  for (const providerName of providerOrder) {
    if (!PROVIDERS[providerName]?.key) continue

    try {
      const result = await callProvider(providerName, messages, callOpts)
      console.log(`[OK] AI response from ${providerName}`)
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
export async function callAIAndParseJSON(messagesOrSystem, optionsOrUser = {}, possibleOptions = {}) {
  let messages = messagesOrSystem
  let options = optionsOrUser
  if (typeof messagesOrSystem === 'string' && typeof optionsOrUser === 'string') {
    messages = [
      { role: 'system', content: messagesOrSystem },
      { role: 'user', content: optionsOrUser },
    ]
    options = possibleOptions
  }
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

export { apiResultCache } from './cache.js'


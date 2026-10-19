// Model calls for the Hub & Spoke planner, through the site's own AI provider rotation (utils/aiProvider.js).
import { callAI } from '../../utils/aiProvider.js'

/**
 * Sends one prompt and returns the raw text reply.
 * @param {string} prompt
 * @param {number} maxTokens
 * @param {{ json?: boolean }} [opts] json: ask providers for a JSON object reply
 */
export async function askModel(prompt, maxTokens, opts = {}) {
  try {
    return await callAI([{ role: 'user', content: prompt }], {
      maxTokens,
      temperature: 0.5,
      timeout: 170000,
      jsonMode: !!opts.json,
      maxProviders: 3,
    })
  } catch (err) {
    console.error('[hub-spoke] AI providers failed:', err.message)
    const e = new Error('upstream')
    e.status = /\b429\b/.test(err.message) ? 429 : 502
    throw e
  }
}

// Tolerant JSON extraction: the whole reply, a fenced block, or the outermost braces.
export function parseJson(text, ok) {
  const tries = [
    text,
    (text.match(/```(?:json)?\s*([\s\S]*?)```/) || [])[1],
    text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1),
  ]
  for (const t of tries) {
    try {
      const d = JSON.parse(t)
      if (d && ok(d)) return d
    } catch {}
  }
  return null
}

// Asks for JSON and retries once when the reply cannot be parsed (the rotation then usually picks
// another provider). Returns null when both replies are unusable.
export async function askJson(prompt, maxTokens, ok) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const data = parseJson(await askModel(prompt, maxTokens, { json: true }), ok)
    if (data) return data
    console.warn(`[hub-spoke] unusable JSON reply (attempt ${attempt + 1})`)
  }
  return null
}

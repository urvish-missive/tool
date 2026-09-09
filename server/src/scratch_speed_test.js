import 'dotenv/config'
import { callAI } from './utils/aiProvider.js'

async function benchmark() {
  const testMessages = [
    { role: 'system', content: 'You are an SEO expert. Return JSON.' },
    { role: 'user', content: 'Generate 3 blog topics for "Coffee Brewing" as a JSON array of objects with title and targetKeyword.' }
  ]

  const providers = ['gemini-3.5-flash-lite', 'groq', 'zen', 'openrouter']

  for (const p of providers) {
    const start = Date.now()
    try {
      console.log(`\nTesting ${p}...`)
      const res = await callAI(testMessages, { preferredProvider: p, maxTokens: 1000, jsonMode: true })
      const elapsed = Date.now() - start
      console.log(`✓ ${p} succeeded in ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`)
      console.log('Sample response:', res.slice(0, 80))
    } catch (err) {
      const elapsed = Date.now() - start
      console.log(`✗ ${p} failed in ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s): ${err.message}`)
    }
  }
}

benchmark()

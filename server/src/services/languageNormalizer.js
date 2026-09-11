/**
 * General-Purpose Language Normalization
 * 
 * Detects spelling mistakes, spacing issues, duplicate words, accidental
 * punctuation, incorrect capitalization, and malformed phrases.
 * 
 * NO hardcoded word-to-word corrections (e.g. "coffe" → "coffee").
 * Uses LLM-based contextual normalization via the AI provider,
 * with a local heuristic fallback for common mechanical issues.
 */

import { callAIAndParseJSON } from '../utils/aiProvider.js'

/**
 * Detects mechanical issues that don't require AI:
 * - Double words ("the the")
 * - Extra spaces
 * - Accidental punctuation duplication
 * - Leading/trailing junk
 */
function heuristicNormalize(text) {
  const corrections = []
  let cleaned = text

  // Double word detection
  const doubleWordMatch = cleaned.match(/\b(\w+)\s+\1\b/gi)
  if (doubleWordMatch) {
    for (const match of doubleWordMatch) {
      const word = match.split(/\s+/)[0]
      corrections.push({
        original: match,
        suggested: word,
        confidence: 0.95,
        reason: 'Duplicate word detected',
        type: 'duplicate_word',
      })
      cleaned = cleaned.replace(match, word, 1)
    }
  }

  // Extra spaces
  if (/\s{2,}/.test(cleaned)) {
    const original = cleaned
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim()
    if (original !== cleaned) {
      corrections.push({
        original: original.trim(),
        suggested: cleaned,
        confidence: 1.0,
        reason: 'Extra whitespace removed',
        type: 'spacing',
      })
    }
  }

  // Accidental punctuation repetition (e.g. "word..", "word,,")
  cleaned = cleaned.replace(/([.,!?;:])\1+/g, '$1')

  // Leading/trailing punctuation that's likely accidental
  cleaned = cleaned.replace(/^[,;:.!?]+|[,;:.!?]+$/g, '').trim()

  return { cleaned, corrections }
}

/**
 * Uses AI to detect and correct likely spelling/typo errors in the subject.
 * Returns corrections with confidence scores — low-confidence corrections
 * are preserved as-is (marked ambiguous) rather than silently replaced.
 */
export async function detectLanguageCorrections(rawText, preferredProvider) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      normalized: rawText,
      corrections: [],
      ambiguities: [],
      confidence: 1.0,
    }
  }

  // First pass: mechanical fixes
  const { cleaned: heuristicClean, corrections: heuristicCorrections } = heuristicNormalize(rawText)

  // Second pass: AI-based contextual normalization
  let aiCorrections = []
  let normalizedText = heuristicClean
  let aiConfidence = 1.0

  try {
    const result = await callAIAndParseJSON(
      [
        {
          role: 'system',
          content: `You are a general-purpose text normalization engine. Your ONLY job is to identify likely typos, spelling mistakes, and malformed phrases in the user's text.

CRITICAL RULES:
1. ONLY correct text that is very likely a typo or spelling error.
2. Do NOT change proper nouns, brand names, or unusual but valid words.
3. Do NOT change the meaning of the text.
4. Do NOT add words that aren't there.
5. Do NOT remove words that are there (unless they are exact duplicates).
6. Return corrections as a JSON array. Each correction must have:
   - "original": the text fragment that appears to be wrong
   - "suggested": what it should be
   - "confidence": 0.0 to 1.0 (how confident you are this is a typo)
   - "reason": brief explanation
7. If no corrections are needed, return an empty array.
8. If the text is already clean, return an empty array.
9. For compound phrases like "cafe and coffe", detect if "coffe" is a typo for "coffee" and suggest the correction.

Return JSON: { "corrections": [...], "normalized": "the fully corrected text" }`,
        },
        {
          role: 'user',
          content: `Normalize this text: "${heuristicClean}"`,
        },
      ],
      {
        preferredProvider: preferredProvider || 'groq',
        temperature: 0.1,
        maxTokens: 500,
        jsonMode: true,
      }
    )

    if (result && Array.isArray(result.corrections)) {
      aiCorrections = result.corrections.filter(c =>
        c.original && c.suggested && typeof c.confidence === 'number'
      )
      if (result.normalized && typeof result.normalized === 'string') {
        normalizedText = result.normalized
      }
    }
  } catch {
    // AI normalization unavailable — fall back to heuristic-only
    aiConfidence = 0.7
  }

  // Merge corrections, dedup
  const allCorrections = [...heuristicCorrections]
  const seenOriginals = new Set(heuristicCorrections.map(c => c.original.toLowerCase()))

  for (const c of aiCorrections) {
    if (!seenOriginals.has(c.original.toLowerCase())) {
      allCorrections.push({ ...c, type: 'spelling' })
      seenOriginals.add(c.original.toLowerCase())
    }
  }

  // Separate high-confidence from ambiguous
  const highConfidence = allCorrections.filter(c => c.confidence >= 0.8)
  const ambiguities = allCorrections.filter(c => c.confidence < 0.8)

  // Apply only high-confidence corrections to get final normalized text
  let finalNormalized = heuristicClean
  for (const c of highConfidence) {
    if (c.original && c.suggested) {
      const regex = new RegExp(escapeRegex(c.original), 'gi')
      finalNormalized = finalNormalized.replace(regex, c.suggested)
    }
  }

  // Clean up extra spaces after corrections
  finalNormalized = finalNormalized.replace(/\s{2,}/g, ' ').trim()

  return {
    normalized: finalNormalized,
    corrections: allCorrections,
    ambiguities,
    confidence: highConfidence.length > 0 ? 0.9 : aiConfidence,
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

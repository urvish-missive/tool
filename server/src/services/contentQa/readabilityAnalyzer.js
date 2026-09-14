/**
 * Prose-Aware Readability Analyzer
 * 
 * Computes Flesch Reading Ease specifically on editorial prose blocks,
 * excluding structural noise such as:
 * - Headings
 * - Tables
 * - Code blocks
 * - URLs
 * - Short list labels / navigation text
 * - Footers & copyright notices
 * 
 * Returns auditable metadata for transparent verification.
 */

/**
 * Approximate syllable count for an English word
 */
export function countSyllables(word) {
  if (!word) return 0
  const clean = word.toLowerCase().replace(/[^a-z]/g, '')
  if (clean.length <= 3) return 1

  // Count vowel sequences
  const vowelMatches = clean.match(/[aeiouy]{1,2}/g)
  let count = vowelMatches ? vowelMatches.length : 1

  // Deduct silent 'e' at the end unless preceded by 'l' (like 'table')
  if (clean.endsWith('e') && !clean.endsWith('le') && count > 1) {
    count--
  }

  // Deduct 'ed' past tense endings unless preceded by 't' or 'd' (like 'wanted', 'needed')
  if (clean.endsWith('ed') && !clean.endsWith('ted') && !clean.endsWith('ded') && count > 1) {
    count--
  }

  return Math.max(1, count)
}

/**
 * Analyze readability across document blocks
 * @param {Array<Object>} blocks - Structured document blocks from blockParser
 * @returns {Object} Auditable readability metrics
 */
export function analyzeProseReadability(blocks) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return {
      readabilityScore: 70,
      method: 'flesch_kincaid_prose_aware',
      analyzedWordCount: 0,
      analyzedSentenceCount: 0,
      excludedBlockCount: 0,
      avgWordsPerSentence: 0,
      confidence: 0.5,
      gradeLevel: 'Conversational',
    }
  }

  let analyzedWordCount = 0
  let totalSyllables = 0
  let analyzedSentenceCount = 0
  let excludedBlockCount = 0

  for (const block of blocks) {
    // Only prose paragraphs and blockquotes qualify for editorial readability
    if (!block.isProse || block.blockType === 'code' || block.blockType === 'table') {
      excludedBlockCount++
      continue
    }

    const sentences = block.sentences || []
    if (sentences.length === 0) continue

    analyzedSentenceCount += sentences.length

    const words = (block.cleanText || '')
      .split(/\s+/)
      .filter((w) => w.trim().length > 0)

    analyzedWordCount += words.length

    for (const w of words) {
      totalSyllables += countSyllables(w)
    }
  }

  // Guard against division by zero
  if (analyzedWordCount < 5 || analyzedSentenceCount === 0) {
    return {
      readabilityScore: 75,
      method: 'flesch_kincaid_prose_aware',
      analyzedWordCount,
      analyzedSentenceCount,
      excludedBlockCount,
      avgWordsPerSentence: 0,
      confidence: 0.4,
      gradeLevel: 'Short Content',
    }
  }

  // Flesch Reading Ease Formula:
  // 206.835 - (1.015 * ASL) - (84.6 * ASW)
  // ASL = Average Sentence Length (words / sentences)
  // ASW = Average Syllables per Word (syllables / words)
  const asl = analyzedWordCount / analyzedSentenceCount
  const asw = totalSyllables / analyzedWordCount

  const rawScore = 206.835 - (1.015 * asl) - (84.6 * asw)
  const readabilityScore = Math.min(100, Math.max(0, Math.round(rawScore)))

  const gradeLevel =
    readabilityScore >= 70
      ? 'Very Easy & Conversational'
      : readabilityScore >= 60
      ? 'Standard & Natural'
      : readabilityScore >= 50
      ? 'Fairly Complex'
      : readabilityScore >= 30
      ? 'Academic / Technical'
      : 'Dense & Difficult'

  // Confidence is high if at least 100 prose words analyzed
  const confidence = Math.min(1.0, Math.max(0.6, analyzedWordCount / 150))

  return {
    readabilityScore,
    method: 'flesch_kincaid_prose_aware',
    analyzedWordCount,
    analyzedSentenceCount,
    excludedBlockCount,
    avgWordsPerSentence: Math.round(asl),
    confidence: Number(confidence.toFixed(2)),
    gradeLevel,
  }
}

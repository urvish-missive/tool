/**
 * Exact Unicode Punctuation Classifier
 * 
 * Accurately distinguishes between:
 * - Em dash (U+2014)
 * - En dash (U+2013)
 * - Hyphen-minus (U+002D)
 * - Minus sign (U+2212)
 * - Colon (U+003A)
 * - Semicolon (U+003B)
 * 
 * Rules apply strictly within configured scope (e.g. editorial prose),
 * never conflating En dashes with Em dashes, and ignoring URLs, code, and table syntax.
 */

// Exact Unicode regexes
const EM_DASH_PATTERN = /[\u2014]|&mdash;|&#8212;/g
const EN_DASH_PATTERN = /[\u2013]|&ndash;|&#8213;/g
const DOUBLE_HYPHEN_PATTERN = /(?<![<>-])--(?!>)/g // `--` used as dash break, not HTML comment
const COLON_PATTERN = /:/g

/**
 * Check if a character at index in text is part of a URL (http:// or https://)
 */
function isUrlColon(text, index) {
  const prevChunk = text.slice(Math.max(0, index - 8), index)
  const nextChunk = text.slice(index + 1, index + 3)
  if (/https?$/i.test(prevChunk) && nextChunk === '//') return true
  return false
}

/**
 * Check if a character at index is part of a timestamp or ratio (e.g. 10:30, 1:1, 4:3)
 */
function isNumericColon(text, index) {
  const charBefore = text[index - 1] || ''
  const charAfter = text[index + 1] || ''
  return /\d/.test(charBefore) && /\d/.test(charAfter)
}

/**
 * Check if an en dash at index is a legitimate tight numeric range (10-15,
 * 1-2, 30-50) rather than a spaced/word-adjacent dash used as an em dash
 * substitute. Only a digit immediately on both sides counts as a range;
 * anything else (a space, a word character) is the em-dash-style usage the
 * "zero em dash" rule exists to catch.
 */
export function isNumericRangeDash(text, index) {
  const charBefore = text[index - 1] || ''
  const charAfter = text[index + 1] || ''
  return /\d/.test(charBefore) && /\d/.test(charAfter)
}

/**
 * Extract context snippet centered around index
 */
function extractEvidenceContext(fullText, startOffset, length) {
  const radius = 35
  const start = Math.max(0, startOffset - radius)
  const end = Math.min(fullText.length, startOffset + length + radius)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < fullText.length ? '...' : ''
  return prefix + fullText.substring(start, end).replace(/\s+/g, ' ') + suffix
}

/**
 * Detect Em Dashes in eligible blocks
 * @param {Array<Object>} blocks - Structured document blocks
 * @param {string} rawContent - Full document content for global offset tracking
 * @returns {Object} { count, evidence }
 */
export function detectEmDashes(blocks, rawContent) {
  const evidence = []
  let count = 0

  // Scope: Only prose paragraphs and headings (ignore code, tables, metadata)
  const targetBlocks = blocks.filter((b) => b.isProse || b.blockType === 'heading')

  for (const block of targetBlocks) {
    const text = block.rawText || ''
    let match

    // 1. Check exact Unicode Em Dash
    EM_DASH_PATTERN.lastIndex = 0
    while ((match = EM_DASH_PATTERN.exec(text)) !== null) {
      count++
      const startOffset = block.startOffset + match.index
      const charLen = match[0].length

      evidence.push({
        text: match[0],
        charName: 'EM DASH (U+2014)',
        startOffset,
        endOffset: startOffset + charLen,
        blockId: block.blockId,
        blockType: block.blockType,
        line: block.startLine,
        context: extractEvidenceContext(rawContent, startOffset, charLen),
      })
    }

    // 2. Check double hyphens used as em dash surrogates
    DOUBLE_HYPHEN_PATTERN.lastIndex = 0
    while ((match = DOUBLE_HYPHEN_PATTERN.exec(text)) !== null) {
      count++
      const startOffset = block.startOffset + match.index
      const charLen = match[0].length

      evidence.push({
        text: match[0],
        charName: 'DOUBLE HYPHEN (--) (Em Dash surrogate)',
        startOffset,
        endOffset: startOffset + charLen,
        blockId: block.blockId,
        blockType: block.blockType,
        line: block.startLine,
        context: extractEvidenceContext(rawContent, startOffset, charLen),
      })
    }
  }

  return { count, evidence }
}

/**
 * Detect En Dashes used as em-dash substitutes in eligible blocks.
 * En dashes (U+2013) are structurally distinct from Em dashes, and have one
 * legitimate prose use: a tight numeric range (10-15, 1-2, 30-50) with no
 * surrounding whitespace. Any other en dash, most commonly a spaced dash
 * used to join a heading fragment or clause ("Headline – An SEO Gold
 * Mine", "Build trust – empathy helps..."), is doing the exact same
 * clause-connecting job an em dash would and is flagged the same way.
 * @param {Array<Object>} blocks
 * @param {string} rawContent
 * @returns {Object} { count, evidence }
 */
export function detectEnDashes(blocks, rawContent) {
  const evidence = []
  let count = 0

  const targetBlocks = blocks.filter((b) => b.isProse || b.blockType === 'heading')

  for (const block of targetBlocks) {
    const text = block.rawText || ''
    let match

    EN_DASH_PATTERN.lastIndex = 0
    while ((match = EN_DASH_PATTERN.exec(text)) !== null) {
      if (isNumericRangeDash(text, match.index)) continue

      count++
      const startOffset = block.startOffset + match.index
      const charLen = match[0].length

      evidence.push({
        text: match[0],
        charName: 'EN DASH (U+2013) used as em dash substitute',
        startOffset,
        endOffset: startOffset + charLen,
        blockId: block.blockId,
        blockType: block.blockType,
        line: block.startLine,
        context: extractEvidenceContext(rawContent, startOffset, charLen),
      })
    }
  }

  return { count, evidence }
}

/**
 * Detect Colons in eligible blocks
 * Excludes URLs (https://) and numeric timestamps/ratios (10:30, 1:1)
 * @param {Array<Object>} blocks
 * @param {string} rawContent
 * @returns {Object} { count, evidence }
 */
export function detectColons(blocks, rawContent) {
  const evidence = []
  let count = 0

  // Scope: Only prose paragraphs and headings (ignore code, tables, url lists)
  const targetBlocks = blocks.filter((b) => b.isProse || b.blockType === 'heading')

  for (const block of targetBlocks) {
    const text = block.rawText || ''
    let match

    COLON_PATTERN.lastIndex = 0
    while ((match = COLON_PATTERN.exec(text)) !== null) {
      const idx = match.index

      // Guard 1: Exclude URLs
      if (isUrlColon(text, idx)) continue

      // Guard 2: Exclude numeric timestamps / ratios (10:30, 1:1)
      if (isNumericColon(text, idx)) continue

      count++
      const startOffset = block.startOffset + idx
      const charLen = 1

      evidence.push({
        text: ':',
        charName: 'COLON (U+003A)',
        startOffset,
        endOffset: startOffset + charLen,
        blockId: block.blockId,
        blockType: block.blockType,
        line: block.startLine,
        context: extractEvidenceContext(rawContent, startOffset, charLen),
      })
    }
  }

  return { count, evidence }
}

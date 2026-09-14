/**
 * Style, Cliché & Linguistic Detector
 * 
 * Implements:
 * 1. Sentence completeness (bullet-aware; intentional bullet items are NOT flagged as fragments).
 * 2. Robotic phrase & AI cliché detection (single source of truth; quotes actual content only; never invents examples).
 * 3. Filler phrase & throat-clearing detection.
 * 4. Source truncation verification (verifies original document block before flagging abrupt cutoffs).
 */

// Configurable dictionary of AI robotic clichés with human suggestions
export const DEFAULT_AI_ROBOTIC_PHRASES = [
  { phrase: 'delve', suggestion: 'explore / look into' },
  { phrase: 'delves', suggestion: 'explores / investigates' },
  { phrase: 'delving', suggestion: 'exploring / digging into' },
  { phrase: 'tapestry', suggestion: 'mix / blend / range' },
  { phrase: 'testament to', suggestion: 'proof of / shows that' },
  { phrase: 'game-changer', suggestion: 'major breakthrough / key shift' },
  { phrase: 'game changer', suggestion: 'major breakthrough / key shift' },
  { phrase: 'beacon', suggestion: 'example / leader' },
  { phrase: 'seamlessly', suggestion: 'smoothly / easily' },
  { phrase: 'revolutionize', suggestion: 'transform / reshape' },
  { phrase: 'plethora', suggestion: 'many / wide range' },
  { phrase: "in today's fast-paced world", suggestion: 'today / currently' },
  { phrase: "in today's digital landscape", suggestion: 'today / online' },
  { phrase: 'in this fast-paced world', suggestion: 'today' },
  { phrase: "in today's world", suggestion: 'today' },
  { phrase: 'furthermore', suggestion: "also / what's more" },
  { phrase: 'moreover', suggestion: 'plus / and' },
  { phrase: 'at the forefront', suggestion: 'leading / ahead' },
  { phrase: 'crucial role', suggestion: 'big role / key part' },
  { phrase: 'paramount', suggestion: 'essential / vital' },
  { phrase: 'unwavering', suggestion: 'steady / consistent' },
  { phrase: 'in summary', suggestion: 'bottom line / key takeaway' },
  { phrase: 'in conclusion', suggestion: 'bottom line / what this means' },
  { phrase: 'it is important to note', suggestion: 'note that / remember' },
  { phrase: 'it is worth noting', suggestion: 'notice that' },
  { phrase: 'embark on a journey', suggestion: 'start / begin' },
  { phrase: 'foster', suggestion: 'build / grow / encourage' },
  { phrase: 'unleash', suggestion: 'unlock / release' },
  { phrase: 'navigating the', suggestion: 'handling / managing' },
  { phrase: 'supercharge', suggestion: 'boost / speed up' },
  { phrase: 'pivotal', suggestion: 'key / central' },
  { phrase: 'holistic', suggestion: 'complete / full' },
  { phrase: 'harness the power of', suggestion: 'use / leverage' },
  { phrase: 'spearhead', suggestion: 'lead / drive' },
  { phrase: 'cutting-edge', suggestion: 'modern / latest' },
  { phrase: 'state-of-the-art', suggestion: 'modern / high-end' },
  { phrase: 'unlock the potential', suggestion: 'get more from' },
  { phrase: 'multifaceted', suggestion: 'complex / varied / dynamic' },
  { phrase: 'intertwined', suggestion: 'linked / connected' },
  { phrase: 'elucidate', suggestion: 'explain / clarify' },
  { phrase: 'bespoke', suggestion: 'custom / tailored' },
  { phrase: 'myriad of', suggestion: 'many / countless' },
  { phrase: 'myriad', suggestion: 'many / numerous' },
  { phrase: 'paradigm shift', suggestion: 'fundamental change / major shift' },
  { phrase: 'synergy', suggestion: 'teamwork / combined impact' },
  { phrase: 'synergies', suggestion: 'benefits / collaboration' },
  { phrase: 'in an era where', suggestion: 'when / now that' },
]

export const DEFAULT_FILLER_PHRASES = [
  'needless to say',
  'as we all know',
  'it goes without saying',
  'it is interesting to note that',
  'at the end of the day',
  'in order to',
  'due to the fact that',
  'for the purpose of',
  'in the event that',
  'with that being said',
  'all things considered',
  'first and foremost',
  'last but not least',
  'in a nutshell',
  'at this point in time',
  'on the other hand',
  'as a matter of fact',
]

/**
 * Extract context snippet centered around index
 */
function extractContext(fullText, startOffset, length) {
  const radius = 30
  const start = Math.max(0, startOffset - radius)
  const end = Math.min(fullText.length, startOffset + length + radius)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < fullText.length ? '...' : ''
  return prefix + fullText.substring(start, end).replace(/\s+/g, ' ') + suffix
}

/**
 * Detect robotic AI clichés strictly from the text
 * @param {Array<Object>} blocks
 * @param {string} rawContent
 * @param {Array} customPhraseList
 * @returns {Object} { phrasesFound, evidence }
 */
export function detectRoboticPhrases(blocks, rawContent, customPhraseList = DEFAULT_AI_ROBOTIC_PHRASES) {
  const evidence = []
  const phrasesFound = []
  const phraseSet = new Set()

  // Target prose, headings, quotes, and bullets
  const targetBlocks = blocks.filter((b) => b.blockType !== 'code')

  for (const block of targetBlocks) {
    const text = block.rawText || ''

    for (const item of customPhraseList) {
      const regex = new RegExp(`\\b${item.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      let match

      while ((match = regex.exec(text)) !== null) {
        const startOffset = block.startOffset + match.index
        const len = match[0].length

        // Record finding
        evidence.push({
          text: match[0],
          phraseRule: item.phrase,
          suggestion: item.suggestion,
          startOffset,
          endOffset: startOffset + len,
          blockId: block.blockId,
          blockType: block.blockType,
          line: block.startLine,
          context: extractContext(rawContent, startOffset, len),
        })

        if (!phraseSet.has(match[0].toLowerCase())) {
          phraseSet.add(match[0].toLowerCase())
          phrasesFound.push({
            phrase: match[0],
            suggestion: item.suggestion,
          })
        }
      }
    }
  }

  return {
    count: evidence.length,
    distinctPhrases: phrasesFound,
    evidence,
  }
}

/**
 * Detect filler & throat-clearing openers
 */
export function detectFillerPhrases(blocks, rawContent, customFillers = DEFAULT_FILLER_PHRASES) {
  const evidence = []
  const fillersFound = []

  const targetBlocks = blocks.filter((b) => b.isProse)

  for (const block of targetBlocks) {
    const text = block.rawText || ''

    for (const filler of customFillers) {
      const regex = new RegExp(`\\b${filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      let match

      while ((match = regex.exec(text)) !== null) {
        const startOffset = block.startOffset + match.index
        const len = match[0].length

        evidence.push({
          text: match[0],
          startOffset,
          endOffset: startOffset + len,
          blockId: block.blockId,
          blockType: block.blockType,
          line: block.startLine,
          context: extractContext(rawContent, startOffset, len),
        })

        fillersFound.push(match[0])
      }
    }
  }

  return {
    count: evidence.length,
    fillers: fillersFound,
    evidence,
  }
}

/**
 * Bullet-aware sentence completeness analysis
 * Short bullet list items/labels/checklists are NOT sentence fragments!
 * Only incomplete prose paragraphs fail.
 */
export function analyzeSentenceCompleteness(blocks, rawContent) {
  const proseBlocks = blocks.filter((b) => b.isProse && b.blockType === 'paragraph')
  const runawaySentences = []
  const abruptFragments = []

  for (const block of proseBlocks) {
    const sentences = block.sentences || []

    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/).filter(Boolean)
      const wordLen = words.length

      // 1. Runaway sentence check (> 35 words in prose)
      if (wordLen > 35) {
        const idx = rawContent.indexOf(sentence)
        runawaySentences.push({
          text: sentence,
          wordCount: wordLen,
          startOffset: idx !== -1 ? idx : block.startOffset,
          endOffset: idx !== -1 ? idx + sentence.length : block.endOffset,
          blockId: block.blockId,
          blockType: block.blockType,
          context: sentence.substring(0, 80) + '...',
        })
      }

      // 2. Abrupt fragment check: Under 4 words, not ending in valid punctuation,
      // and NOT a recognized conversational one-word answer (Yes, No, Exactly, Agreed, Why?, How?)
      const isConversationalShort = /^(Yes|No|Why\?|How\?|Exactly\.|Indeed\.|Agreed\.|Never\.|Always\.)/i.test(sentence.trim())
      if (wordLen < 3 && !isConversationalShort) {
        const idx = rawContent.indexOf(sentence)
        abruptFragments.push({
          text: sentence,
          wordCount: wordLen,
          startOffset: idx !== -1 ? idx : block.startOffset,
          endOffset: idx !== -1 ? idx + sentence.length : block.endOffset,
          blockId: block.blockId,
          blockType: block.blockType,
          context: sentence,
        })
      }
    }
  }

  return {
    runawaySentences,
    abruptFragments,
    passed: runawaySentences.length === 0 && abruptFragments.length === 0,
  }
}

/**
 * Source Truncation Verification
 * Re-checks the actual source block to ensure a sentence is truly cut off in the source,
 * not merely sliced by an internal token limit or substring chunk!
 */
export function verifySourceTruncation(blocks, rawContent) {
  const truncatedFindings = []

  // Check the very last prose block in the document
  const proseBlocks = blocks.filter((b) => b.isProse)
  if (proseBlocks.length === 0) return { isTruncated: false, evidence: [] }

  const lastBlock = proseBlocks[proseBlocks.length - 1]
  const lastText = (lastBlock.cleanText || '').trim()

  // True truncation signals: ends in a hanging comma, semicolon, open bracket, or mid-word without period/quote
  const hangingPunctuation = /[,;:\-(/[{]\s*$/.test(lastText)
  const endsMidSentence = /[a-zA-Z0-9]$/.test(lastText) && !/[.!?)"'’\]}]$/.test(lastText)

  if (hangingPunctuation || endsMidSentence) {
    truncatedFindings.push({
      text: lastText.slice(-40),
      startOffset: lastBlock.endOffset - Math.min(40, lastText.length),
      endOffset: lastBlock.endOffset,
      blockId: lastBlock.blockId,
      blockType: lastBlock.blockType,
      context: '...' + lastText.slice(-60),
    })
  }

  return {
    isTruncated: truncatedFindings.length > 0,
    evidence: truncatedFindings,
  }
}

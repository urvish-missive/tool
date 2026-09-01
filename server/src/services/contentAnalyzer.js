/**
 * Programmatic SEO content analysis — deterministic, no AI needed.
 */

export function analyzeContent(content, targetKeyword, secondaryKeywords, contentType) {
  const words = content.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const charCount = content.length
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const paragraphCount = paragraphs.length

  // Headings (lines that look like headings or start with #)
  const lines = content.split('\n')
  const headingLines = lines.filter(l => {
    const t = l.trim()
    return /^#{1,6}\s/.test(t) || (t.length < 100 && t.length > 2 && /^[A-Z]/.test(t) && !t.includes('.') && t === t.trim())
  })
  const h1Count = headingLines.filter(l => /^#\s/.test(l.trim())).length
  const h2Count = headingLines.filter(l => /^##\s/.test(l.trim()) || (!/^#/.test(l.trim()) && l.trim().length < 80)).length
  const h3Count = headingLines.filter(l => /^###\s/.test(l.trim())).length
  const totalHeadings = Math.max(headingLines.length, h1Count + h2Count + h3Count)

  // Extract actual heading text with level labels
  const headingTexts = headingLines.map(l => {
    const t = l.trim()
    let level, text
    if (/^####/.test(t)) { level = 'H4'; text = t.replace(/^#{1,6}\s*/, '') }
    else if (/^###/.test(t)) { level = 'H3'; text = t.replace(/^#{1,6}\s*/, '') }
    else if (/^##/.test(t)) { level = 'H2'; text = t.replace(/^#{1,6}\s*/, '') }
    else if (/^#/.test(t)) { level = 'H1'; text = t.replace(/^#{1,6}\s*/, '') }
    else { level = 'H2'; text = t }
    // Strip any leftover H1:/H2: prefix from the text itself
    text = text.replace(/^H[1-6]:\s*/i, '')
    return `${level}: ${text}`
  })

  // Links and images (basic detection)
  const linkCount = (content.match(/https?:\/\//g) || []).length + (content.match(/\[.*?\]\(.*?\)/g) || []).length
  const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length + (content.match(/<img\s/gi) || []).length

  // Reading time (average 200 wpm)
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200))

  // Average words per sentence
  const wordsPerSentence = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(1) : 0

  // Long sentences (> 25 words)
  const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 25).length

  // Long paragraphs (> 150 words)
  const longParagraphs = paragraphs.filter(p => p.trim().split(/\s+/).length > 150).length

  // Passive voice (basic detection)
  const passivePatterns = /\b(is|are|was|were|been|being|be)\s+(being\s+)?\w+ed\b/gi
  const passiveMatches = content.match(passivePatterns) || []
  const passiveVoiceCount = passiveMatches.length

  // Basic readability (Flesch-like approximation)
  const avgWordsPerSentence = parseFloat(wordsPerSentence)
  const syllableCount = estimateSyllables(words)
  const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0
  const fleschScore = Math.round(206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord)
  const readabilityScore = Math.min(100, Math.max(0, fleschScore))

  // Keyword analysis
  const keywordAnalysis = analyzeKeyword(content, targetKeyword, words)
  const secondaryKeywordAnalysis = (secondaryKeywords || []).map(kw => ({
    keyword: kw,
    ...analyzeKeyword(content, kw, words),
  }))

  // Introduction quality (first 150 words)
  const introWords = words.slice(0, 150).join(' ')
  const hasKeywordInIntro = targetKeyword ? introWords.toLowerCase().includes(targetKeyword.toLowerCase()) : false
  const introLength = introWords.split(/\s+/).length

  return {
    metrics: {
      charCount,
      wordCount,
      sentenceCount,
      paragraphCount,
      avgWordsPerSentence: parseFloat(wordsPerSentence),
      readingTimeMinutes,
      totalHeadings,
      h1Count,
      h2Count,
      h3Count,
      linkCount,
      imageCount,
      longSentences,
      longParagraphs,
      passiveVoiceCount,
      readabilityScore,
    },
    keyword: keywordAnalysis,
    secondaryKeywords: secondaryKeywordAnalysis,
    structure: {
      hasIntroduction: introLength > 30,
      hasKeywordInIntro,
      introWordCount: introLength,
      paragraphCount,
      avgParagraphLength: paragraphCount > 0 ? Math.round(wordCount / paragraphCount) : 0,
      hasLists: /(?:^|\n)\s*(?:[-*•]|\d+[.)])\s/.test(content),
      hasConclusion: detectConclusion(content, words),
    },
    heading_recommendations: {
      current: headingTexts,
      suggested: generateSuggestedHeadings(headingTexts, targetKeyword, contentType, wordCount, introLength > 30, detectConclusion(content, words)),
    },
  }
}

function generateSuggestedHeadings(currentHeadings, targetKeyword, contentType, wordCount, introOk, conclusionOk) {
  const suggestions = []
  const levels = currentHeadings.map(h => h.split(':')[0])
  const texts = currentHeadings.map(h => h.replace(/^H[1-6]:\s*/, ''))

  // Check if H1 exists
  const hasH1 = levels.includes('H1')
  if (!hasH1 && targetKeyword) {
    suggestions.push(`H1: ${targetKeyword.charAt(0).toUpperCase() + targetKeyword.slice(1)} — Complete Guide`)
  } else if (!hasH1 && texts.length > 0) {
    suggestions.push(`H1: ${texts[0]}`)
  }

  // Improve existing headings — make them more descriptive
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i]
    const level = levels[i]
    if (t.length < 15 && level !== 'H1') {
      suggestions.push(`${level}: ${t.charAt(0).toUpperCase() + t.slice(1)}: What You Need to Know`)
    }
  }

  // Add commonly expected sections if missing
  const lowerTexts = texts.map(t => t.toLowerCase()).join(' ')
  const hasFAQ = /frequently|faq|question/.test(lowerTexts)
  const hasConclusionSection = /conclusion|summary|final|wrap/.test(lowerTexts)

  if (!hasFAQ && wordCount > 500) {
    suggestions.push('H2: Frequently Asked Questions')
  }
  if (!hasConclusionSection && wordCount > 300) {
    suggestions.push('H2: Conclusion')
  }

  // Add keyword-related heading suggestion if missing
  if (targetKeyword && !lowerTexts.includes(targetKeyword.toLowerCase())) {
    suggestions.push(`H2: How ${targetKeyword} Can Help Your Business`)
  }

  // Limit to 6 suggestions max
  return suggestions.slice(0, 6)
}

function analyzeKeyword(content, keyword, words) {
  if (!keyword) return null
  const lower = content.toLowerCase()
  const kwLower = keyword.toLowerCase()
  const kwWords = keyword.split(/\s+/)

  const occurrences = countOccurrences(lower, kwLower)
  const frequency = words.length > 0 ? ((occurrences / words.length) * 100).toFixed(2) : '0'
  const nearBeginning = lower.indexOf(kwLower) < content.length * 0.15

  // Check headings
  const lines = content.split('\n')
  const headingsWithKeyword = lines.filter(l => {
    const t = l.trim()
    return (/^#{1,6}\s/.test(t) || (t.length < 100 && /^[A-Z]/.test(t))) && t.toLowerCase().includes(kwLower)
  }).length

  // Keyword stuffing warning (> 3% density is suspicious)
  const density = parseFloat(frequency)
  const stuffingWarning = density > 3

  // All words present
  const allWordsPresent = kwWords.every(w => lower.includes(w.toLowerCase()))

  return {
    keyword,
    occurrences,
    frequency: frequency + '%',
    nearBeginning,
    headingsWithKeyword,
    stuffingWarning,
    allWordsPresent,
  }
}

function countOccurrences(text, substring) {
  let count = 0
  let pos = 0
  while ((pos = text.indexOf(substring, pos)) !== -1) {
    count++
    pos += substring.length
  }
  return count
}

function detectConclusion(content, words) {
  const lower = content.toLowerCase()
  const lastWords = words.slice(-100).join(' ').toLowerCase()
  const conclusionMarkers = ['conclusion', 'summary', 'in conclusion', 'to sum up', 'final thoughts', 'key takeaways', 'wrap up', 'in summary']
  return conclusionMarkers.some(m => lastWords.includes(m))
}

function estimateSyllables(words) {
  let total = 0
  for (const word of words) {
    const w = word.toLowerCase().replace(/[^a-z]/g, '')
    if (w.length <= 3) { total += 1; continue }
    let count = 0
    const vowels = 'aeiouy'
    let prevVowel = false
    for (let i = 0; i < w.length; i++) {
      const isVowel = vowels.includes(w[i])
      if (isVowel && !prevVowel) count++
      prevVowel = isVowel
    }
    if (w.endsWith('e') && count > 1) count--
    total += Math.max(1, count)
  }
  return total
}

/**
 * Content QA Block Parser
 * 
 * Segments raw content into typed, structured blocks with exact character offsets,
 * line numbers, clean text, and block-scoped sentence segmentation.
 * 
 * Block Types:
 * - heading (h1-h6)
 * - paragraph (standard prose)
 * - bullet_list (unordered list items)
 * - numbered_list (ordered list items)
 * - table (markdown tables)
 * - quote (blockquotes)
 * - code (fenced or inline code blocks)
 * - cta (explicit promotional callouts / button-like hooks)
 * - caption (image or media captions)
 * - metadata (headers, frontmatter, document tags)
 * - footer (closing signatures, copyright, disclaimer blocks)
 */

/**
 * Clean inline markdown formatting while preserving exact word tokens
 */
export function stripInlineMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1') // images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/~~(.*?)~~/g, '$1') // strikethrough
    .trim()
}

/**
 * Segment a prose block into individual sentences respecting abbreviations and quotes
 */
export function segmentProseSentences(text) {
  if (!text || typeof text !== 'string') return []
  const clean = text.trim()
  if (!clean) return []

  // Split on sentence-ending punctuation followed by whitespace and capital letter / quote
  // Protect common abbreviations like e.g., i.e., vs., Dr., Mr., etc.
  const protectedText = clean
    .replace(/\b(e\.g\.|i\.e\.|vs\.|etc\.|dr\.|mr\.|mrs\.|ms\.|prof\.)/gi, (m) =>
      m.replace(/\./g, '___DOT___')
    )

  const rawSplits = protectedText.split(/(?<=[.!?])\s+(?=[A-Z0-9"“'‘(])/g)

  const sentences = []
  for (const s of rawSplits) {
    const restored = s.replace(/___DOT___/g, '.').trim()
    if (restored.length > 0) {
      sentences.push(restored)
    }
  }

  return sentences.length > 0 ? sentences : [clean]
}

/**
 * Main Content Parser
 * @param {string} content - Raw document text or markdown
 * @param {string} [title] - Optional headline
 * @returns {Array<Object>} Array of structured block objects
 */
export function parseContentBlocks(content, title = '') {
  if (!content || typeof content !== 'string') return []

  const rawLines = content.split(/\r?\n/)
  const blocks = []
  let currentOffset = 0
  let blockCounter = 0

  let inCodeBlock = false
  let codeBlockLines = []
  let codeBlockStartOffset = 0
  let codeBlockStartLine = 0

  let inTable = false
  let tableLines = []
  let tableStartOffset = 0
  let tableStartLine = 0

  let i = 0
  while (i < rawLines.length) {
    const line = rawLines[i]
    const lineStartOffset = currentOffset
    const lineLength = line.length + 1 // +1 for newline

    // 1. Fenced Code Block Handler
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        codeBlockLines.push(line)
        const rawText = codeBlockLines.join('\n')
        blocks.push({
          blockId: `block-${++blockCounter}`,
          blockType: 'code',
          level: null,
          isProse: false,
          startLine: codeBlockStartLine,
          endLine: i + 1,
          startOffset: codeBlockStartOffset,
          endOffset: codeBlockStartOffset + rawText.length,
          rawText,
          cleanText: '', // Exclude code from prose analysis
          sentences: [],
        })
        inCodeBlock = false
        codeBlockLines = []
      } else {
        inCodeBlock = true
        codeBlockStartLine = i + 1
        codeBlockStartOffset = lineStartOffset
        codeBlockLines = [line]
      }
      currentOffset += lineLength
      i++
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      currentOffset += lineLength
      i++
      continue
    }

    // 2. Table Block Handler
    const isTableLine = /^\s*\|.*\|\s*$/.test(line)
    if (isTableLine) {
      if (!inTable) {
        inTable = true
        tableStartLine = i + 1
        tableStartOffset = lineStartOffset
        tableLines = [line]
      } else {
        tableLines.push(line)
      }
      currentOffset += lineLength
      i++
      continue
    } else if (inTable) {
      const rawText = tableLines.join('\n')
      blocks.push({
        blockId: `block-${++blockCounter}`,
        blockType: 'table',
        level: null,
        isProse: false,
        startLine: tableStartLine,
        endLine: i,
        startOffset: tableStartOffset,
        endOffset: tableStartOffset + rawText.length,
        rawText,
        cleanText: stripInlineMarkdown(rawText.replace(/\|/g, ' ')),
        sentences: [],
      })
      inTable = false
      tableLines = []
    }

    const trimmed = line.trim()

    // 3. Empty line separator
    if (!trimmed) {
      currentOffset += lineLength
      i++
      continue
    }

    // 4. Headings (# to ######)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingText = headingMatch[2].trim()
      blocks.push({
        blockId: `block-${++blockCounter}`,
        blockType: 'heading',
        level,
        isProse: false,
        startLine: i + 1,
        endLine: i + 1,
        startOffset: lineStartOffset,
        endOffset: lineStartOffset + line.length,
        rawText: line,
        cleanText: stripInlineMarkdown(headingText),
        sentences: [stripInlineMarkdown(headingText)],
      })
      currentOffset += lineLength
      i++
      continue
    }

    // 5. Blockquote (> ...)
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '')
      blocks.push({
        blockId: `block-${++blockCounter}`,
        blockType: 'quote',
        level: null,
        isProse: true,
        startLine: i + 1,
        endLine: i + 1,
        startOffset: lineStartOffset,
        endOffset: lineStartOffset + line.length,
        rawText: line,
        cleanText: stripInlineMarkdown(quoteText),
        sentences: segmentProseSentences(stripInlineMarkdown(quoteText)),
      })
      currentOffset += lineLength
      i++
      continue
    }

    // 6. Bullet Lists & Numbered Lists
    const isBulletItem = /^\s*[-*•]\s+(.+)$/.test(line)
    const isNumberedItem = /^\s*\d+[\.\)]\s+(.+)$/.test(line)

    if (isBulletItem || isNumberedItem) {
      const listType = isNumberedItem ? 'numbered_list' : 'bullet_list'
      const listItems = []
      let listStartOffset = lineStartOffset
      let listStartLine = i + 1
      let rawListLines = []

      while (i < rawLines.length) {
        const nextLine = rawLines[i]
        const bulletMatch = nextLine.match(/^\s*[-*•]\s+(.+)$/)
        const numMatch = nextLine.match(/^\s*\d+[\.\)]\s+(.+)$/)

        if (bulletMatch || numMatch) {
          const itemContent = (bulletMatch ? bulletMatch[1] : numMatch[1]).trim()
          listItems.push({
            itemIndex: listItems.length,
            rawText: nextLine,
            cleanText: stripInlineMarkdown(itemContent),
            isCompleteSentence: /[.!?]$/.test(itemContent) && itemContent.split(/\s+/).length >= 4,
          })
          rawListLines.push(nextLine)
          currentOffset += nextLine.length + 1
          i++
        } else {
          break
        }
      }

      const rawText = rawListLines.join('\n')
      blocks.push({
        blockId: `block-${++blockCounter}`,
        blockType: listType,
        level: null,
        isProse: false,
        startLine: listStartLine,
        endLine: i,
        startOffset: listStartOffset,
        endOffset: listStartOffset + rawText.length,
        rawText,
        cleanText: listItems.map((item) => item.cleanText).join('. '),
        listItems,
        sentences: listItems.map((item) => item.cleanText),
      })
      continue
    }

    // 7. Explicit Call-to-Action (CTA) or Footer Signature detection
    const isFooter = /^(copyright|all rights reserved|©|\(c\)|privacy policy|terms of service)/i.test(trimmed)
    if (isFooter) {
      blocks.push({
        blockId: `block-${++blockCounter}`,
        blockType: 'footer',
        level: null,
        isProse: false,
        startLine: i + 1,
        endLine: i + 1,
        startOffset: lineStartOffset,
        endOffset: lineStartOffset + line.length,
        rawText: line,
        cleanText: stripInlineMarkdown(line),
        sentences: [stripInlineMarkdown(line)],
      })
      currentOffset += lineLength
      i++
      continue
    }

    // 8. Editorial Prose Paragraph
    const paraLines = [line]
    const paraStartOffset = lineStartOffset
    const paraStartLine = i + 1
    currentOffset += lineLength
    i++

    while (i < rawLines.length) {
      const nextLine = rawLines[i]
      const nextTrimmed = nextLine.trim()

      if (!nextTrimmed) break
      if (nextTrimmed.startsWith('#')) break
      if (nextTrimmed.startsWith('```')) break
      if (/^\s*\|.*\|\s*$/.test(nextLine)) break
      if (/^\s*[-*•]\s+/.test(nextLine)) break
      if (/^\s*\d+[\.\)]\s+/.test(nextLine)) break
      if (nextTrimmed.startsWith('>')) break

      paraLines.push(nextLine)
      currentOffset += nextLine.length + 1
      i++
    }

    const rawParaText = paraLines.join('\n')
    const cleanParaText = stripInlineMarkdown(paraLines.join(' '))
    const isCta = /^(click here|sign up|subscribe|book a call|schedule a demo|contact us|get in touch|order now|buy now)\b/i.test(cleanParaText)

    blocks.push({
      blockId: `block-${++blockCounter}`,
      blockType: isCta ? 'cta' : 'paragraph',
      level: null,
      isProse: !isCta,
      startLine: paraStartLine,
      endLine: i,
      startOffset: paraStartOffset,
      endOffset: paraStartOffset + rawParaText.length,
      rawText: rawParaText,
      cleanText: cleanParaText,
      sentences: segmentProseSentences(cleanParaText),
    })
  }

  if (inCodeBlock && codeBlockLines.length > 0) {
    const rawText = codeBlockLines.join('\n')
    blocks.push({
      blockId: `block-${++blockCounter}`,
      blockType: 'code',
      level: null,
      isProse: false,
      startLine: codeBlockStartLine,
      endLine: rawLines.length,
      startOffset: codeBlockStartOffset,
      endOffset: codeBlockStartOffset + rawText.length,
      rawText,
      cleanText: '',
      sentences: [],
    })
  }

  if (inTable && tableLines.length > 0) {
    const rawText = tableLines.join('\n')
    blocks.push({
      blockId: `block-${++blockCounter}`,
      blockType: 'table',
      level: null,
      isProse: false,
      startLine: tableStartLine,
      endLine: rawLines.length,
      startOffset: tableStartOffset,
      endOffset: tableStartOffset + rawText.length,
      rawText,
      cleanText: stripInlineMarkdown(rawText.replace(/\|/g, ' ')),
      sentences: [],
    })
  }

  return blocks
}

export function extractProseBlocks(blocks) {
  return blocks.filter((b) => b.isProse && b.blockType === 'paragraph')
}

export function extractHeadings(blocks) {
  return blocks.filter((b) => b.blockType === 'heading')
}

export function extractListBlocks(blocks) {
  return blocks.filter((b) => b.blockType === 'bullet_list' || b.blockType === 'numbered_list')
}

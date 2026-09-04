/**
 * Word-level and Paragraph-level text diffing utility using Longest Common Subsequence (LCS).
 * Produces structured tokens for rendering deletions (strikethrough),
 * additions (green highlights), and unchanged prose with clear line & word level visual indicators.
 */

export function computeWordDiff(oldStr = '', newStr = '') {
  if (!oldStr && !newStr) return []
  if (!oldStr) return [{ type: 'added', value: newStr }]
  if (!newStr) return [{ type: 'removed', value: oldStr }]

  // Tokenize by words, punctuation, and whitespace to preserve exact formatting
  const tokenize = (str) => {
    return str.match(/\s+|[^\s\w]+|[\w]+/g) || []
  }

  const oldTokens = tokenize(oldStr)
  const newTokens = tokenize(newStr)

  const n = oldTokens.length
  const m = newTokens.length

  // Build LCS matrix (Uint16Array for speed and low memory)
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (oldTokens[i].toLowerCase() === newTokens[j].toLowerCase()) {
        dp[i + 1][j + 1] = dp[i][j] + 1
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }

  // Backtrack to build diff
  let i = n
  let j = m
  const result = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1].toLowerCase() === newTokens[j - 1].toLowerCase()) {
      result.unshift({ type: 'unchanged', value: newTokens[j - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: newTokens[j - 1] })
      j--
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: 'removed', value: oldTokens[i - 1] })
      i--
    }
  }

  // Group adjacent diffs of the same type for smooth rendering
  const merged = []
  for (const chunk of result) {
    const last = merged[merged.length - 1]
    if (last && last.type === chunk.type) {
      last.value += chunk.value
    } else {
      merged.push({ ...chunk })
    }
  }

  return merged
}

/**
 * Paragraph-level diffing for clear, structured line-by-line editorial comparisons
 */
export function computeParagraphDiff(oldText = '', newText = '') {
  const oldParas = oldText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const newParas = newText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  const diffBlocks = []
  const maxLen = Math.max(oldParas.length, newParas.length)

  for (let idx = 0; idx < maxLen; idx++) {
    const oldP = oldParas[idx] || ''
    const newP = newParas[idx] || ''

    if (oldP && !newP) {
      diffBlocks.push({
        id: idx,
        status: 'removed',
        words: computeWordDiff(oldP, ''),
        oldText: oldP,
        newText: '',
      })
    } else if (!oldP && newP) {
      diffBlocks.push({
        id: idx,
        status: 'added',
        words: computeWordDiff('', newP),
        oldText: '',
        newText: newP,
      })
    } else if (oldP === newP) {
      diffBlocks.push({
        id: idx,
        status: 'unchanged',
        words: [{ type: 'unchanged', value: newP }],
        oldText: oldP,
        newText: newP,
      })
    } else {
      const words = computeWordDiff(oldP, newP)
      diffBlocks.push({
        id: idx,
        status: 'modified',
        words,
        oldText: oldP,
        newText: newP,
      })
    }
  }

  return diffBlocks
}

/**
 * Compute key editorial change metrics between original and polished content
 */
export function computePolishMetrics(oldText = '', newText = '') {
  const oldEmDashes = (oldText.match(/[—–]|--/g) || []).length
  const newEmDashes = (newText.match(/[—–]|--/g) || []).length
  const emDashesRemoved = Math.max(0, oldEmDashes - newEmDashes)

  const aiClichésRegex =
    /\b(in today's (fast-paced )?digital world|game-changer|delve( deep(ly)?)? into|a testament to|tapestry of|needless to say|revolutionary|supercharge|it goes without saying|at the end of the day)\b/gi
  const oldCliches = (oldText.match(aiClichésRegex) || []).length
  const newCliches = (newText.match(aiClichésRegex) || []).length
  const clichesRemoved = Math.max(0, oldCliches - newCliches)

  const oldWords = oldText.split(/\s+/).filter(Boolean).length
  const newWords = newText.split(/\s+/).filter(Boolean).length

  return {
    emDashesRemoved,
    clichesRemoved,
    wordCountBefore: oldWords,
    wordCountAfter: newWords,
    wordReduction: Math.max(0, oldWords - newWords),
  }
}

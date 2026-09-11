/**
 * Similarity and Duplicate Detection Utilities
 * Uses token-level Jaccard overlap and semantic matching to detect duplicate hooks,
 * overlapping search intent, and SEO keyword cannibalization risks.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
  'that', 'this', 'it', 'its', 'you', 'your', 'we', 'our', 'what',
  'how', 'why', 'when', 'where', 'which', 'who', 'does', 'do',
])

/**
 * Tokenizes text into lowercase non-stopword tokens.
 */
export function tokenize(text = '') {
  if (typeof text !== 'string') return []
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token))
}

/**
 * Computes Jaccard similarity coefficient between two strings (0.0 to 1.0).
 */
export function jaccardSimilarity(textA = '', textB = '') {
  const tokensA = new Set(tokenize(textA))
  const tokensB = new Set(tokenize(textB))

  if (tokensA.size === 0 && tokensB.size === 0) return 1.0
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0

  let intersectionCount = 0
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionCount++
    }
  }

  const unionCount = tokensA.size + tokensB.size - intersectionCount
  return unionCount === 0 ? 0 : intersectionCount / unionCount
}

/**
 * Checks whether two hooks have high semantic/lexical overlap.
 */
export function areHooksDuplicate(hookA = '', hookB = '', threshold = 0.6) {
  return jaccardSimilarity(hookA, hookB) >= threshold
}

/**
 * Checks whether two titles have excessive overlap.
 */
export function areTitlesDuplicate(titleA = '', titleB = '', threshold = 0.7) {
  return jaccardSimilarity(titleA, titleB) >= threshold
}

/**
 * Calculates SEO Cannibalization Risk between two topics.
 * Returns risk level and explanation.
 */
export function calculateCannibalizationRisk(topicA, topicB) {
  if (!topicA || !topicB) return { score: 0, risk: 'low', reason: 'No overlap detected' }

  const kwSim = jaccardSimilarity(topicA.targetKeyword || '', topicB.targetKeyword || '')
  const titleSim = jaccardSimilarity(topicA.title || '', topicB.title || '')
  const sameIntent = (topicA.searchIntent || '').toLowerCase() === (topicB.searchIntent || '').toLowerCase()
  const sameCluster = (topicA.clusterName || '').toLowerCase() === (topicB.clusterName || '').toLowerCase()

  // Weighted cannibalization score
  let score = kwSim * 0.45 + titleSim * 0.35 + (sameIntent ? 0.15 : 0) + (sameCluster ? 0.05 : 0)

  let risk = 'low'
  let reason = 'Distinct search intents and target keywords'

  if (score >= 0.7 || kwSim >= 0.85) {
    risk = 'high'
    reason = `Severe SERP overlap on target keyword "${topicA.targetKeyword}" with identical intent.`
  } else if (score >= 0.45 || kwSim >= 0.6) {
    risk = 'medium'
    reason = `Potential intent overlap; differentiate angle or secondary keyword targeting.`
  }

  return { score: Math.round(score * 100) / 100, risk, reason }
}

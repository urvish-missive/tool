import { applyEntityCasing } from '../constants/entityCasing.js'

/**
 * Normalizes user form inputs before any topic generation occurs.
 * Cleans formatting, resolves entity casing, and removes circular redundancy.
 */
export function normalizeInput({
  niche = '',
  targetKeywords = [],
  audience = '',
  contentGoal = 'educational',
  tone = 'authoritative',
  count = 8,
  contentType = 'blog post',
}) {
  const rawSubject = String(niche || '').trim()

  // Clean parsed keywords
  let parsedKeywords = []
  if (Array.isArray(targetKeywords)) {
    parsedKeywords = targetKeywords
      .map(k => (typeof k === 'string' ? k.trim() : ''))
      .filter(Boolean)
  } else if (typeof targetKeywords === 'string') {
    parsedKeywords = targetKeywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
  }

  // Deduce primary keyword
  let primaryKeyword = parsedKeywords[0] || rawSubject || 'Guide'
  primaryKeyword = applyEntityCasing(primaryKeyword)

  // Secondary keywords without repeating primary keyword
  const secondaryKeywords = parsedKeywords
    .slice(1)
    .map(k => applyEntityCasing(k))
    .filter(k => k.toLowerCase() !== primaryKeyword.toLowerCase())

  // Apply entity casing to subject
  const normalizedSubject = applyEntityCasing(rawSubject)

  // Clean audience
  let normalizedAudience = String(audience || '').trim()
  if (normalizedAudience) {
    normalizedAudience = applyEntityCasing(normalizedAudience)
  }

  // Sanitize numeric count
  const numberOfTopics = Math.min(Math.max(parseInt(count, 10) || 8, 1), 20)

  return {
    subject: rawSubject,
    normalizedSubject,
    primaryKeyword,
    secondaryKeywords,
    audience: audience ? audience.trim() : '',
    normalizedAudience,
    contentGoal: String(contentGoal || 'educational').trim().toLowerCase(),
    tone: String(tone || 'authoritative').trim().toLowerCase(),
    numberOfTopics,
    contentType: String(contentType || 'blog post').trim(),
  }
}

/**
 * Eliminates redundant phrasing where the keyword is awkwardly appended
 * to a niche phrase (e.g. "iphone 18 in iphone 18 series" -> "iPhone 18").
 */
export function removeCircularRepetition(title, keyword, subject) {
  if (!title || typeof title !== 'string') return title

  let cleaned = title
  const kwLower = keyword.toLowerCase()
  const subjLower = subject.toLowerCase()

  // If keyword is a substring of subject (e.g. "iphone 18" in "iphone 18 series")
  if (subjLower.includes(kwLower) && subjLower !== kwLower) {
    // Replace patterns like "for [keyword] [niche]" or "in [niche]" when it duplicates keyword
    const redundantPattern1 = new RegExp(`\\s+(?:in|for|of)\\s+${escapeRegex(subject)}`, 'gi')
    if (cleaned.toLowerCase().includes(kwLower)) {
      cleaned = cleaned.replace(redundantPattern1, '')
    }
  }

  // Clean extra spaces, dangling colons/hyphens
  cleaned = cleaned
    .replace(/\s*:\s*$/, '')
    .replace(/\s*-\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return applyEntityCasing(cleaned)
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

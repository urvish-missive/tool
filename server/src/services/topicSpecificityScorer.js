/**
 * Topic Specificity Scorer
 *
 * Detects generic title templates and scores topics for specificity.
 * A topic whose only meaningful concept is the raw subject should receive
 * a low specificity score.
 */

/**
 * Generic title patterns that could apply to almost any subject.
 * These are NOT banned — but they receive a specificity penalty.
 */
const GENERIC_PATTERNS = [
  /\bX\b.*(?:Practical Overview|Complete Guide|Comprehensive Guide|Deep Dive)\b/i,
  /(?:Understanding|A Guide to|Introduction to|Overview of)\s+X\b/i,
  /\bX\b.*(?:Mistakes|Common Errors|Pitfalls)\b/i,
  /(?:Questions About|FAQ:?)\s+X\b/i,
  /\bX\b.*(?:Compared|Alternatives|Options)\b/i,
  /(?:Best|Top)\s+(?:Tools|Resources|Tips)\s+(?:for|and)\s+X\b/i,
  /\bX\b.*(?:What to Look for|Before You Decide|Right for You)\b/i,
  /(?:Getting Started with|How to Use|How to Get Started with)\s+X\b/i,
  /(?:The Essential|Complete)\s+X\b.*(?:Checklist|Guide)\b/i,
  /X\b.*(?:ROI|Business Case|Cost Breakdown)\b/i,
]

/**
 * Scores a topic for specificity based on how much its meaning goes
 * beyond the raw subject phrase.
 */
export function scoreTopicSpecificity(topic, ontology) {
  const title = (topic.title || '').toLowerCase()
  const hook = (topic.hook || '').toLowerCase()
  const centralTheme = (ontology.centralTheme || '').toLowerCase()
  const componentConcepts = (ontology.componentConcepts || []).map(c => c.toLowerCase())

  let specificityScore = 0
  const reasons = []

  // 1. Check for generic pattern match (penalty)
  const replacedTitle = title.replace(new RegExp(centralTheme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'X')
  let isGeneric = false
  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(replacedTitle)) {
      isGeneric = true
      reasons.push('Matches generic title template pattern')
      break
    }
  }
  if (isGeneric) {
    specificityScore -= 30
  }

  // 2. Check if title contains concepts beyond the raw subject
  const titleWords = new Set(title.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3))
  const subjectWords = new Set(centralTheme.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3))

  let uniqueWords = 0
  for (const word of titleWords) {
    if (!subjectWords.has(word) && word.length > 4) uniqueWords++
  }

  if (uniqueWords >= 4) {
    specificityScore += 25
    reasons.push('Contains meaningful concepts beyond the subject')
  } else if (uniqueWords >= 2) {
    specificityScore += 10
    reasons.push('Contains some unique concepts')
  } else {
    specificityScore -= 15
    reasons.push('Title mostly repeats the subject phrase')
  }

  // 3. Check for specific ontology-derived concepts in the title
  let ontologyConceptCount = 0
  for (const concept of componentConcepts) {
    if (title.includes(concept)) ontologyConceptCount++
  }
  if (ontologyConceptCount >= 2) {
    specificityScore += 20
    reasons.push('Multiple ontology concepts referenced')
  } else if (ontologyConceptCount === 1) {
    specificityScore += 5
  }

  // 4. Check hook specificity
  if (hook && hook.length > 50) {
    const hookWords = new Set(hook.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 4))
    let hookUnique = 0
    for (const w of hookWords) {
      if (!subjectWords.has(w) && !titleWords.has(w)) hookUnique++
    }
    if (hookUnique >= 3) {
      specificityScore += 10
      reasons.push('Hook adds genuine unique information')
    }
  }

  // 5. Check for specific search need (not just a generic label)
  if (topic.searchIntent) {
    if (['comparison', 'problem-solving', 'decision'].includes(topic.searchIntent)) {
      specificityScore += 10
      reasons.push('Has specific search intent')
    }
  }

  // 6. Penalize if the title would be equally plausible for a completely different subject
  const genericityTest = testGenericity(title, centralTheme)
  if (genericityTest.isGeneric) {
    specificityScore -= 20
    reasons.push(genericityTest.reason)
  }

  return {
    score: Math.max(0, Math.min(100, 50 + specificityScore)),
    isGeneric,
    reasons,
  }
}

/**
 * Tests whether a title is equally plausible for a different subject.
 * If replacing the subject with a random noun still makes sense,
 * the title is too generic.
 */
function testGenericity(title, subject) {
  if (!subject || !title) return { isGeneric: false, reason: '' }

  const placeholder = 'REPLACED_SUBJECT'
  const titleWithPlaceholder = title.replace(
    new RegExp(subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
    placeholder
  )

  // If the title without the subject still reads as a complete, meaningful phrase
  // that could apply to anything, it's generic
  const withoutSubject = titleWithPlaceholder.replace(new RegExp(placeholder, 'gi'), '').replace(/\s+/g, ' ').trim()

  // Check if remaining text is mostly generic connective words
  const genericConnectors = ['the', 'a', 'an', 'to', 'for', 'of', 'in', 'on', 'and', 'or', 'is', 'are', 'with', 'by', 'from', 'your', 'you', 'what', 'how', 'when', 'why', 'where', 'which', 'that', 'this', 'it', 'its']
  const remainingWords = withoutSubject.split(/\s+/).filter(w => w.length > 2 && !genericConnectors.includes(w))

  if (remainingWords.length <= 2) {
    return {
      isGeneric: true,
      reason: 'Title would be equally plausible with any subject noun',
    }
  }

  return { isGeneric: false, reason: '' }
}

/**
 * Validates that a topic's search intent matches its title and angle.
 * Returns a validation result with repair suggestions if mismatched.
 */
export function validateTopicAlignment(topic) {
  const issues = []
  const title = (topic.title || '').toLowerCase()
  const intent = (topic.searchIntent || '').toLowerCase()
  const angle = (topic.contentAngle || '').toLowerCase()

  // Intent-angle consistency
  if (intent === 'comparison' && !angle.includes('comparison') && !angle.includes('versus') && !title.includes('vs') && !title.includes('versus') && !title.includes('compared')) {
    issues.push({ type: 'intent_angle_mismatch', detail: 'Intent says comparison but angle and title don\'t reflect comparison' })
  }

  if (intent === 'how-to' && !angle.includes('guide') && !angle.includes('step') && !title.includes('how to') && !title.includes('guide') && !title.includes('step')) {
    issues.push({ type: 'intent_title_mismatch', detail: 'Intent says how-to but title doesn\'t reflect a how-to format' })
  }

  if (intent === 'commercial investigation' && !angle.includes('buyer') && !angle.includes('decision') && !title.includes('best') && !title.includes('buy') && !title.includes('choose')) {
    issues.push({ type: 'intent_angle_mismatch', detail: 'Intent says commercial investigation but title doesn\'t reflect buyer guidance' })
  }

  // Title naturalness
  if (title.length < 25) {
    issues.push({ type: 'title_too_short', detail: 'Title is very short and may lack specificity' })
  }
  if (title.length > 75) {
    issues.push({ type: 'title_too_long', detail: 'Title is long — may be truncated in SERPs' })
  }

  return {
    valid: issues.length === 0,
    issues,
    score: Math.max(0, 100 - issues.length * 20),
  }
}

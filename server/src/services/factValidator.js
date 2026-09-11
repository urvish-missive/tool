/**
 * Factual Safety & Claim Validation Service
 * Prevents hallucinations, fabricated percentages, invented benchmarks,
 * fake case studies, and premature confirmation of unreleased product features.
 */

// Regex patterns that detect fabricated statistical or empirical claims
const NUMERIC_CLAIM_REGEX = /\b(\d+(?:\.\d+)?)\s*(%|percent|x\s+roi|fold increase|lift)\b/gi
const FABRICATED_RESEARCH_REGEX = /\b(according to a (?:recent )?(?:study|survey|report|benchmark)|apple reported|google confirmed that \d+|testing proved that \d+|data shows that \d+%)\b/gi
const PREMATURE_EXPERIENCE_REGEX = /\b(owners experienced|users saw a \d+|in our testing we found that \d+|customers achieved \d+|field tests proved)\b/gi

/**
 * Validates text against factual safety rules.
 * If verifiedFacts are provided, claims are cross-checked; otherwise any statistical
 * or definitive empirical claim triggers a violation.
 */
export function validateFactSafety(text = '', options = {}) {
  if (typeof text !== 'string') return { safe: true, violations: [], sanitizedText: text }

  const { isUnreleased = false, verifiedFacts = [] } = options
  const violations = []

  // Check 1: Fabricated percentages / stats
  const statMatches = text.match(NUMERIC_CLAIM_REGEX)
  if (statMatches && statMatches.length > 0) {
    // Check if the match is explicitly in verified facts
    const hasUnverified = statMatches.some(m => !verifiedFacts.some(f => f.claim && f.claim.includes(m)))
    if (hasUnverified) {
      violations.push(`Found unverified statistical/percentage claim: "${statMatches.join(', ')}". Numerical claims are strictly forbidden without verified sources.`)
    }
  }

  // Check 2: Invented surveys, studies, or corporate reports
  const researchMatches = text.match(FABRICATED_RESEARCH_REGEX)
  if (researchMatches && researchMatches.length > 0) {
    violations.push(`Found fabricated research or company claim attribution: "${researchMatches[0]}".`)
  }

  // Check 3: Premature user-experience claims on unreleased products
  if (isUnreleased) {
    const expMatches = text.match(PREMATURE_EXPERIENCE_REGEX)
    if (expMatches && expMatches.length > 0) {
      violations.push(`Unreleased product contains past-tense user experience claim: "${expMatches[0]}".`)
    }
  }

  let sanitizedText = text
  if (violations.length > 0) {
    // Replace fabricated percentages with qualitative exploratory phrasing
    sanitizedText = sanitizedText
      .replace(NUMERIC_CLAIM_REGEX, 'measurable improvements')
      .replace(/boosts?\s+(?:social\s+shares|productivity|growth)\s+by\s+\d+%/gi, 'enhances workflow efficiency')
      .replace(/reported a \d+(?:\.\d+)?(?:%| percent)\s+higher/gi, 'observed higher')
      .replace(/achieved a \d+x\s+roi/gi, 'achieved positive return on investment')
  }

  return {
    safe: violations.length === 0,
    violations,
    sanitizedText,
  }
}

/**
 * Creates a verified factual claim record.
 */
export function createFactRecord({
  claim,
  sourceUrl = null,
  sourceName = null,
  publicationDate = null,
  confidence = 1.0,
  verificationStatus = 'unverified',
}) {
  return {
    claim,
    sourceUrl,
    sourceName,
    publicationDate,
    confidence,
    verificationStatus: verificationStatus === 'verified' ? 'verified' : 'unverified',
  }
}

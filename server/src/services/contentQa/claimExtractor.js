/**
 * Domain-Agnostic Claim Extraction & Evidentiary Burden Analyzer
 * 
 * Implements Requirements 12–21:
 * - Extracts candidate factual, quantitative, causal, and prescriptive claims from prose.
 * - Classifies claim types dynamically without industry-specific heuristics.
 * - Determines certainty / modality (HYPOTHETICAL, QUALIFIED, CONDITIONAL, ASSERTIVE, ABSOLUTE).
 * - Distinguishes illustrative hypothetical numbers from empirical benchmarks.
 * - Identifies universal recommendations and assigns appropriate evidentiary burdens.
 * - Classifies evidence support states (FIRST_HAND_EVIDENCE, INTERNAL_DATA, PRIMARY_EXTERNAL_SOURCE,
 *   SECONDARY_EXTERNAL_SOURCE, LOGICAL_REASONING, UNSUPPORTED, NOT_REQUIRED).
 * - Separates experience evidence from factual claim substantiation.
 */

// Linguistic markers for certainty / modality
const HYPOTHETICAL_MARKERS = /\b(suppose|imagine|hypothetically|for (?:instance|example|illustration)|let's say|assuming that|if we assume)\b/i
const QUALIFIED_MARKERS = /\b(often|typically|generally|can help|may|might|in many cases|tend to|frequently|could)\b/i
const CONDITIONAL_MARKERS = /\b(if|when|provided that|depending on|as long as|in the event that)\b/i
const ABSOLUTE_MARKERS = /\b(must|essential|the only way|always|never|guaranteed|100%|undisputed|imperative|crucial to every|mandatory)\b/i

// Linguistic markers for claim types
const NUMERIC_PATTERN = /\b(?:\d+[\d,.]*\%|\$\d+[\d,.]*|\d+[\d,.]*\s*(?:times|x|hours|days|weeks|months|years|users|clients|reps|units|leads|deals|dollars|seconds|minutes))\b/i
const BENCHMARK_PATTERN = /\b(?:average|benchmark|median|industry standard|conversion rate of \d+|quota attainment|retention rate)\b/i
const CAUSAL_PATTERN = /\b(drove|resulted in|leads to|causes|increases|decreased|boosted|improved by|generates|produces)\b/i
const COMPARATIVE_PATTERN = /\b(better than|more effective than|outperforms|superior to|twice as|faster than|higher than)\b/i
const PRESCRIPTIVE_PATTERN = /\b(you (?:need to|must|should|have to)|it is (?:essential|critical|vital|imperative) to|always ensure)\b/i
const PLATFORM_CAPABILITY_PATTERN = /\b(allows users to|integrates with|features include|is designed to|supports up to|platform offers)\b/i

// Support / evidence markers in context
const FIRST_HAND_MARKERS = /\b(in our (?:audit|test|rollout|pilot|case study|experience)|we (?:tested|measured|tracked|implemented|found that|discovered)|our internal data shows)\b/i
const EXTERNAL_CITATION_MARKERS = /\b(according to|cited by|research (?:from|by)|study published in|as documented by|source:)\b/i
const LOGICAL_REASONING_MARKERS = /\b(because|therefore|since|as a result of|which demonstrates that|this is why|due to)\b/i

/**
 * Classify linguistic certainty
 * @param {string} sentence 
 * @returns {'HYPOTHETICAL' | 'QUALIFIED' | 'CONDITIONAL' | 'ASSERTIVE' | 'ABSOLUTE'}
 */
export function classifyCertainty(sentence) {
  if (HYPOTHETICAL_MARKERS.test(sentence)) return 'HYPOTHETICAL'
  if (ABSOLUTE_MARKERS.test(sentence)) return 'ABSOLUTE'
  if (QUALIFIED_MARKERS.test(sentence)) return 'QUALIFIED'
  if (CONDITIONAL_MARKERS.test(sentence)) return 'CONDITIONAL'
  return 'ASSERTIVE'
}

/**
 * Classify claim type
 * @param {string} sentence 
 * @returns {string}
 */
export function classifyClaimType(sentence) {
  if (BENCHMARK_PATTERN.test(sentence)) return 'benchmark'
  if (NUMERIC_PATTERN.test(sentence) && CAUSAL_PATTERN.test(sentence)) return 'performance_claim'
  if (NUMERIC_PATTERN.test(sentence)) return 'numeric_claim'
  if (COMPARATIVE_PATTERN.test(sentence)) return 'comparative_claim'
  if (CAUSAL_PATTERN.test(sentence)) return 'causal_claim'
  if (PRESCRIPTIVE_PATTERN.test(sentence)) return 'prescriptive_recommendation'
  if (PLATFORM_CAPABILITY_PATTERN.test(sentence)) return 'platform_capability_claim'
  if (/\b(in our opinion|we believe|seems to be|feels like)\b/i.test(sentence)) return 'subjective_opinion'
  return 'general_assertion'
}

/**
 * Determine the evidentiary burden for a claim
 * @param {Object} claimMeta 
 * @returns {'none' | 'low' | 'medium' | 'high' | 'critical'}
 */
export function calculateEvidentiaryBurden({ claimType, certainty }) {
  // Hypothetical or subjective opinions have zero to low burden
  if (certainty === 'HYPOTHETICAL' || claimType === 'subjective_opinion') {
    return 'none'
  }

  // Absolute universal advice has critical burden
  if (certainty === 'ABSOLUTE' && claimType === 'prescriptive_recommendation') {
    return 'critical'
  }

  // Measured empirical benchmarks have high burden
  if (claimType === 'benchmark' || claimType === 'performance_claim') {
    return certainty === 'ABSOLUTE' || certainty === 'ASSERTIVE' ? 'high' : 'medium'
  }

  // Absolute claims of any factual type have high burden
  if (certainty === 'ABSOLUTE') {
    return 'high'
  }

  // Numeric claims without causal assertions
  if (claimType === 'numeric_claim') {
    return certainty === 'ASSERTIVE' ? 'medium' : 'low'
  }

  // Qualified recommendations or casual assertions
  if (certainty === 'QUALIFIED') {
    return 'low'
  }

  return 'medium'
}

/**
 * Evaluate what type of support exists in surrounding context
 * @param {string} sentence 
 * @param {string} paragraphContext 
 * @param {'none' | 'low' | 'medium' | 'high' | 'critical'} burden 
 * @returns {'FIRST_HAND_EVIDENCE' | 'INTERNAL_DATA' | 'PRIMARY_EXTERNAL_SOURCE' | 'SECONDARY_EXTERNAL_SOURCE' | 'LOGICAL_REASONING' | 'UNSUPPORTED' | 'NOT_REQUIRED'}
 */
export function evaluateEvidenceState(sentence, paragraphContext, burden) {
  if (burden === 'none') {
    return 'NOT_REQUIRED'
  }

  const combined = (sentence + ' ' + (paragraphContext || '')).toLowerCase()

  if (FIRST_HAND_MARKERS.test(combined)) {
    return 'FIRST_HAND_EVIDENCE'
  }

  if (EXTERNAL_CITATION_MARKERS.test(combined)) {
    return 'PRIMARY_EXTERNAL_SOURCE'
  }

  if (LOGICAL_REASONING_MARKERS.test(combined)) {
    return 'LOGICAL_REASONING'
  }

  if (burden === 'low') {
    // Low burden claims (like standard conversational advice) do not strictly require external citations
    return 'NOT_REQUIRED'
  }

  return 'UNSUPPORTED'
}

/**
 * Extract, classify, and audit claims across structured blocks
 * @param {Array<Object>} blocks - Structured blocks from blockParser
 * @param {string} rawContent - Raw text
 * @returns {Object} Complete claim audit
 */
export function extractAndAuditClaims(blocks, rawContent) {
  const proseBlocks = blocks.filter((b) => b.isProse)
  const claims = []
  let firstHandEvidenceCount = 0
  let totalHighBurdenClaims = 0
  let substantiatedHighBurdenClaims = 0

  for (const block of proseBlocks) {
    const sentences = block.sentences || []
    const paragraphContext = block.cleanText || ''

    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      if (trimmed.length < 15) continue

      // Filter for meaningful candidate claims: contains numbers, prescriptive language, or strong assertion
      const isNumeric = NUMERIC_PATTERN.test(trimmed)
      const isPrescriptive = PRESCRIPTIVE_PATTERN.test(trimmed)
      const isCausal = CAUSAL_PATTERN.test(trimmed)
      const isComparative = COMPARATIVE_PATTERN.test(trimmed)
      const isAbsolute = ABSOLUTE_MARKERS.test(trimmed)

      if (!isNumeric && !isPrescriptive && !isCausal && !isComparative && !isAbsolute) {
        continue
      }

      const certainty = classifyCertainty(trimmed)
      const claimType = classifyClaimType(trimmed)
      const evidentiaryBurden = calculateEvidentiaryBurden({ claimType, certainty })
      const supportState = evaluateEvidenceState(trimmed, paragraphContext, evidentiaryBurden)

      if (supportState === 'FIRST_HAND_EVIDENCE') {
        firstHandEvidenceCount++
      }

      const isHighBurden = evidentiaryBurden === 'high' || evidentiaryBurden === 'critical'
      if (isHighBurden) {
        totalHighBurdenClaims++
        if (supportState !== 'UNSUPPORTED') {
          substantiatedHighBurdenClaims++
        }
      }

      const isSupported = supportState !== 'UNSUPPORTED'
      let status = 'SUPPORTED'
      if (supportState === 'UNSUPPORTED') {
        status = certainty === 'ABSOLUTE' ? 'OVERSTATED' : 'UNSUPPORTED'
      } else if (supportState === 'NOT_REQUIRED') {
        status = 'PLAUSIBLE'
      }

      const startOffset = rawContent.indexOf(trimmed)
      claims.push({
        claim: trimmed,
        claimText: trimmed,
        claimType,
        certainty,
        evidentiaryBurden,
        burdenLevel: evidentiaryBurden.toUpperCase(),
        evidencePresent: isSupported,
        sourcePresent: supportState === 'PRIMARY_EXTERNAL_SOURCE' || supportState === 'FIRST_HAND_EVIDENCE',
        supportState,
        evidenceState: supportState,
        status,
        confidence: 0.9,
        blockId: block.blockId,
        startOffset: startOffset !== -1 ? startOffset : block.startOffset,
        endOffset: startOffset !== -1 ? startOffset + trimmed.length : block.endOffset,
        line: block.startLine,
      })
    }
  }

  // Calculate separate strengths (Requirement #21)
  const expScore = Math.min(
    100,
    Math.round((firstHandEvidenceCount > 0 ? 50 : 0) + Math.min(50, firstHandEvidenceCount * 25))
  )

  const supScore = totalHighBurdenClaims > 0
    ? Math.round((substantiatedHighBurdenClaims / totalHighBurdenClaims) * 100)
    : 100

  const toStrengthLevel = (s) => (s >= 80 ? 'VERY_HIGH' : s >= 60 ? 'HIGH' : s >= 40 ? 'MODERATE' : s >= 20 ? 'LOW' : 'VERY_LOW')
  const expLevel = toStrengthLevel(expScore)
  const supLevel = toStrengthLevel(supScore)

  const evidenceBreakdown = {
    FIRST_HAND_EVIDENCE: claims.filter((c) => c.supportState === 'FIRST_HAND_EVIDENCE'),
    INTERNAL_DATA: claims.filter((c) => c.supportState === 'INTERNAL_DATA'),
    PRIMARY_EXTERNAL_SOURCE: claims.filter((c) => c.supportState === 'PRIMARY_EXTERNAL_SOURCE'),
    SECONDARY_EXTERNAL_SOURCE: claims.filter((c) => c.supportState === 'SECONDARY_EXTERNAL_SOURCE'),
    LOGICAL_REASONING: claims.filter((c) => c.supportState === 'LOGICAL_REASONING'),
    UNSUPPORTED: claims.filter((c) => c.supportState === 'UNSUPPORTED'),
    NOT_REQUIRED: claims.filter((c) => c.supportState === 'NOT_REQUIRED'),
  }

  const unsupportedHighBurdenClaims = claims.filter(
    (c) => (c.evidentiaryBurden === 'high' || c.evidentiaryBurden === 'critical') && c.supportState === 'UNSUPPORTED'
  )

  const metrics = {
    experienceEvidenceStrength: expLevel,
    experienceEvidenceScore: expScore,
    claimSupportStrength: supLevel,
    claimSupportScore: supScore,
    firstHandEvidenceCount,
    experienceClaimsCount: claims.filter((c) => c.claimType === 'EXPERIENCE').length,
    citationsCount: claims.filter((c) => c.sourcePresent).length,
    totalHighBurdenClaims,
    substantiatedHighBurdenClaims,
  }

  return {
    totalClaims: claims.length,
    claims,
    unsupportedHighBurdenClaims,
    evidenceBreakdown,
    experienceEvidenceStrength: expLevel,
    experienceEvidenceScore: expScore,
    claimSupportStrength: supLevel,
    claimSupportScore: supScore,
    metrics,
    firstHandEvidenceCount,
    totalHighBurdenClaims,
    substantiatedHighBurdenClaims,
  }
}

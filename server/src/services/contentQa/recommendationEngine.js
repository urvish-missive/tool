/**
 * Prioritized Recommendation Engine & Canonical Summary Synthesizer
 * 
 * Implements:
 * 1. Severity, risk, and impact-based fix prioritization.
 * 2. Strict deduplication of suggestions (1 consolidated recommendation per rule).
 * 3. Canonical executive summary derived strictly from findings.
 * 4. QA Certification Gate returning exact blockingFindingIds and blockingReasons.
 */

const SEVERITY_BASE = {
  critical: 1000,
  high: 500,
  medium: 100,
  low: 20,
  info: 5,
}

/**
 * Rank and prioritize fixes from Canonical Findings Store
 * @param {CanonicalFindingsStore} findingsStore 
 * @param {number} limit 
 * @returns {Array<Object>} Prioritized action items
 */
export function generatePrioritizedFixes(findingsStore, limit = 5) {
  const failingFindings = findingsStore.getFailingFindings()
  const warningFindings = findingsStore.getWarningFindings()
  const candidates = [...failingFindings, ...warningFindings]

  // Rank candidate findings by impact: severity, domain risk, weight, confidence
  candidates.sort((a, b) => {
    const sevA = SEVERITY_BASE[a.severity] || 50
    const sevB = SEVERITY_BASE[b.severity] || 50

    // Risk boost for compliance or factual/evidence issues
    const riskA = (a.pillarId === 'risk_compliance' || a.pillarId === 'eeat_credibility') ? 250 : 0
    const riskB = (b.pillarId === 'risk_compliance' || b.pillarId === 'eeat_credibility') ? 250 : 0

    const scoreA = (sevA + riskA) * (a.weight || 1.0) * (a.confidence || 1.0)
    const scoreB = (sevB + riskB) * (b.weight || 1.0) * (b.confidence || 1.0)

    if (scoreB !== scoreA) return scoreB - scoreA

    // Tie-breaker: evidence count
    return (b.evidence?.length || 0) - (a.evidence?.length || 0)
  })

  const prioritizedFixes = []
  const seenRules = new Set()

  for (const f of candidates) {
    if (seenRules.has(f.ruleId)) continue
    seenRules.add(f.ruleId)

    const actionText = f.recommendation || f.suggestedAction || f.message || f.explanation
    if (!actionText) continue

    prioritizedFixes.push({
      findingId: f.id,
      ruleId: f.ruleId,
      pillarId: f.pillarId,
      severity: f.severity,
      status: f.status,
      action: actionText,
      explanation: f.explanation || f.message,
      evidenceSnippet: f.evidence?.[0]?.text || null,
      context: f.evidence?.[0]?.context || null,
      evidenceCount: f.evidence?.length || 0,
      confidence: f.confidence,
    })

    if (prioritizedFixes.length >= limit) break
  }

  return prioritizedFixes
}

/**
 * Generate Executive Assessment strictly derived from Canonical Findings Store
 * @param {CanonicalFindingsStore} findingsStore 
 * @param {Object} scoringResults 
 * @param {Object} docMeta 
 * @returns {Object} Executive summary and status counts
 */
export function synthesizeExecutiveSummary(findingsStore, scoringResults, docMeta = {}) {
  const { overallScore, overallQualityScore, overallAssessmentCoverage, statusCounts } = scoringResults
  const counts = statusCounts || findingsStore.getCounts()

  const effectiveScore = overallQualityScore !== null && overallQualityScore !== undefined
    ? overallQualityScore
    : overallScore

  const readiness =
    effectiveScore >= 85 && counts.fail === 0
      ? 'Ready to Publish'
      : effectiveScore >= 70 && counts.fail === 0
      ? 'Minor Polish Needed'
      : effectiveScore >= 50
      ? 'Needs Revision'
      : 'Major QA Overhaul Required'

  // Build natural summary text referencing canonical counts only
  let summary = ''
  if (effectiveScore >= 85 && counts.fail === 0) {
    summary = `Content demonstrates high editorial quality with an assessed quality score of ${effectiveScore}/100 across ${scoringResults.totalRules || 35} evaluated QA rules (${overallAssessmentCoverage || 100}% coverage). All high-priority standards are satisfied with zero critical blockers.`
  } else if (effectiveScore >= 70 && counts.fail === 0) {
    summary = `Content achieves a solid quality foundation (${effectiveScore}/100) with ${counts.pass} passing checks and ${counts.warning} editorial warning(s). Resolving the flagged items will bring it to publish-ready excellence.`
  } else if (counts.fail > 0) {
    summary = `Content scored ${effectiveScore}/100 with ${counts.fail} failed rule(s) and ${counts.warning} warning(s). High-priority attention is required on flagged pillars before distribution.`
  } else {
    summary = `Content quality scored ${effectiveScore}/100 with ${counts.warning || counts.needsAction || 0} item(s) requiring attention across tone, structure, and readability.`
  }

  return {
    executiveSummary: summary,
    publicationReadiness: readiness,
    passedChecksCount: counts.pass,
    needsActionCount: (counts.warning || 0) + (counts.fail || 0),
    failingChecksCount: counts.fail,
    warningChecksCount: counts.warning,
    manualReviewCount: counts.manual,
    unverifiableCount: counts.unverifiable,
    notApplicableCount: counts.notApplicable,
    overallQualityScore: effectiveScore,
    overallAssessmentCoverage: overallAssessmentCoverage || 0,
  }
}

/**
 * Evaluate QA Certification Decision (Requirement #20 & #46)
 * "QA Verified" may ONLY be awarded when:
 * - No unresolved hard failures (FAIL with critical/high severity, or compliance/factual fails)
 * - No internal contradictions
 * - Required score threshold met (>= 80)
 * 
 * Returns explicit blockingFindingIds and blockingReasons.
 */
export function evaluateCertification(findingsStore, scoringResults, consistencyResult = { isValid: true }) {
  const { overallScore, overallQualityScore } = scoringResults
  const effectiveScore = overallQualityScore !== null && overallQualityScore !== undefined
    ? overallQualityScore
    : overallScore

  const allFindings = findingsStore.getAllFindings()

  // Identify all hard blocking findings
  const blockingFindings = allFindings.filter((f) => {
    if (f.status !== 'FAIL') return false
    if (f.severity === 'critical' || f.severity === 'high') return true
    if (f.pillarId === 'risk_compliance' || f.pillarId === 'eeat_credibility') return true
    return false
  })

  const hasHardFails = blockingFindings.length > 0
  const hasContradictions = consistencyResult && !consistencyResult.isValid
  const scoreBelowThreshold = effectiveScore < 80

  const isCertified = !hasHardFails && !hasContradictions && !scoreBelowThreshold

  const blockingFindingIds = blockingFindings.map((f) => f.id)
  const blockingReasons = []

  for (const f of blockingFindings) {
    blockingReasons.push({
      findingId: f.id,
      ruleId: f.ruleId,
      pillarId: f.pillarId,
      severity: f.severity,
      issue: f.explanation || f.message || `Failed check for ${f.ruleId}`,
      action: f.recommendation || f.suggestedAction || 'Resolve this failing check before certification.',
    })
  }

  if (scoreBelowThreshold) {
    blockingReasons.push({
      ruleId: 'overall_score',
      issue: `Overall QA score (${effectiveScore}/100) is below the 80% certification threshold.`,
      action: 'Improve flagged content sections to bring the aggregate quality score above 80%.',
    })
  }

  if (hasContradictions) {
    blockingReasons.push({
      ruleId: 'consistency_check',
      issue: 'Internal score and finding consistency check detected contradictions.',
      action: 'Ensure all warnings and failures are reconciled with pillar scores.',
    })
  }

  return {
    isCertified,
    certified: isCertified, // Backward compatibility
    statusBadge: isCertified ? 'QA Certified' : 'Action Required',
    blockingFindingIds,
    blockingReasons,
    certificationThreshold: 80,
  }
}

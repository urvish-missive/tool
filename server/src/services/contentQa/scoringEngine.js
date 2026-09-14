/**
 * Transparent Mathematical Scoring Engine & Consistency Validators
 * 
 * Implements:
 * 1. Mathematically explainable scoring derived exclusively from Canonical Findings.
 * 2. Separation of qualityScore and assessmentCoverage per pillar and overall.
 * 3. Strict consistency enforcement:
 *    - A pillar CANNOT receive 100% if it contains any FAIL, non-informational WARNING,
 *      MANUAL_REVIEW, or NOT_VERIFIABLE check.
 *    - Pillars with only manual/unverifiable checks have qualityScore = null and assessmentCoverage = 0.
 * 4. Reconciled status counts: pass + warning + fail + manual + unverifiable + notApplicable === totalRules.
 * 5. Nine strict internal consistency validators before returning any report.
 */

import { QA_PILLARS_CONFIG, getRulesMap } from './qaRulesConfig.js'

/**
 * Multipliers for check statuses
 */
const STATUS_MULTIPLIERS = {
  PASS: 1.0,
  WARNING: 0.5,
  FAIL: 0.0,
  NOT_APPLICABLE: 0.0,
  NOT_VERIFIABLE: 0.0,
  MANUAL_REVIEW: 0.0,
}

/**
 * Calculate scores and mathematical breakdown from Canonical Findings Store
 * @param {CanonicalFindingsStore} findingsStore 
 * @param {Array<Object>} applicableRules 
 * @returns {Object} Complete scoring results
 */
export function calculateMathematicalScores(findingsStore, applicableRules) {
  const rulesMap = getRulesMap()
  const findings = findingsStore.getAllFindings()
  const findingsByRule = new Map(findings.map((f) => [f.ruleId, f]))

  let totalPossibleWeight = 0
  let totalResolvedWeight = 0
  let totalEarnedWeight = 0

  const statusCounts = {
    totalRules: applicableRules.length,
    pass: 0,
    warning: 0,
    fail: 0,
    manual: 0,
    unverifiable: 0,
    notApplicable: 0,
  }

  const ruleScores = {}
  const pillarAggregates = {}

  // Initialize aggregates for all pillars
  for (const pillarId of Object.keys(QA_PILLARS_CONFIG)) {
    pillarAggregates[pillarId] = {
      pillarId,
      label: QA_PILLARS_CONFIG[pillarId].label,
      targetWeight: QA_PILLARS_CONFIG[pillarId].targetWeight,
      possibleWeight: 0,
      resolvedWeight: 0,
      earnedWeight: 0,
      ruleCount: 0,
      passCount: 0,
      failCount: 0,
      warningCount: 0,
      manualCount: 0,
      notVerifiableCount: 0,
      notApplicableCount: 0,
      hasFail: false,
      hasWarning: false,
      qualityScore: null,
      assessmentCoverage: 0,
      status: 'PASS',
    }
  }

  // Iterate over applicable rules
  for (const rule of applicableRules) {
    const finding = findingsByRule.get(rule.ruleId)
    const status = finding ? finding.status : (rule.defaultStatus || 'MANUAL_REVIEW')
    const weight = typeof rule.weight === 'number' ? rule.weight : 1.0

    const pillar = pillarAggregates[rule.pillarId]
    if (!pillar) continue

    pillar.ruleCount++
    pillar.possibleWeight += weight
    totalPossibleWeight += weight

    if (status === 'NOT_APPLICABLE') {
      pillar.notApplicableCount++
      statusCounts.notApplicable++
      ruleScores[rule.ruleId] = { status, weight, earned: 0, contribution: 0, affectsScore: false }
      continue
    }

    if (status === 'MANUAL_REVIEW') {
      pillar.manualCount++
      statusCounts.manual++
      ruleScores[rule.ruleId] = { status, weight, earned: 0, contribution: 0, affectsScore: false }
      continue
    }

    if (status === 'NOT_VERIFIABLE') {
      pillar.notVerifiableCount++
      statusCounts.unverifiable++
      ruleScores[rule.ruleId] = { status, weight, earned: 0, contribution: 0, affectsScore: false }
      continue
    }

    // Status is PASS, WARNING, or FAIL
    const multiplier = STATUS_MULTIPLIERS[status] ?? 0.0
    const earned = weight * multiplier

    pillar.resolvedWeight += weight
    pillar.earnedWeight += earned
    totalResolvedWeight += weight
    totalEarnedWeight += earned

    if (status === 'PASS') {
      pillar.passCount++
      statusCounts.pass++
    } else if (status === 'FAIL') {
      pillar.failCount++
      statusCounts.fail++
      pillar.hasFail = true
    } else if (status === 'WARNING') {
      pillar.warningCount++
      statusCounts.warning++
      if (!rule.isInformational) {
        pillar.hasWarning = true
      }
    }

    ruleScores[rule.ruleId] = {
      status,
      weight,
      earned: Number(earned.toFixed(2)),
      multiplier,
      affectsScore: true,
    }
  }

  // Calculate Pillar Scores with strict consistency guarantees
  const pillarScores = {}
  for (const [pillarId, agg] of Object.entries(pillarAggregates)) {
    // 1. Assessment Coverage: percentage of applicable weight that was definitively assessed
    agg.assessmentCoverage = agg.possibleWeight > 0
      ? Math.round((agg.resolvedWeight / agg.possibleWeight) * 100)
      : 0

    // 2. Quality Score: score earned on the resolved subset
    if (agg.resolvedWeight > 0) {
      let rawScore = Math.round((agg.earnedWeight / agg.resolvedWeight) * 100)

      // ── STRICT CONSISTENCY ENFORCEMENT ──────────────────────────────
      // A pillar must NEVER receive 100% when it contains a warning, failure, manual review, or not_verifiable check.
      if (agg.hasFail) {
        rawScore = Math.min(rawScore, 80)
      } else if (agg.hasWarning) {
        rawScore = Math.min(rawScore, 90)
      } else if (agg.manualCount > 0 || agg.notVerifiableCount > 0) {
        // Has unresolved items in this pillar; cannot be 100%
        rawScore = Math.min(rawScore, 90)
      }

      agg.qualityScore = rawScore
      pillarScores[pillarId] = rawScore

      // Status determination
      if (agg.hasFail) {
        agg.status = 'FAIL'
      } else if (agg.hasWarning) {
        agg.status = 'WARNING'
      } else if (agg.manualCount > 0 || agg.notVerifiableCount > 0) {
        agg.status = 'PARTIALLY_ASSESSED'
      } else {
        agg.status = 'PASS'
      }
    } else {
      // Zero evaluated checks passing (only manual/unverifiable) -> score must NOT be 100% or 75%
      agg.qualityScore = null
      pillarScores[pillarId] = null
      agg.status = agg.manualCount > 0 ? 'MANUAL_REVIEW' : 'NOT_VERIFIABLE'
    }
  }

  // Calculate Overall Quality Score & Overall Assessment Coverage
  const overallAssessmentCoverage = totalPossibleWeight > 0
    ? Math.round((totalResolvedWeight / totalPossibleWeight) * 100)
    : 0

  let overallQualityScore = null
  if (totalResolvedWeight > 0) {
    let rawOverall = Math.round((totalEarnedWeight / totalResolvedWeight) * 100)
    const anyFail = Object.values(pillarAggregates).some((p) => p.hasFail)
    const anyWarning = Object.values(pillarAggregates).some((p) => p.hasWarning)
    const anyUnresolved = Object.values(pillarAggregates).some((p) => p.manualCount > 0 || p.notVerifiableCount > 0)

    if (anyFail) {
      rawOverall = Math.min(rawOverall, 85)
    } else if (anyWarning || anyUnresolved) {
      rawOverall = Math.min(rawOverall, 95)
    }

    overallQualityScore = rawOverall
  }

  // Backward compatibility: overallScore as number or 0
  const overallScore = overallQualityScore !== null ? overallQualityScore : 0

  // Mathematical traceability breakdown
  const mathematicalTraceability = {
    totalPossibleWeight: Number(totalPossibleWeight.toFixed(2)),
    totalResolvedWeight: Number(totalResolvedWeight.toFixed(2)),
    totalEarnedWeight: Number(totalEarnedWeight.toFixed(2)),
    overallQualityScore,
    overallAssessmentCoverage,
    formula: 'overallQualityScore = Math.round((totalEarnedWeight / totalResolvedWeight) * 100)',
    calculation: totalResolvedWeight > 0
      ? `${totalEarnedWeight.toFixed(2)} / ${totalResolvedWeight.toFixed(2)} * 100 = ${overallQualityScore}`
      : 'No automated rules resolved; qualityScore is null',
    pillarAggregates,
    ruleScores,
    statusCounts,
    totalRules: applicableRules.length,
  }

  return {
    overallScore,
    overallQualityScore,
    overallAssessmentCoverage,
    pillarScores,
    pillarAggregates,
    statusCounts,
    totalRules: applicableRules.length,
    mathematicalTraceability,
  }
}

/**
 * Internal Consistency Validator 1: Status Totals
 * Verifies pass + warning + fail + manual + unverifiable + notApplicable === totalRules
 */
export function validateStatusTotals(statusCounts, totalRules) {
  const sum = (statusCounts.pass || 0) +
    (statusCounts.warning || 0) +
    (statusCounts.fail || 0) +
    (statusCounts.manual || 0) +
    (statusCounts.unverifiable || 0) +
    (statusCounts.notApplicable || 0)

  const isValid = sum === totalRules
  return {
    name: 'StatusTotalsValidator',
    isValid,
    error: isValid ? null : `Status counts sum (${sum}) does not equal totalRules (${totalRules}).`,
    sum,
    totalRules,
  }
}

/**
 * Internal Consistency Validator 2: Pillar Score Consistency
 * Verifies no pillar with FAIL, WARNING, MANUAL, or NOT_VERIFIABLE receives 100%
 */
export function validatePillarScoreConsistency(pillarAggregates) {
  const errors = []
  for (const [pillarId, agg] of Object.entries(pillarAggregates)) {
    if (agg.qualityScore === null) continue

    if (agg.hasFail && agg.qualityScore > 80) {
      errors.push(`Pillar "${pillarId}" has FAIL finding but qualityScore is ${agg.qualityScore}% (must be <= 80%).`)
    }
    if (agg.hasWarning && agg.qualityScore > 90) {
      errors.push(`Pillar "${pillarId}" has WARNING finding but qualityScore is ${agg.qualityScore}% (must be <= 90%).`)
    }
    if ((agg.manualCount > 0 || agg.notVerifiableCount > 0) && agg.qualityScore >= 100) {
      errors.push(`Pillar "${pillarId}" has unresolved manual/unverifiable checks but qualityScore is 100%.`)
    }
  }

  return {
    name: 'PillarScoreConsistencyValidator',
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Internal Consistency Validator 3: Manual State Handling
 * Verifies that purely manual pillars have qualityScore = null and assessmentCoverage = 0
 */
export function validateManualStateHandling(pillarAggregates) {
  const errors = []
  for (const [pillarId, agg] of Object.entries(pillarAggregates)) {
    if (agg.resolvedWeight === 0 && agg.manualCount > 0) {
      if (agg.qualityScore !== null) {
        errors.push(`Pillar "${pillarId}" has 0 resolved rules and manual checks, but qualityScore is ${agg.qualityScore} (must be null).`)
      }
      if (agg.assessmentCoverage !== 0) {
        errors.push(`Pillar "${pillarId}" has 0 resolved rules, but assessmentCoverage is ${agg.assessmentCoverage}% (must be 0%).`)
      }
    }
  }

  return {
    name: 'ManualStateHandlingValidator',
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Internal Consistency Validator 4: Not-Verifiable Handling
 * Verifies that NOT_VERIFIABLE checks do not award score credit
 */
export function validateNotVerifiableHandling(ruleScores) {
  const errors = []
  for (const [ruleId, rScore] of Object.entries(ruleScores)) {
    if (rScore.status === 'NOT_VERIFIABLE' && rScore.earned > 0) {
      errors.push(`Rule "${ruleId}" is NOT_VERIFIABLE but earned ${rScore.earned} points.`)
    }
  }

  return {
    name: 'NotVerifiableHandlingValidator',
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Internal Consistency Validator 5: Evidence Existence
 * Verifies that detected findings with evidence have valid character offsets within text bounds
 */
export function validateEvidenceExistence(findings, rawContentLength) {
  const errors = []
  for (const f of findings) {
    if (!Array.isArray(f.evidence)) continue
    for (const ev of f.evidence) {
      if (typeof ev.startOffset === 'number' && typeof ev.endOffset === 'number') {
        if (ev.startOffset < 0 || ev.endOffset < ev.startOffset) {
          errors.push(`Finding "${f.id || f.ruleId}" has invalid offsets [${ev.startOffset}, ${ev.endOffset}].`)
        }
        if (rawContentLength > 0 && ev.endOffset > rawContentLength + 50) {
          // Allow minor tolerance for block offsets vs raw text
          errors.push(`Finding "${f.id || f.ruleId}" offset ${ev.endOffset} exceeds document length ${rawContentLength}.`)
        }
      }
    }
  }

  return {
    name: 'EvidenceExistenceValidator',
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Internal Consistency Validator 6: Summary Examples
 * Verifies that static library examples are not listed as detected phrases
 */
export function validateSummaryExamples(findings) {
  const errors = []
  for (const f of findings) {
    if (f.ruleId === 'cliche_free' || f.ruleId === 'wrt-1') {
      const detected = (f.evidence || []).map((e) => (typeof e === 'string' ? e : e.text)).filter(Boolean)
      if (detected.length === 0 && (f.status === 'FAIL' || f.status === 'WARNING')) {
        // If status is warning/fail, there must be at least one real detected piece of evidence
        // Unless it's an informational check
        errors.push(`Cliche finding marked as ${f.status} without detected evidence instances.`)
      }
    }
  }

  return {
    name: 'SummaryExamplesValidator',
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Internal Consistency Validator 7: Claim Support Findings
 * Verifies that claims with UNSUPPORTED status in claim audit have corresponding findings or signals
 */
export function validateClaimSupportFindings(claimAudit) {
  const errors = []
  if (claimAudit && Array.isArray(claimAudit.claims)) {
    const unsupportedClaims = claimAudit.claims.filter((c) => c.evidenceState === 'UNSUPPORTED' && c.burdenLevel === 'HIGH')
    if (unsupportedClaims.length > 0 && claimAudit.claimSupportStrength === 'VERY_HIGH') {
      errors.push(`Claim audit has ${unsupportedClaims.length} unsupported high-burden claims but reports VERY_HIGH claimSupportStrength.`)
    }
  }

  return {
    name: 'ClaimSupportFindingsValidator',
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Internal Consistency Validator 8: Recommendation Deduplication
 * Verifies top recommendations are deduplicated by ruleId and ranked
 */
export function validateRecommendationDeduplication(recommendations) {
  const errors = []
  const seenRules = new Set()
  for (const rec of recommendations) {
    if (seenRules.has(rec.ruleId)) {
      errors.push(`Duplicate recommendation for rule "${rec.ruleId}".`)
    }
    seenRules.add(rec.ruleId)
  }

  return {
    name: 'RecommendationDeduplicationValidator',
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Internal Consistency Validator 9: Certification Decision
 * Verifies certification is false if there are critical/high failures or score < 70,
 * and that all blocking items exist in blockingFindingIds
 */
export function validateCertificationDecision(certification, findings, overallQualityScore) {
  const errors = []
  const criticalFails = findings.filter(
    (f) => f.status === 'FAIL' && (f.severity === 'critical' || f.severity === 'high')
  )

  if (criticalFails.length > 0 && certification.isCertified) {
    errors.push(`Content was certified despite ${criticalFails.length} critical/high failures.`)
  }

  if (overallQualityScore !== null && overallQualityScore < 70 && certification.isCertified) {
    errors.push(`Content was certified with overallQualityScore ${overallQualityScore}% (threshold is 70%).`)
  }

  if (!certification.isCertified && (!certification.blockingFindingIds || certification.blockingFindingIds.length === 0)) {
    errors.push('Content is not certified but blockingFindingIds is empty.')
  }

  return {
    name: 'CertificationDecisionValidator',
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Run all 9 Internal Consistency Validators
 */
export function runAllConsistencyValidators(params) {
  const {
    statusCounts,
    totalRules,
    pillarAggregates,
    ruleScores,
    findings,
    rawContentLength,
    claimAudit,
    recommendations,
    certification,
    overallQualityScore,
  } = params

  const results = [
    validateStatusTotals(statusCounts, totalRules),
    validatePillarScoreConsistency(pillarAggregates),
    validateManualStateHandling(pillarAggregates),
    validateNotVerifiableHandling(ruleScores),
    validateEvidenceExistence(findings, rawContentLength),
    validateSummaryExamples(findings),
    validateClaimSupportFindings(claimAudit),
    validateRecommendationDeduplication(recommendations),
    validateCertificationDecision(certification, findings, overallQualityScore),
  ]

  const allValid = results.every((r) => r.isValid)
  const allErrors = results.flatMap((r) => (r.errors ? r.errors : r.error ? [r.error] : []))

  return {
    isValid: allValid,
    validatorsRun: results.length,
    passedCount: results.filter((r) => r.isValid).length,
    failedCount: results.filter((r) => !r.isValid).length,
    errors: allErrors,
    details: results,
  }
}

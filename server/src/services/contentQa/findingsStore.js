/**
 * Canonical Findings Store
 * 
 * Every detected issue, warning, pass, manual check, and unverifiable condition
 * is stored as a structured Finding.
 * 
 * This is the SINGLE SOURCE OF TRUTH for:
 * - Overall score
 * - Pillar scores
 * - Passed / Needs-Action counts
 * - Highlights and Live Content Inspector
 * - Executive summary & AI insights
 * - Prioritized action recommendations
 * - QA Certification decision
 */

export class Finding {
  constructor({
    id,
    ruleId,
    pillarId,
    status = 'PASS',
    severity = 'info', // 'critical' | 'high' | 'medium' | 'low' | 'info'
    confidence = 1.0,
    weight = 1.0,
    message = '',
    explanation = '',
    evidence = [], // Array of { text, startOffset, endOffset, blockId, blockType, line }
    suggestedAction = '',
    recommendation = '',
    source = 'deterministic', // 'deterministic' | 'semantic' | 'manual'
    assessmentType = 'automated', // 'automated' | 'semantic' | 'manual'
    scope = 'ALL', // 'DOCUMENT_INTRO' | 'SECTION_INTROS' | 'BODY_PROSE' | 'HEADINGS' | 'ALL'
    affectsScore = true,
    metadata = {},
  }) {
    this.id = id || `f_${ruleId}_${Math.random().toString(36).substring(2, 9)}`
    this.ruleId = ruleId
    this.pillarId = pillarId
    this.status = status // 'PASS' | 'WARNING' | 'FAIL' | 'NOT_APPLICABLE' | 'NOT_VERIFIABLE' | 'MANUAL_REVIEW'
    this.severity = severity
    this.confidence = Math.min(1.0, Math.max(0.0, Number(confidence) || 1.0))
    this.weight = Number(weight) || 1.0
    this.explanation = explanation || message || ''
    this.message = this.explanation
    this.evidence = Array.isArray(evidence) ? evidence : []
    this.recommendation = recommendation || suggestedAction || ''
    this.suggestedAction = this.recommendation
    this.source = source
    this.assessmentType = assessmentType || source || 'automated'
    this.scope = scope || 'ALL'
    this.affectsScore = Boolean(affectsScore)
    this.metadata = metadata || {}
    this.timestamp = new Date().toISOString()
  }

  toCanonicalCheckResult() {
    return {
      ruleId: this.ruleId,
      pillarId: this.pillarId,
      status: this.status,
      severity: this.severity,
      confidence: this.confidence,
      weight: this.weight,
      affectsScore: this.affectsScore,
      evidence: this.evidence,
      explanation: this.explanation,
      recommendation: this.recommendation,
      assessmentType: this.assessmentType,
      scope: this.scope,
    }
  }

  toJSON() {
    return {
      id: this.id,
      ruleId: this.ruleId,
      pillarId: this.pillarId,
      status: this.status,
      severity: this.severity,
      confidence: this.confidence,
      weight: this.weight,
      affectsScore: this.affectsScore,
      evidence: this.evidence,
      explanation: this.explanation,
      message: this.explanation,
      recommendation: this.recommendation,
      suggestedAction: this.recommendation,
      assessmentType: this.assessmentType,
      source: this.source,
      scope: this.scope,
      metadata: this.metadata,
    }
  }
}

export class CanonicalFindingsStore {
  constructor() {
    this.findings = new Map() // ruleId -> Finding
    this.rawFindingList = []
  }

  /**
   * Add or merge a finding for a rule
   * @param {Object} findingData 
   * @returns {Finding}
   */
  addFinding(findingData) {
    const finding = new Finding(findingData)
    const existing = this.findings.get(finding.ruleId)

    if (!existing) {
      this.findings.set(finding.ruleId, finding)
      this.rawFindingList.push(finding)
      return finding
    }

    // Merge logic: higher severity / worse status takes precedence
    const statusPrecedence = {
      FAIL: 5,
      WARNING: 4,
      MANUAL_REVIEW: 3,
      NOT_VERIFIABLE: 2,
      PASS: 1,
      NOT_APPLICABLE: 0,
    }

    const currentRank = statusPrecedence[existing.status] || 0
    const newRank = statusPrecedence[finding.status] || 0

    if (newRank > currentRank) {
      // Elevate status
      existing.status = finding.status
      existing.severity = finding.severity
      existing.message = finding.message
      existing.suggestedAction = finding.suggestedAction || existing.suggestedAction
      existing.source = finding.source
    }

    // Merge evidence without duplicate offsets
    const offsetSet = new Set(existing.evidence.map((e) => `${e.startOffset}_${e.endOffset}`))
    for (const ev of finding.evidence) {
      const key = `${ev.startOffset}_${ev.endOffset}`
      if (!offsetSet.has(key)) {
        existing.evidence.push(ev)
        offsetSet.add(key)
      }
    }

    existing.confidence = Math.min(existing.confidence, finding.confidence)
    return existing
  }

  getFinding(ruleId) {
    return this.findings.get(ruleId) || null
  }

  getAllFindings() {
    return Array.from(this.findings.values())
  }

  getFindingsByPillar(pillarId) {
    return this.getAllFindings().filter((f) => f.pillarId === pillarId)
  }

  getFailingFindings() {
    return this.getAllFindings().filter((f) => f.status === 'FAIL')
  }

  getWarningFindings() {
    return this.getAllFindings().filter((f) => f.status === 'WARNING')
  }

  getManualReviewFindings() {
    return this.getAllFindings().filter((f) => f.status === 'MANUAL_REVIEW')
  }

  getUnverifiableFindings() {
    return this.getAllFindings().filter((f) => f.status === 'NOT_VERIFIABLE')
  }

  getFindingsByStatus(status) {
    return this.getAllFindings().filter((f) => f.status === status)
  }

  getPassingFindings() {
    return this.getAllFindings().filter((f) => f.status === 'PASS')
  }

  /**
   * Check if any unresolved critical or high severity failures exist
   */
  hasUnresolvedHardFailures() {
    return this.getAllFindings().some(
      (f) => f.status === 'FAIL' && ['critical', 'high'].includes(f.severity)
    )
  }

  /**
   * Aggregate counts across all findings
   */
  getCounts() {
    const all = this.getAllFindings()
    let pass = 0, fail = 0, warning = 0, manual = 0, unverifiable = 0, notApplicable = 0
    let totalEvidenceItems = 0

    for (const f of all) {
      totalEvidenceItems += f.evidence.length
      if (f.status === 'PASS') pass++
      else if (f.status === 'FAIL') fail++
      else if (f.status === 'WARNING') warning++
      else if (f.status === 'MANUAL_REVIEW') manual++
      else if (f.status === 'NOT_VERIFIABLE') unverifiable++
      else if (f.status === 'NOT_APPLICABLE') notApplicable++
    }

    return {
      totalRules: all.length,
      pass,
      fail,
      warning,
      manual,
      unverifiable,
      notApplicable,
      needsAction: fail + warning,
      totalEvidenceItems,
    }
  }

  /**
   * Export all evidence as flat highlights for Live Content Inspector UI
   */
  toInspectorHighlights() {
    const highlights = []
    for (const f of this.getAllFindings()) {
      if (['FAIL', 'WARNING'].includes(f.status) || f.evidence.length > 0) {
        for (const ev of f.evidence) {
          highlights.push({
            id: `h_${f.ruleId}_${ev.startOffset || 0}`,
            ruleId: f.ruleId,
            pillarId: f.pillarId,
            type: f.ruleId === 'ts-3' ? 'em-dash' : f.ruleId === 'ts-5' ? 'colon' : f.ruleId === 'ts-2' ? 'ai-cliche' : f.ruleId.startsWith('comp') ? 'compliance' : 'style',
            label: f.ruleId === 'ts-3' ? 'Em Dash Detected' : f.ruleId === 'ts-5' ? 'Colon Detected' : f.ruleId === 'ts-2' ? 'Robotic AI Cliché' : f.message.substring(0, 40),
            severity: f.status === 'FAIL' ? 'error' : 'warning',
            text: ev.text || '',
            index: ev.startOffset || 0,
            length: (ev.text || '').length,
            blockId: ev.blockId || null,
            blockType: ev.blockType || 'paragraph',
            suggestion: f.suggestedAction || 'Review and polish.',
            reason: f.message,
            message: f.message,
            context: ev.context || ev.text || '',
          })
        }
      }
    }
    return highlights
  }
}

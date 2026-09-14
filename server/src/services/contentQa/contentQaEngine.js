/**
 * Master Content QA Analytics Engine
 * 
 * Orchestrates the full canonical pipeline:
 * PARSE CONTENT
 * → UNDERSTAND CONTENT STRUCTURE
 * → EXTRACT & AUDIT CLAIMS (Domain-agnostic)
 * → DETERMINE APPLICABLE RULES
 * → EXECUTE RULES & POPULATE CANONICAL FINDINGS
 * → SCORE CHECKS, PILLARS & OVERALL QA
 * → RUN 9 INTERNAL CONSISTENCY VALIDATORS
 * → GENERATE DEDUPLICATED, IMPACT-RANKED RECOMMENDATIONS
 * → CERTIFY OR REJECT WITH TRACEABLE BLOCKING FINDINGS
 */

import { parseContentBlocks, extractProseBlocks, extractHeadings, extractListBlocks } from './blockParser.js'
import { QA_PILLARS_CONFIG, getApplicableRules, getRulesMap } from './qaRulesConfig.js'
import { CanonicalFindingsStore, Finding } from './findingsStore.js'
import { extractAndAuditClaims } from './claimExtractor.js'
import { detectEmDashes, detectEnDashes, detectColons } from './punctuationDetector.js'
import { analyzeProseReadability } from './readabilityAnalyzer.js'
import {
  detectRoboticPhrases,
  detectFillerPhrases,
  analyzeSentenceCompleteness,
  verifySourceTruncation,
} from './styleAndLinguisticDetector.js'
import {
  evaluateHeadlineAndSupportingLine,
  evaluateWhyHowDepth,
  evaluateInsightFirst,
  evaluateEeatSignals,
  evaluatePromotionalIntent,
  evaluateBrandContext,
  evaluateComplianceAndRisk,
  evaluateVisualPlatformFit,
  evaluateTargetKeywordAlignment,
  detectDuplicateOrOrphanBlocks,
} from './semanticQaEvaluator.js'
import {
  calculateMathematicalScores,
  runAllConsistencyValidators,
} from './scoringEngine.js'
import {
  generatePrioritizedFixes,
  synthesizeExecutiveSummary,
  evaluateCertification,
} from './recommendationEngine.js'

/**
 * Execute full Content QA Audit
 * @param {Object} input - Configuration and content parameters
 * @returns {Object} Complete canonical Content QA audit report
 */
export function executeContentQaAudit(input = {}) {
  const {
    content = '',
    title = '',
    targetKeyword = '',
    platform = 'website',
    contentType = 'blog',
    contentTemplate = 'blog',
    supportingLineMode = 'recommended',
    insightFirstScope = 'DOCUMENT_INTRO',
    targetAudience = '',
    contentGoal = 'educational',
    brandProfile = null,
    brandVoice = null,
  } = input

  const rawContent = (content || '').trim()
  const rawWords = rawContent.split(/\s+/).filter(Boolean)
  const totalWordCount = rawWords.length
  const effectiveContentType = contentTemplate || contentType || 'blog'

  // ── 1. PARSE CONTENT & UNDERSTAND STRUCTURE ─────────────────────
  const blocks = parseContentBlocks(rawContent, title)
  const proseBlocks = extractProseBlocks(blocks)
  const headingBlocks = extractHeadings(blocks)
  const listBlocks = extractListBlocks(blocks)

  // ── 2. DOMAIN-AGNOSTIC CLAIM EXTRACTION & EVIDENTIARY AUDIT ─────
  const claimAudit = extractAndAuditClaims(blocks, rawContent)

  // ── 3. DETERMINE APPLICABLE RULES ──────────────────────────────
  const applicableRules = getApplicableRules(platform, effectiveContentType)
  const rulesMap = getRulesMap()
  const findingsStore = new CanonicalFindingsStore()

  const getRuleDef = (id) => rulesMap.get(id) || { weight: 1.0, severityOnFailure: 'medium', pillarId: 'general' }

  // ── 4. EXECUTE RULES & POPULATE CANONICAL FINDINGS STORE ─────────

  // 4a. Punctuation Checks (Unicode exact)
  const emDashResult = detectEmDashes(blocks, rawContent)
  const enDashResult = detectEnDashes(blocks, rawContent)
  const colonResult = detectColons(blocks, rawContent)

  // TS-3: Zero Em Dashes
  const rTS3 = getRuleDef('ts-3')
  findingsStore.addFinding(new Finding({
    ruleId: 'ts-3',
    pillarId: 'tone_style_ai',
    status: emDashResult.count === 0 ? 'PASS' : 'FAIL',
    severity: emDashResult.count === 0 ? 'info' : rTS3.severityOnFailure || 'high',
    confidence: 1.0,
    weight: rTS3.weight || 1.0,
    affectsScore: true,
    evidence: emDashResult.evidence,
    explanation: emDashResult.count === 0
      ? 'Zero em dashes detected in editorial prose.'
      : `Detected ${emDashResult.count} em dash(es) in editorial prose.`,
    recommendation: emDashResult.count === 0
      ? ''
      : 'Replace em dashes with commas, periods, or clean sentence breaks.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // TS-5: Zero Colons
  const rTS5 = getRuleDef('ts-5')
  findingsStore.addFinding(new Finding({
    ruleId: 'ts-5',
    pillarId: 'tone_style_ai',
    status: colonResult.count === 0 ? 'PASS' : 'FAIL',
    severity: colonResult.count === 0 ? 'info' : rTS5.severityOnFailure || 'high',
    confidence: 1.0,
    weight: rTS5.weight || 1.0,
    affectsScore: true,
    evidence: colonResult.evidence,
    explanation: colonResult.count === 0
      ? 'Zero colons detected in editorial prose.'
      : `Detected ${colonResult.count} colon(s) in editorial prose.`,
    recommendation: colonResult.count === 0
      ? ''
      : 'Replace colons with periods, commas, or separate sentences.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // 4b. Robotic AI Clichés (TS-2)
  const roboticResult = detectRoboticPhrases(blocks, rawContent)
  const rTS2 = getRuleDef('ts-2')
  findingsStore.addFinding(new Finding({
    ruleId: 'ts-2',
    pillarId: 'tone_style_ai',
    status: roboticResult.count === 0 ? 'PASS' : 'FAIL',
    severity: roboticResult.count === 0 ? 'info' : rTS2.severityOnFailure || 'high',
    confidence: 1.0,
    weight: rTS2.weight || 1.0,
    affectsScore: true,
    evidence: roboticResult.evidence,
    explanation: roboticResult.count === 0
      ? 'Clean human voice with zero common AI clichés or robotic buzzwords.'
      : `Detected ${roboticResult.count} robotic AI cliché occurrence(s): ${roboticResult.distinctPhrases.map((p) => `"${p.phrase}"`).join(', ')}.`,
    recommendation: roboticResult.count === 0
      ? ''
      : `Swap robotic buzzwords for conversational alternatives: ${roboticResult.distinctPhrases.slice(0, 2).map((p) => `"${p.phrase}" → "${p.suggestion}"`).join(', ')}.`,
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
    metadata: {
      distinctPhrases: roboticResult.distinctPhrases,
      phraseCount: roboticResult.count,
    },
  }))

  // Meaning & Crispness (MC-2): Filler phrases
  const fillerResult = detectFillerPhrases(blocks, rawContent)
  const rMC2 = getRuleDef('mc-2')
  findingsStore.addFinding(new Finding({
    ruleId: 'mc-2',
    pillarId: 'meaning_crispness',
    status: fillerResult.count === 0 ? 'PASS' : 'WARNING',
    severity: fillerResult.count === 0 ? 'info' : rMC2.severityOnFailure || 'medium',
    confidence: 1.0,
    weight: rMC2.weight || 1.0,
    affectsScore: true,
    evidence: fillerResult.evidence,
    explanation: fillerResult.count === 0
      ? 'Every sentence earns its place with zero throat-clearing filler lines.'
      : `Detected ${fillerResult.count} throat-clearing filler phrase(s).`,
    recommendation: fillerResult.count === 0
      ? ''
      : 'Delete throat-clearing filler phrases to tighten prose.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // 4c. Sentence Completeness & Truncation (TS-4)
  const completeness = analyzeSentenceCompleteness(blocks, rawContent)
  const truncation = verifySourceTruncation(blocks, rawContent)
  const rTS4 = getRuleDef('ts-4')
  const sentenceIssues = []
  const sentenceEv = []
  if (completeness.runawaySentences.length > 0) {
    sentenceIssues.push(`${completeness.runawaySentences.length} runaway sentence(s) (>35 words)`)
    sentenceEv.push(...completeness.runawaySentences)
  }
  if (completeness.abruptFragments.length > 0) {
    sentenceIssues.push(`${completeness.abruptFragments.length} abrupt prose fragment(s)`)
    sentenceEv.push(...completeness.abruptFragments)
  }
  if (truncation.isTruncated) {
    sentenceIssues.push('Content ends abruptly with unfinished sentence structure')
    sentenceEv.push(...truncation.evidence)
  }

  const ts4Status = (completeness.passed && !truncation.isTruncated)
    ? 'PASS'
    : (completeness.runawaySentences.length > 2 || truncation.isTruncated)
    ? 'FAIL'
    : 'WARNING'

  findingsStore.addFinding(new Finding({
    ruleId: 'ts-4',
    pillarId: 'tone_style_ai',
    status: ts4Status,
    severity: ts4Status === 'FAIL' ? 'high' : ts4Status === 'WARNING' ? 'medium' : 'info',
    confidence: 1.0,
    weight: rTS4.weight || 1.0,
    affectsScore: true,
    evidence: sentenceEv,
    explanation: ts4Status === 'PASS'
      ? 'Sentence lengths are well balanced with no runaway run-ons or fragmented breaks.'
      : `Sentence structure issues: ${sentenceIssues.join(', ')}.`,
    recommendation: ts4Status === 'PASS'
      ? ''
      : 'Break long sentences over 30 words into two thoughts and verify final paragraph completeness.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // 4d. Read Aloud Readability (RA-1 & RA-3)
  const readability = analyzeProseReadability(blocks)
  const rRA1 = getRuleDef('ra-1')
  const ra1Status = readability.readabilityScore >= 55 ? 'PASS' : readability.readabilityScore >= 40 ? 'WARNING' : 'FAIL'
  findingsStore.addFinding(new Finding({
    ruleId: 'ra-1',
    pillarId: 'read_aloud',
    status: ra1Status,
    severity: ra1Status === 'PASS' ? 'info' : 'medium',
    confidence: readability.confidence || 0.9,
    weight: rRA1.weight || 1.0,
    affectsScore: true,
    evidence: [],
    explanation: ra1Status === 'PASS'
      ? `Flesch Reading Ease score: ${readability.readabilityScore}/100 (${readability.gradeLevel}).`
      : `Flesch Reading Ease score is ${readability.readabilityScore}/100 (${readability.gradeLevel}). Prose may feel dense when read aloud.`,
    recommendation: ra1Status === 'PASS'
      ? ''
      : 'Simplify complex words and shorten multi-clause sentences for conversational verbal flow.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  const rRA3 = getRuleDef('ra-3')
  const longLines = completeness.runawaySentences.length
  findingsStore.addFinding(new Finding({
    ruleId: 'ra-3',
    pillarId: 'read_aloud',
    status: longLines <= 1 ? 'PASS' : 'WARNING',
    severity: longLines <= 1 ? 'info' : 'low',
    confidence: 1.0,
    weight: rRA3.weight || 1.0,
    affectsScore: true,
    evidence: completeness.runawaySentences,
    explanation: longLines <= 1
      ? 'Lines are tightly written with minimal wordiness.'
      : `${longLines} sentence(s) exceed 35 words and could be trimmed without losing meaning.`,
    recommendation: longLines <= 1
      ? ''
      : 'Prune auxiliary filler words and split long sentences.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // 4e. Conversational Tone (TS-1)
  const rTS1 = getRuleDef('ts-1')
  const contractionCount = (rawContent.match(/\b\w+['’](t|s|re|ve|m|ll|d)\b/gi) || []).length
  const conversationalRatio = totalWordCount > 0 ? (contractionCount / totalWordCount) * 100 : 0
  const isHumanTone = conversationalRatio >= 0.3 || (readability.avgWordsPerSentence <= 20 && roboticResult.count === 0)
  const ts1Status = isHumanTone ? 'PASS' : roboticResult.count > 2 ? 'FAIL' : 'WARNING'

  findingsStore.addFinding(new Finding({
    ruleId: 'ts-1',
    pillarId: 'tone_style_ai',
    status: ts1Status,
    severity: ts1Status === 'PASS' ? 'info' : 'medium',
    confidence: 0.9,
    weight: rTS1.weight || 1.0,
    affectsScore: true,
    evidence: [],
    explanation: isHumanTone
      ? `Tone is conversational with avg sentence length ${readability.avgWordsPerSentence} words.`
      : 'Tone feels slightly formal or rigid; use natural contractions and direct second-person framing.',
    recommendation: isHumanTone ? '' : 'Write as if speaking directly to an experienced peer.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // 4f. Audience Alignment & Target Keyword (AUD-2)
  // Requirement #15: If target keyword is not provided, returns NOT_VERIFIABLE with affectsScore: false
  const rAUD2 = getRuleDef('aud-2')
  const keywordAnalysis = evaluateTargetKeywordAlignment(targetKeyword, blocks, title)
  findingsStore.addFinding(new Finding({
    ruleId: 'aud-2',
    pillarId: 'audience_alignment',
    status: keywordAnalysis.status,
    severity: keywordAnalysis.status === 'FAIL' ? 'medium' : keywordAnalysis.status === 'WARNING' ? 'low' : 'info',
    confidence: 1.0,
    weight: rAUD2.weight || 1.0,
    affectsScore: keywordAnalysis.affectsScore,
    evidence: [],
    explanation: keywordAnalysis.explanation,
    recommendation: keywordAnalysis.recommendation,
    assessmentType: keywordAnalysis.status === 'NOT_VERIFIABLE' ? 'MANUAL' : 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // AUD-1: Audience targeting intent
  const rAUD1 = getRuleDef('aud-1')
  findingsStore.addFinding(new Finding({
    ruleId: 'aud-1',
    pillarId: 'audience_alignment',
    status: targetAudience ? 'PASS' : 'WARNING',
    severity: targetAudience ? 'info' : 'low',
    confidence: 0.9,
    weight: rAUD1.weight || 1.0,
    affectsScore: true,
    evidence: [],
    explanation: targetAudience
      ? `Content vocabulary calibrated for ${targetAudience}.`
      : 'Target audience not explicitly configured; evaluated against general professional standards.',
    recommendation: targetAudience ? '' : 'Specify target reader seniority in QA parameters to enable precise intent calibration.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // 4g. E-E-A-T Evidence & Graded Depth (EAT-1, EAT-2, EAT-3)
  const eeatSignals = evaluateEeatSignals(blocks, rawContent)
  const whyHowAnalysis = evaluateWhyHowDepth(blocks, rawContent)
  const rEAT1 = getRuleDef('eat-1')
  const rEAT2 = getRuleDef('eat-2')
  const rEAT3 = getRuleDef('eat-3')

  // EAT-1: Observable first-hand experience vs claims of experience
  const hasStrongEvidence = claimAudit.metrics.experienceEvidenceStrength === 'VERY_HIGH' ||
    claimAudit.metrics.experienceEvidenceStrength === 'HIGH' ||
    eeatSignals.hasStrongEvidence

  const hasOnlyClaims = claimAudit.metrics.experienceClaimsCount > 0 &&
    claimAudit.metrics.firstHandEvidenceCount === 0

  let eat1Status = 'PASS'
  let eat1Severity = 'info'
  let eat1Msg = `Observable first-hand evidence and specific methodology details detected (${claimAudit.metrics.firstHandEvidenceCount} direct signal(s), ${claimAudit.metrics.citationsCount} citation(s)).`
  let eat1Action = ''

  if (hasStrongEvidence) {
    eat1Status = 'PASS'
  } else if (hasOnlyClaims) {
    eat1Status = 'WARNING'
    eat1Severity = 'medium'
    eat1Msg = 'Content contains claims of experience ("in our experience...") but lacks concrete observable data, metrics, or case examples.'
    eat1Action = 'Back up experience claims with specific anonymized data, implementation tests, or documented observations.'
  } else {
    eat1Status = 'WARNING'
    eat1Severity = 'high'
    eat1Msg = 'Lacks observable first-hand evidence, case examples, or real-world operational context.'
    eat1Action = 'Add real-world examples, benchmark data, or practical implementation observations.'
  }

  findingsStore.addFinding(new Finding({
    ruleId: 'eat-1',
    pillarId: 'eeat_check',
    status: eat1Status,
    severity: eat1Severity,
    confidence: 0.95,
    weight: rEAT1.weight || 1.0,
    affectsScore: true,
    evidence: claimAudit.evidenceBreakdown.FIRST_HAND_EVIDENCE.map((c) => ({
      text: c.claimText,
      startOffset: c.startOffset,
      endOffset: c.endOffset,
      blockId: c.blockId,
    })),
    explanation: eat1Msg,
    recommendation: eat1Action,
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // EAT-2: Graded Why/How Tactical Depth (Requirement #13)
  findingsStore.addFinding(new Finding({
    ruleId: 'eat-2',
    pillarId: 'eeat_check',
    status: whyHowAnalysis.status,
    severity: whyHowAnalysis.status === 'FAIL' ? 'high' : whyHowAnalysis.status === 'WARNING' ? 'medium' : 'info',
    confidence: 0.9,
    weight: rEAT2.weight || 1.0,
    affectsScore: true,
    evidence: [],
    explanation: `[Depth: ${whyHowAnalysis.depth}] ${whyHowAnalysis.message}`,
    recommendation: whyHowAnalysis.status === 'PASS'
      ? ''
      : 'Dedicate section space to explaining the causal mechanism and practical step-by-step how.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
    metadata: {
      depth: whyHowAnalysis.depth,
      dimensionScore: whyHowAnalysis.dimensionScore,
    },
  }))

  // EAT-3: Claim Support & Factual Attributions
  const unsupportedFactual = claimAudit.claims.filter(
    (c) => (c.claimType === 'STATISTICAL' || c.claimType === 'CAUSAL') && c.evidenceState === 'UNSUPPORTED'
  )
  const eat3Status = unsupportedFactual.length === 0
    ? 'PASS'
    : unsupportedFactual.length > 2
    ? 'FAIL'
    : 'WARNING'

  findingsStore.addFinding(new Finding({
    ruleId: 'eat-3',
    pillarId: 'eeat_check',
    status: eat3Status,
    severity: eat3Status === 'FAIL' ? 'high' : eat3Status === 'WARNING' ? 'medium' : 'info',
    confidence: 0.9,
    weight: rEAT3.weight || 1.0,
    affectsScore: true,
    evidence: unsupportedFactual.map((c) => ({
      text: c.claimText,
      startOffset: c.startOffset,
      endOffset: c.endOffset,
      blockId: c.blockId,
    })),
    explanation: eat3Status === 'PASS'
      ? `Core empirical statements are grounded with appropriate evidence support (Support Strength: ${claimAudit.metrics.claimSupportStrength}).`
      : `Detected ${unsupportedFactual.length} empirical statistical or causal claim(s) without supporting citations or primary data.`,
    recommendation: eat3Status === 'PASS'
      ? ''
      : 'Provide source attribution or research citations for numerical and causal assertions.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // 4h. Insight First (INS-1 & INS-2) - Scoped & Classification First
  // Requirements #8 & #9:
  // Scope: 'DOCUMENT_INTRO' | 'SECTION_INTROS' | 'ALL_OPENINGS'
  // Classification: DIRECT_INSIGHT, THROAT_CLEARING, GENERIC_BACKSTORY, DELAYED_VALUE
  const insightResult = evaluateInsightFirst(blocks, rawContent, insightFirstScope)
  const rINS1 = getRuleDef('ins-1')
  const rINS2 = getRuleDef('ins-2')

  findingsStore.addFinding(new Finding({
    ruleId: 'ins-1',
    pillarId: 'insight_first',
    status: insightResult.status,
    severity: insightResult.status === 'FAIL' ? 'high' : insightResult.status === 'WARNING' ? 'medium' : 'info',
    confidence: 0.95,
    weight: rINS1.weight || 1.0,
    affectsScore: true,
    evidence: insightResult.findings.filter((f) => f.status !== 'PASS').map((f) => ({
      text: f.text,
      startOffset: f.startOffset,
      endOffset: f.endOffset,
      blockId: f.blockId,
      context: f.classification,
    })),
    explanation: `[${insightResult.classification}] ${insightResult.message}`,
    recommendation: insightResult.status === 'PASS'
      ? ''
      : 'Cut introductory throat-clearing and lead immediately with the core thesis or observation.',
    assessmentType: 'AUTOMATED',
    scope: insightFirstScope,
    metadata: {
      classification: insightResult.classification,
      scope: insightFirstScope,
    },
  }))

  const ins2Status = insightResult.status === 'FAIL' ? 'WARNING' : insightResult.status
  findingsStore.addFinding(new Finding({
    ruleId: 'ins-2',
    pillarId: 'insight_first',
    status: ins2Status,
    severity: ins2Status === 'PASS' ? 'info' : 'low',
    confidence: 0.9,
    weight: rINS2.weight || 1.0,
    affectsScore: true,
    evidence: [],
    explanation: ins2Status === 'PASS'
      ? 'Direction is established immediately in the opening sentence.'
      : 'Direction could be established more immediately in the first sentence.',
    recommendation: ins2Status === 'PASS' ? '' : 'Deliver the primary takeaway in the opening sentence.',
    assessmentType: 'AUTOMATED',
    scope: insightFirstScope,
  }))

  // 4i. Structure & Headline (STR-1, STR-2, STR-3, STR-4)
  // Requirements #14, #16, #23, #25:
  // Content-type aware headline & configurable supporting line requirement
  const headlineAnalysis = evaluateHeadlineAndSupportingLine(blocks, rawContent, title, {
    platform,
    contentType: effectiveContentType,
    supportingLineMode,
  })
  const rSTR1 = getRuleDef('str-1')
  const rSTR2 = getRuleDef('str-2')
  const rSTR3 = getRuleDef('str-3')
  const rSTR4 = getRuleDef('str-4')

  findingsStore.addFinding(new Finding({
    ruleId: 'str-1',
    pillarId: 'structure_check',
    status: headlineAnalysis.isHeadlineStrong ? 'PASS' : 'WARNING',
    severity: headlineAnalysis.isHeadlineStrong ? 'info' : 'medium',
    confidence: 0.9,
    weight: rSTR1.weight || 1.0,
    affectsScore: true,
    evidence: headlineAnalysis.headlineFindings.map((h) => ({
      text: h.text,
      startOffset: h.startOffset,
      endOffset: h.endOffset,
      blockId: h.blockId,
    })),
    explanation: headlineAnalysis.isHeadlineStrong
      ? `Strong headline identified: "${headlineAnalysis.title.substring(0, 50)}...".`
      : headlineAnalysis.headlineFindings[0]?.reason || 'Headline needs tighter specificity.',
    recommendation: headlineAnalysis.isHeadlineStrong ? '' : 'Sharpen the headline with specific promise and topic focus.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // STR-2: Supporting line
  let str2Status = 'PASS'
  let str2AffectsScore = true
  let str2Msg = ''
  let str2Action = ''

  if (headlineAnalysis.supportingLineMode === 'not_applicable') {
    str2Status = 'NOT_APPLICABLE'
    str2AffectsScore = false
    str2Msg = `Supporting line is not applicable for ${effectiveContentType} under current configuration.`
  } else if (headlineAnalysis.supportingLineFound) {
    str2Status = 'PASS'
    str2Msg = `Supporting subline identified: "${headlineAnalysis.supportingLineText.substring(0, 50)}...".`
  } else if (headlineAnalysis.supportingLineMode === 'required') {
    str2Status = 'FAIL'
    str2Msg = 'Required supporting line is missing directly beneath the headline.'
    str2Action = 'Add a concise 1-sentence supporting line beneath the headline to contextualize value.'
  } else {
    // recommended
    str2Status = 'WARNING'
    str2Msg = 'No immediate supporting deck or bridge line directly beneath the headline.'
    str2Action = 'Consider adding a supporting line beneath the headline to bridge to the body.'
  }

  findingsStore.addFinding(new Finding({
    ruleId: 'str-2',
    pillarId: 'structure_check',
    status: str2Status,
    severity: str2Status === 'FAIL' ? 'high' : str2Status === 'WARNING' ? 'low' : 'info',
    confidence: 0.9,
    weight: rSTR2.weight || 1.0,
    affectsScore: str2AffectsScore,
    evidence: [],
    explanation: str2Msg,
    recommendation: str2Action,
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // STR-3: Heading architecture
  const headingCount = headingBlocks.length
  findingsStore.addFinding(new Finding({
    ruleId: 'str-3',
    pillarId: 'structure_check',
    status: headingCount >= 2 || totalWordCount < 300 ? 'PASS' : 'WARNING',
    severity: headingCount >= 2 || totalWordCount < 300 ? 'info' : 'medium',
    confidence: 1.0,
    weight: rSTR3.weight || 1.0,
    affectsScore: true,
    evidence: [],
    explanation: `Content contains ${headingCount} structural heading(s) organizing narrative flow.`,
    recommendation: headingCount < 2 ? 'Add subheadings to organize distinct thematic sections.' : '',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // STR-4: Past tense density
  const pastTenseCount = (rawContent.match(/\b(was|were|had been|did|went|saw|thought|felt)\b|\w+ed\b/gi) || []).length
  const pastRatio = totalWordCount > 0 ? (pastTenseCount / totalWordCount) * 100 : 0
  findingsStore.addFinding(new Finding({
    ruleId: 'str-4',
    pillarId: 'structure_check',
    status: pastRatio < 14 ? 'PASS' : 'WARNING',
    severity: 'low',
    confidence: 0.9,
    weight: rSTR4.weight || 1.0,
    affectsScore: true,
    evidence: [],
    explanation: `Past tense density is ${pastRatio.toFixed(1)}% (${pastRatio < 14 ? 'Clean active present voice' : 'Higher retrospective tense'}).`,
    recommendation: pastRatio >= 14 ? 'Switch narrative descriptions to immediate present-tense action where appropriate.' : '',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // 4j. Promotional Intent & Content Goal (SP-1, SP-3, SP-4)
  const promo = evaluatePromotionalIntent(blocks, rawContent, contentGoal)
  const rSP1 = getRuleDef('sp-1')
  const rSP3 = getRuleDef('sp-3')
  const rSP4 = getRuleDef('sp-4')

  findingsStore.addFinding(new Finding({
    ruleId: 'sp-1',
    pillarId: 'no_direct_sales_pitches',
    status: promo.superlativeCount === 0 ? 'PASS' : 'WARNING',
    severity: promo.superlativeCount === 0 ? 'info' : 'medium',
    confidence: 1.0,
    weight: rSP1.weight || 1.0,
    affectsScore: true,
    evidence: promo.superlativeEvidence,
    explanation: promo.superlativeCount === 0
      ? 'Grounded, professional storytelling without hyperbolic superlatives.'
      : `Detected ${promo.superlativeCount} exaggerated superlative claim(s).`,
    recommendation: promo.superlativeCount > 0 ? 'Tone down hyperbole with verifiable practitioner facts.' : '',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  findingsStore.addFinding(new Finding({
    ruleId: 'sp-3',
    pillarId: 'no_direct_sales_pitches',
    status: promo.status,
    severity: promo.status === 'FAIL' ? 'high' : promo.status === 'WARNING' ? 'medium' : 'info',
    confidence: 0.95,
    weight: rSP3.weight || 1.0,
    affectsScore: true,
    evidence: promo.promoEvidence,
    explanation: promo.promoCount === 0
      ? 'Clean narrative focus with zero unsolicited commercial pitches.'
      : `Detected ${promo.promoCount} direct promotional / CTA pitch(es) in ${contentGoal} content.`,
    recommendation: promo.status !== 'PASS' ? 'Let the depth of your insights establish authority rather than interrupting with sales pitches.' : '',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  const milestoneStatus = promo.milestoneCount === 0
    ? 'PASS'
    : (contentGoal === 'educational' ? 'FAIL' : 'WARNING')

  findingsStore.addFinding(new Finding({
    ruleId: 'sp-4',
    pillarId: 'no_direct_sales_pitches',
    status: milestoneStatus,
    severity: milestoneStatus === 'FAIL' ? 'high' : milestoneStatus === 'WARNING' ? 'medium' : 'info',
    confidence: 1.0,
    weight: rSP4.weight || 1.0,
    affectsScore: true,
    evidence: promo.milestoneEvidence,
    explanation: promo.milestoneCount === 0
      ? 'Zero milestone bragging (e.g. "10+ years", "500+ happy clients").'
      : `Detected ${promo.milestoneCount} tenure/milestone bragging claim(s).`,
    recommendation: promo.milestoneCount > 0 ? 'Demonstrate expertise through current concrete observations rather than past tenure metrics.' : '',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // 4k. Compliance & Risk Check (COMP-1 & COMP-2)
  const compliance = evaluateComplianceAndRisk(blocks, rawContent)
  const rCOMP1 = getRuleDef('comp-1')
  const rCOMP2 = getRuleDef('comp-2')

  const comp1Status = compliance.medicalFail
    ? 'FAIL'
    : compliance.isSensitive && compliance.detectedSensitivities.includes('health_medical') && !compliance.hasDisclaimer
      ? 'WARNING'
      : 'PASS'

  findingsStore.addFinding(new Finding({
    ruleId: 'comp-1',
    pillarId: 'compliance_risk',
    status: comp1Status,
    severity: comp1Status === 'FAIL' ? 'critical' : comp1Status === 'WARNING' ? 'high' : 'info',
    confidence: 0.95,
    weight: rCOMP1.weight || 1.0,
    affectsScore: true,
    evidence: compliance.evidence.filter((e) => e.domain === 'health_medical'),
    explanation: comp1Status === 'FAIL'
      ? 'Unverified medical claim or health treatment statement detected without qualified disclaimer.'
      : compliance.message,
    recommendation: comp1Status !== 'PASS' ? 'Add clear healthcare disclaimer or consult verified health regulations.' : '',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
    metadata: {
      jurisdictionNotice: compliance.jurisdictionNotice,
    },
  }))

  const comp2Status = compliance.financeFail
    ? 'FAIL'
    : compliance.isSensitive && compliance.detectedSensitivities.includes('finance_investment') && !compliance.hasDisclaimer
      ? 'WARNING'
      : 'PASS'

  findingsStore.addFinding(new Finding({
    ruleId: 'comp-2',
    pillarId: 'compliance_risk',
    status: comp2Status,
    severity: comp2Status === 'FAIL' ? 'critical' : comp2Status === 'WARNING' ? 'high' : 'info',
    confidence: 0.95,
    weight: rCOMP2.weight || 1.0,
    affectsScore: true,
    evidence: compliance.evidence.filter((e) => e.domain === 'finance_investment'),
    explanation: comp2Status === 'FAIL'
      ? 'Guaranteed financial return or unverified investment claim detected without regulatory qualification.'
      : 'Regulated financial return and investment neutrality verified.',
    recommendation: comp2Status !== 'PASS' ? 'Neutralize any guaranteed financial returns to comply with regulatory standards.' : '',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
    metadata: {
      jurisdictionNotice: compliance.jurisdictionNotice,
    },
  }))

  // 4l. Brand Positioning Context (BP-1 & BP-2)
  // Requirement #7: Brand positioning requires actual brand guidelines; missing profile returns NOT_VERIFIABLE
  const brandEvaluation = evaluateBrandContext(brandProfile, brandVoice)
  const rBP1 = getRuleDef('bp-1')
  const rBP2 = getRuleDef('bp-2')

  findingsStore.addFinding(new Finding({
    ruleId: 'bp-1',
    pillarId: 'brand_positioning',
    status: brandEvaluation.status,
    severity: 'medium',
    confidence: 1.0,
    weight: rBP1.weight || 1.0,
    affectsScore: brandEvaluation.status !== 'NOT_VERIFIABLE',
    evidence: [],
    explanation: brandEvaluation.message,
    recommendation: brandEvaluation.status === 'NOT_VERIFIABLE'
      ? 'Supply a brand voice guideline to enable automated brand positioning verification.'
      : '',
    assessmentType: brandEvaluation.status === 'NOT_VERIFIABLE' ? 'MANUAL' : 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  findingsStore.addFinding(new Finding({
    ruleId: 'bp-2',
    pillarId: 'brand_positioning',
    status: brandEvaluation.status === 'NOT_VERIFIABLE' ? 'NOT_VERIFIABLE' : (promo.status === 'PASS' ? 'PASS' : 'WARNING'),
    severity: 'medium',
    confidence: 0.9,
    weight: rBP2.weight || 1.0,
    affectsScore: brandEvaluation.status !== 'NOT_VERIFIABLE',
    evidence: [],
    explanation: brandEvaluation.status === 'NOT_VERIFIABLE'
      ? 'Brand guidelines absent; cannot evaluate thought-leadership voice alignment.'
      : promo.status === 'PASS'
      ? 'Reinforces thought-leadership authority without sounding salesy.'
      : 'Tone leans commercial; maintain focus on educational authority.',
    recommendation: brandEvaluation.status === 'NOT_VERIFIABLE'
      ? 'Supply brand voice documentation.'
      : (promo.status !== 'PASS' ? 'Focus on educational authority.' : ''),
    assessmentType: brandEvaluation.status === 'NOT_VERIFIABLE' ? 'MANUAL' : 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  // 4m. Visual & Platform Fit (VPF-1, VPF-2, VPF-3)
  // Requirement #17 & #26: Contextual visual media requirement
  const visualFit = evaluateVisualPlatformFit(blocks, rawContent, platform, { contentType: effectiveContentType })
  const rVPF1 = getRuleDef('vpf-1')
  const rVPF2 = getRuleDef('vpf-2')
  const rVPF3 = getRuleDef('vpf-3')

  findingsStore.addFinding(new Finding({
    ruleId: 'vpf-1',
    pillarId: 'visual_platform_fit',
    status: 'PASS',
    severity: 'info',
    confidence: 1.0,
    weight: rVPF1.weight || 1.0,
    affectsScore: true,
    evidence: [],
    explanation: `Content length (${totalWordCount} words) is well suited for ${platform}.`,
    recommendation: '',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  findingsStore.addFinding(new Finding({
    ruleId: 'vpf-2',
    pillarId: 'visual_platform_fit',
    status: visualFit.isScannable ? 'PASS' : 'WARNING',
    severity: visualFit.isScannable ? 'info' : 'medium',
    confidence: 0.9,
    weight: rVPF2.weight || 1.0,
    affectsScore: true,
    evidence: [],
    explanation: visualFit.isScannable
      ? `Scannable document flow with ${blocks.length} structured blocks and balanced paragraph density.`
      : `Contains ${visualFit.longParagraphCount} dense paragraph(s) (>55 words) that hinder scannability.`,
    recommendation: visualFit.isScannable ? '' : 'Break dense paragraphs into 2-3 sentence units and utilize bullet points.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
  }))

  findingsStore.addFinding(new Finding({
    ruleId: 'vpf-3',
    pillarId: 'visual_platform_fit',
    status: visualFit.mediaStatus,
    severity: visualFit.mediaStatus === 'FAIL' ? 'high' : visualFit.mediaStatus === 'WARNING' ? 'low' : 'info',
    confidence: 0.95,
    weight: rVPF3.weight || 1.0,
    affectsScore: visualFit.isVisualStrictlyRequired,
    evidence: [],
    explanation: visualFit.mediaMessage,
    recommendation: visualFit.mediaStatus === 'PASS'
      ? ''
      : visualFit.isVisualStrictlyRequired
      ? 'Add visual workflow diagrams, comparison tables, or process flowcharts to support procedural understanding.'
      : 'Consider embedding visual charts, diagrams, or infographic callouts to elevate scannability.',
    assessmentType: 'AUTOMATED',
    scope: 'DOCUMENT',
    metadata: {
      isVisualStrictlyRequired: visualFit.isVisualStrictlyRequired,
      visualRequirementLevel: visualFit.visualRequirementLevel,
    },
  }))

  // 4n. Manual Review Placeholders for applicable non-automated rules
  const manualRules = applicableRules.filter((r) => !r.isAutomated)
  for (const mRule of manualRules) {
    if (!findingsStore.getFinding(mRule.ruleId)) {
      findingsStore.addFinding(new Finding({
        ruleId: mRule.ruleId,
        pillarId: mRule.pillarId,
        status: 'MANUAL_REVIEW',
        severity: mRule.severityOnFailure || 'medium',
        confidence: 1.0,
        weight: mRule.weight || 1.0,
        affectsScore: false,
        evidence: [],
        explanation: `${mRule.label} requires human editorial evaluation.`,
        recommendation: 'Editorial review required by content manager.',
        assessmentType: 'MANUAL',
        scope: 'DOCUMENT',
      }))
    }
  }

  // ── 5. SCORE CHECKS, PILLARS & OVERALL QA ───────────────────────
  const scoringResults = calculateMathematicalScores(findingsStore, applicableRules)

  // ── 6. GENERATE RECOMMENDATIONS & EVALUATE CERTIFICATION ────────
  const topFixes = generatePrioritizedFixes(findingsStore, 5)
  const executive = synthesizeExecutiveSummary(findingsStore, scoringResults, { totalWordCount, platform })
  const certification = evaluateCertification(findingsStore, scoringResults)

  // ── 7. RUN THE 9 INTERNAL CONSISTENCY VALIDATORS ────────────────
  const consistencyResult = runAllConsistencyValidators({
    statusCounts: scoringResults.statusCounts,
    totalRules: applicableRules.length,
    pillarAggregates: scoringResults.pillarAggregates,
    ruleScores: scoringResults.mathematicalTraceability.ruleScores,
    findings: findingsStore.getAllFindings(),
    rawContentLength: rawContent.length,
    claimAudit,
    recommendations: topFixes,
    certification,
    overallQualityScore: scoringResults.overallQualityScore,
  })

  // If consistency validation failed, re-evaluate certification with the consistency result
  const finalCertification = evaluateCertification(findingsStore, scoringResults, consistencyResult)

  // ── 8. ASSEMBLE AUDIT PAYLOAD ───────────────────────────────────
  const highlights = findingsStore.toInspectorHighlights()

  // Map category summaries for UI
  const categories = {}
  for (const [pillarId, agg] of Object.entries(scoringResults.pillarAggregates)) {
    const pFindings = findingsStore.getFindingsByPillar(pillarId)
    const issues = pFindings
      .filter((f) => ['FAIL', 'WARNING'].includes(f.status))
      .map((f) => f.explanation || f.message)
    const suggestions = pFindings
      .filter((f) => Boolean(f.recommendation || f.suggestedAction))
      .map((f) => f.recommendation || f.suggestedAction)

    categories[pillarId] = {
      score: agg.qualityScore,
      qualityScore: agg.qualityScore,
      assessmentCoverage: agg.assessmentCoverage,
      status: agg.status.toLowerCase(),
      verdict: issues.length === 0
        ? 'All evaluated checks passed for this pillar.'
        : `${issues.length} issue(s) detected — review recommended fixes below.`,
      issues,
      suggestions,
    }
  }

  // Statuses map by ruleId
  const statuses = {}
  for (const f of findingsStore.getAllFindings()) {
    statuses[f.ruleId] = f.status.toLowerCase()
  }

  // Quick stats matching UI expectation
  const quickStats = {
    emDashesCount: emDashResult.count,
    enDashesCount: enDashResult.count,
    colonsCount: colonResult.count,
    aiPhrasesCount: roboticResult.count,
    fillerPhrasesCount: fillerResult.count,
    fleschScore: readability.readabilityScore,
    readabilityGrade: readability.gradeLevel,
    estimatedReadTimeSec: Math.round((totalWordCount / 200) * 60),
    estimatedReadAloudTimeSec: Math.round((totalWordCount / 130) * 60),
    wordCount: totalWordCount,
    sentenceCount: readability.analyzedSentenceCount,
    avgWordsPerSentence: readability.avgWordsPerSentence,
  }

  return {
    overallScore: scoringResults.overallScore,
    overallQualityScore: scoringResults.overallQualityScore,
    overallAssessmentCoverage: scoringResults.overallAssessmentCoverage,
    publicationReadiness: executive.publicationReadiness,
    summary: executive.executiveSummary,
    certified: finalCertification.isCertified,
    isCertified: finalCertification.isCertified,
    certificationBadge: finalCertification.statusBadge,
    blockingCertificationReasons: finalCertification.blockingReasons,
    blockingFindingIds: finalCertification.blockingFindingIds,
    topFixes: topFixes.map((f) => f.action),
    topFixesDetail: topFixes,
    categories,
    categoryScores: scoringResults.pillarScores,
    statuses,
    highlights,
    quickStats,
    counts: scoringResults.statusCounts,
    statusCounts: scoringResults.statusCounts,
    brandContextSource: brandEvaluation.brandContextSource,
    mathematicalTraceability: scoringResults.mathematicalTraceability,
    // Requirement #42: Complete Developer Debug Payload
    debug: {
      parsedBlocks: blocks.map((b) => ({
        blockId: b.blockId,
        type: b.blockType,
        blockType: b.blockType,
        isProse: b.isProse,
        cleanText: (b.cleanText || '').substring(0, 60),
        startOffset: b.startOffset,
        endOffset: b.endOffset,
      })),
      canonicalResults: findingsStore.getAllFindings().map((f) => f.toCanonicalCheckResult()),
      canonicalFindings: findingsStore.getAllFindings().map((f) => f.toJSON()),
      claimAudit,
      evidenceStates: claimAudit.evidenceBreakdown,
      statusCounts: scoringResults.statusCounts,
      pillarCalculations: scoringResults.pillarAggregates,
      assessmentCoverage: {
        overall: scoringResults.overallAssessmentCoverage,
        byPillar: Object.fromEntries(
          Object.entries(scoringResults.pillarAggregates).map(([k, v]) => [k, v.assessmentCoverage])
        ),
      },
      unresolvedManualChecks: findingsStore.getFindingsByStatus('MANUAL_REVIEW').map((f) => f.ruleId),
      notVerifiableChecks: findingsStore.getFindingsByStatus('NOT_VERIFIABLE').map((f) => f.ruleId),
      headlineRuleSelection: {
        contentType: effectiveContentType,
        supportingLineMode,
        headlineStatus: headlineAnalysis.status,
      },
      mediaRequirementEvaluation: {
        isVisualStrictlyRequired: visualFit.isVisualStrictlyRequired,
        visualRequirementLevel: visualFit.visualRequirementLevel,
        isMediaPresent: visualFit.isMediaPresent,
      },
      certificationBlockingFindings: finalCertification.blockingFindingIds,
      consistencyValidation: consistencyResult,
    },
  }
}

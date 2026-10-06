/**
 * Shapes returned by the EXISTING backend endpoint
 * POST /api/content-qa/analyze (server/src/controllers/contentQaController.js).
 * Only the fields the extension renders are typed; everything is optional
 * because the AI enrichment step is non-fatal on the server.
 */

/** Per-rule statuses as emitted by the engine (lower-cased canonical statuses). */
export type RuleStatus = 'pass' | 'fail' | 'warning' | 'manual_review' | 'not_verifiable' | 'not_applicable'

export interface QaRuleDef {
  id: string
  label: string
  auto?: boolean
  weight?: number
}

export interface QaCategoryDef {
  id: string
  number: number
  label: string
  color?: string
  items: QaRuleDef[]
}

export interface AiCategoryInsight {
  score?: number
  status?: string
  verdict?: string
  issues?: string[]
  suggestions?: string[]
}

export interface QaHighlight {
  type: string
  label?: string
  severity?: 'error' | 'warning' | 'info' | string
  text?: string
  suggestion?: string
  reason?: string
  context?: string
}

export interface QaQuickStats {
  emDashesCount?: number
  enDashesCount?: number
  colonsCount?: number
  aiPhrasesCount?: number
  fillerPhrasesCount?: number
  fleschScore?: number
  readabilityGrade?: string | number
  estimatedReadTimeSec?: number
  wordCount?: number
  sentenceCount?: number
  avgWordsPerSentence?: number
}

export interface QaReport {
  categories?: Record<string, QaCategoryDef>
  statuses?: Record<string, RuleStatus>
  evidence?: Record<string, string>
  suggestions?: Record<string, string>
  highlights?: QaHighlight[]
  /** null = pillar not assessable automatically (manual review / not verifiable) */
  categoryScores?: Record<string, number | null>
  overall?: number
  overallQualityScore?: number
  overallAssessmentCoverage?: number
  statusCounts?: { pass?: number; warning?: number; fail?: number; manual?: number; unverifiable?: number; notApplicable?: number }
  quickStats?: QaQuickStats
  certified?: boolean
  certificationBadge?: string
  blockingCertificationReasons?: string[]
  ai?: {
    overallScore?: number
    publicationReadiness?: string
    summary?: string
    topFixes?: string[]
    categories?: Record<string, AiCategoryInsight>
    himaniProTips?: string[]
  }
}

export interface AnalyzeResponse {
  success: boolean
  qaId?: string | null
  report?: QaReport
  error?: string
}

/** Payload accepted by POST /api/content-qa/analyze (same as the web form). */
export interface AnalyzeRequest {
  content: string
  title?: string
  targetKeyword?: string
  metaDescription?: string
  urlSlug?: string
  platform: 'website'
  targetAudience?: string
  contentTemplate: 'blog' | 'landing_page'
}

export interface DeviceStatus {
  usageCount: number
  limit: number
  remaining?: number
  isBlocked: boolean
  email?: string | null
}

/** Stored per URL in chrome.storage.session so reopening the panel restores it. */
export interface StoredResult {
  url: string
  analyzedAt: string
  report: QaReport
  qaId?: string | null
  truncated: boolean
  sentChars: number
}

/**
 * Programmatic Content QA Analyzer
 * 
 * Powered by the Canonical Content QA Engine:
 * PARSE CONTENT -> UNDERSTAND STRUCTURE -> DETERMINE RULES -> EXECUTE RULES
 * -> CANONICAL FINDINGS -> SCORE PILLARS -> SCORE OVERALL -> RECOMMENDATIONS -> CERTIFY
 */

import { executeContentQaAudit } from './contentQa/contentQaEngine.js'
import { QA_PILLARS_CONFIG, QA_RULES_CATALOG } from './contentQa/qaRulesConfig.js'

// Backward-compatible category map for UI and PDF export
export const HIMANI_CATEGORIES = {
  tone_style_ai: {
    id: 'tone_style_ai',
    number: 1,
    label: 'Tone, Style, and AI Check',
    iconKey: 'sparkles',
    color: '#3B82F6',
    items: [
      { id: 'ts-1', label: 'Is the tone human, crisp, and conversational?', auto: true, weight: 1.2 },
      { id: 'ts-2', label: 'No robotic phrases, no fluff, no clichés.', auto: true, weight: 1.5 },
      { id: 'ts-3', label: 'No em dashes in editorial prose.', auto: true, weight: 1.5 },
      { id: 'ts-5', label: 'No colons in editorial prose.', auto: true, weight: 1.5 },
      { id: 'ts-4', label: 'Sentences clear, complete, not abrupt.', auto: true, weight: 1.0 },
    ],
  },
  read_aloud: {
    id: 'read_aloud',
    number: 2,
    label: 'Read Aloud Test',
    iconKey: 'volume',
    color: '#8B5CF6',
    items: [
      { id: 'ra-1', label: 'If read out loud, does it sound natural?', auto: true, weight: 1.2 },
      { id: 'ra-2', label: 'Does it hold attention, sound confident, and flow smoothly?', auto: false, weight: 1.0 },
      { id: 'ra-3', label: 'Can any line be shortened without losing meaning?', auto: true, weight: 1.0 },
    ],
  },
  audience_alignment: {
    id: 'audience_alignment',
    number: 3,
    label: 'Audience Alignment',
    iconKey: 'users',
    color: '#EC4899',
    items: [
      { id: 'aud-1', label: 'Is this clearly written for one audience?', auto: false, weight: 1.2 },
      { id: 'aud-2', label: 'Does it fulfill the purpose of searching & reading?', auto: true, weight: 1.0 },
      { id: 'aud-3', label: 'Would this make them pause and read?', auto: false, weight: 1.0 },
    ],
  },
  eeat_check: {
    id: 'eeat_check',
    number: 4,
    label: 'E‑E‑A‑T Check',
    iconKey: 'award',
    color: '#F59E0B',
    items: [
      { id: 'eat-1', label: 'Is lived experience, observation, or real context added?', auto: true, weight: 1.4 },
      { id: 'eat-2', label: 'Does the content explain why or how, not just what?', auto: true, weight: 1.2 },
      { id: 'eat-3', label: 'Does it show you are a thought-leader in this niche?', auto: false, weight: 1.0 },
    ],
  },
  insight_first: {
    id: 'insight_first',
    number: 5,
    label: 'Insight First',
    iconKey: 'zap',
    color: '#10B981',
    items: [
      { id: 'ins-1', label: 'Does the content start with an insight, observation, or hook, and not a long setup?', auto: true, weight: 1.5 },
      { id: 'ins-2', label: 'Does it immediately come to the point?', auto: true, weight: 1.2 },
    ],
  },
  meaning_crispness: {
    id: 'meaning_crispness',
    number: 6,
    label: 'Meaning & Crispness Test',
    iconKey: 'scissors',
    color: '#06B6D4',
    items: [
      { id: 'mc-1', label: 'Every line adds new or valuable info, clarity, or perspective for that one audience.', auto: false, weight: 1.2 },
      { id: 'mc-2', label: 'No filler lines. No "nice to have" sentences.', auto: true, weight: 1.4 },
    ],
  },
  zero_offensiveness: {
    id: 'zero_offensiveness',
    number: 7,
    label: 'Zero Offensiveness Rule',
    iconKey: 'shield-check',
    color: '#6366F1',
    items: [
      { id: 'off-1', label: 'Are we not undermining any profession, system, academy, or industry?', auto: false, weight: 1.0 },
      { id: 'off-2', label: 'Is it polished and respectful, even when talking about gaps or competitors?', auto: false, weight: 1.0 },
    ],
  },
  brand_positioning: {
    id: 'brand_positioning',
    number: 8,
    label: 'Relevance to Brand Positioning',
    iconKey: 'compass',
    color: '#D97706',
    items: [
      { id: 'bp-1', label: "Is the message aligned with the brand's voice?", auto: false, weight: 1.0 },
      { id: 'bp-2', label: "Are we reinforcing authority, sharing the brand's experience & expertise without sounding salesy?", auto: true, weight: 1.2 },
    ],
  },
  structure_check: {
    id: 'structure_check',
    number: 9,
    label: 'Structure Check',
    iconKey: 'layout',
    color: '#14B8A6',
    items: [
      { id: 'str-1', label: 'Is the headline strong & USP-driven?', auto: true, weight: 1.2 },
      { id: 'str-2', label: 'Is the supporting line relevant?', auto: true, weight: 1.0 },
      { id: 'str-3', label: 'Is the flow logical and tight?', auto: true, weight: 1.2 },
      { id: 'str-4', label: 'No unnecessary past tense unless necessary.', auto: true, weight: 1.0 },
    ],
  },
  no_direct_sales_pitches: {
    id: 'no_direct_sales_pitches',
    number: 10,
    label: 'No direct sales pitches',
    iconKey: 'ban',
    color: '#EF4444',
    items: [
      { id: 'sp-1', label: 'Crisp storytelling without exaggeration.', auto: true, weight: 1.2 },
      { id: 'sp-2', label: 'Professional, subtle drama.', auto: false, weight: 1.0 },
      { id: 'sp-3', label: 'No self-promotion unless asked.', auto: true, weight: 1.2 },
      { id: 'sp-4', label: 'No overemphasis on milestones (e.g., 10 years).', auto: true, weight: 1.2 },
    ],
  },
  compliance_risk: {
    id: 'compliance_risk',
    number: 11,
    label: 'Compliance & Risk Check',
    iconKey: 'alert-triangle',
    color: '#F97316',
    items: [
      { id: 'comp-1', label: 'No claims that trigger compliance (e.g., pharma, medical).', auto: true, weight: 1.5 },
      { id: 'comp-2', label: 'No overstatements for industries where neutrality matters (finance, telecom, etc.).', auto: true, weight: 1.5 },
    ],
  },
  visual_platform_fit: {
    id: 'visual_platform_fit',
    number: 12,
    label: 'Visual + Platform Fit',
    iconKey: 'monitor',
    color: '#84CC16',
    items: [
      { id: 'vpf-1', label: 'Does it suit the platform (Website, LinkedIn, newsletter, etc.)?', auto: true, weight: 1.0 },
      { id: 'vpf-2', label: 'Is it scannable (bullets, short paras, hooks)?', auto: true, weight: 1.4 },
      { id: 'vpf-3', label: 'Does it have enough media such as images, graphs, infographics, video embeds, etc.?', auto: true, weight: 1.0 },
    ],
  },
}

/**
 * Main Programmatic Content QA Analysis Function
 */
export function analyzeContentQA(
  content,
  title = '',
  targetKeyword = '',
  metaDescription = '',
  urlSlug = '',
  platform = 'website',
  options = {}
) {
  const audit = executeContentQaAudit({
    content,
    title,
    targetKeyword,
    platform,
    contentType: options.contentType || options.contentTemplate || 'blog',
    contentTemplate: options.contentTemplate || options.contentType || 'blog',
    supportingLineMode: options.supportingLineMode || 'recommended',
    insightFirstScope: options.insightFirstScope || 'DOCUMENT_INTRO',
    targetAudience: options.targetAudience,
    contentGoal: options.contentGoal,
    brandProfile: options.brandProfile,
    brandVoice: options.brandVoice,
  })

  // Format evidence & suggestions map by ruleId
  const evidence = {}
  const suggestions = {}
  for (const f of audit.debug.canonicalFindings) {
    evidence[f.ruleId] = f.explanation || f.message
    if (f.recommendation || f.suggestedAction) {
      suggestions[f.ruleId] = f.recommendation || f.suggestedAction
    }
  }

  return {
    categories: HIMANI_CATEGORIES,
    statuses: audit.statuses,
    evidence,
    suggestions,
    highlights: audit.highlights,
    catScores: audit.categoryScores,
    overall: audit.overallScore,
    total: audit.counts.totalRules,
    passed: audit.counts.pass,
    failed: audit.counts.fail,
    warnings: audit.counts.warning,
    quickStats: audit.quickStats,
    counts: audit.counts,
    certified: audit.certified,
    certificationBadge: audit.certificationBadge,
    blockingCertificationReasons: audit.blockingCertificationReasons,
    brandContextSource: audit.brandContextSource,
    mathematicalTraceability: audit.mathematicalTraceability,
    meta: {
      wordCount: audit.quickStats.wordCount,
      sentenceCount: audit.quickStats.sentenceCount,
      avgWordsPerSentence: audit.quickStats.avgWordsPerSentence,
      flesch: audit.quickStats.fleschScore,
      charCount: (content || '').length,
      platform,
    },
    // Raw canonical audit object
    canonicalAudit: audit,
  }
}

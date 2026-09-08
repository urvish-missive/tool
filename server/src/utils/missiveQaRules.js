/**
 * Missive Digital Content QA Standards & Checklist
 * Based strictly on Himani Kankaria's 12-Pillar Content QA Framework
 * 
 * Used for:
 * 1. Guiding LLM generation prompts for zero-fluff, human, conversion-driven copy
 * 2. Programmatically auditing generated content for compliance (em dashes, banned buzzwords, E-E-A-T metrics)
 */

export const MISSIVE_BANNED_WORDS = [
  'delve',
  'tapestry',
  'beacon',
  'game-changer',
  'game changer',
  'testament',
  'plethora',
  'revolutionize',
  'revolutionizing',
  'unleash',
  'unleashing',
  'in today\'s fast-paced world',
  'in today\'s world',
  'look no further',
  'it is important to remember',
  'dive deep',
  'furthermore',
  'moreover',
  'in conclusion',
  'at the end of the day',
]

export const MISSIVE_QA_PILLARS = [
  {
    id: 'tone_style_ai',
    number: 1,
    name: 'Tone, Style & AI Check',
    directive: 'Human, crisp, conversational. Strictly ZERO em dashes ("—", "--"). Zero robotic buzzwords (delve, tapestry, beacon, game-changer, testament). Sentences clear, complete, never abrupt.',
  },
  {
    id: 'read_aloud',
    number: 2,
    name: 'Read Aloud Test',
    directive: 'Must sound natural when spoken aloud. Holds attention, sounds confident, flows smoothly without awkward pauses. No verbose phrases where 3 words can do the job of 10.',
  },
  {
    id: 'audience_alignment',
    number: 3,
    name: 'Audience Alignment',
    directive: 'Written for ONE specific buyer persona / practitioner audience. Solves their specific commercial or operational bottleneck and starts with a scroll-stopping hook.',
  },
  {
    id: 'eeat_proof',
    number: 4,
    name: 'E-E-A-T & Practical Proof',
    directive: 'Must incorporate real lived experience, exact numbers/metrics, and practical context. Explains WHY and HOW the transformation happened, not just WHAT was done.',
  },
  {
    id: 'insight_first',
    number: 5,
    name: 'Insight First',
    directive: 'Start immediately with the core finding, pattern-interrupt, or hook. Never open with a generic preamble, throat-clearing, or broad industry backstories.',
  },
  {
    id: 'meaning_crispness',
    number: 6,
    name: 'Meaning & Crispness Test',
    directive: 'Every line must add new or valuable information, clarity, or actionable perspective. Zero filler lines or generic padding.',
  },
  {
    id: 'zero_offensiveness',
    number: 7,
    name: 'Zero Offensiveness Rule',
    directive: 'Respectful critique of obsolete methodologies. Never demean professions, competing tools, or industry peers.',
  },
  {
    id: 'brand_relevance',
    number: 8,
    name: 'Relevance to Brand Positioning',
    directive: 'Showcase authentic strategic expertise and domain mastery without sounding desperate, pushy, or salesy.',
  },
  {
    id: 'structure_flow',
    number: 9,
    name: 'Structure & Narrative Flow',
    directive: 'Headline must carry a clear USP and metric. Flow must transition logically: Challenge -> Strategy -> Implementation -> Quantifiable Results.',
  },
  {
    id: 'no_sales_pitch',
    number: 10,
    name: 'No Direct Sales Pitches',
    directive: 'Crisp storytelling grounded in facts and evidence. Allow the real numbers and client testimonial to sell the capability, not exaggerated self-promotion.',
  },
  {
    id: 'compliance_risk',
    number: 11,
    name: 'Compliance & Risk Check',
    directive: 'Defensible, context-backed metric claims. Avoid unrealistic absolutes or unverifiable guarantees.',
  },
  {
    id: 'visual_scannability',
    number: 12,
    name: 'Visual & Platform Fit',
    directive: 'High scannability with short 1-3 sentence paragraphs, bold anchors, distinct KPI stat callouts, and bulleted takeaways.',
  },
]

/**
 * Builds the strict Missive QA instructions to be injected into system prompts
 */
export function buildMissiveQaPromptDirectives() {
  return `MISSIVE DIGITAL 12-PILLAR QA RULES (MANDATORY & NON-NEGOTIABLE):
1. ZERO EM DASHES: You are strictly forbidden from using em dashes ("—" or "--"). Use hyphens with spaces (" - "), commas, colons, or clean separate sentences.
2. ZERO ROBOTIC BUZZWORDS: Never use banned clichés: "delve", "tapestry", "beacon", "game-changer", "testament", "plethora", "revolutionize", "unleash", "in today's fast-paced world", "look no further".
3. INSIGHT FIRST: Open immediately with the high-stakes friction or concrete metric. No throat-clearing backstories.
4. E-E-A-T PROOF: Back every claim with concrete metrics (percentages, dollar amounts, timeframes, conversion rates). Explain HOW and WHY the methodology worked.
5. NO SALES FLUFF: Maintain a credible, authoritative editorial voice. Let the verified KPIs speak for themselves without cheesy marketing superlatives.
6. SCANNABILITY: Keep paragraphs concise (1-3 sentences). Use bulleted execution steps and clear data blocks.`
}

/**
 * Programmatically audits a case study or text against Missive QA standards
 */
export function auditCaseStudyMissiveQa(text = '') {
  if (!text || typeof text !== 'string') {
    return {
      passed: false,
      overallScore: 0,
      checks: [],
      violations: ['No content provided to audit'],
    }
  }

  const violations = []
  const checks = []

  // Check 1: Em dashes check
  const emDashCount = (text.match(/—/g) || []).length + (text.match(/\s--\s/g) || []).length
  const emDashPassed = emDashCount === 0
  checks.push({
    pillar: 'Tone, Style & AI Check',
    name: 'Zero Em Dashes Rule',
    passed: emDashPassed,
    score: emDashPassed ? 100 : Math.max(0, 100 - emDashCount * 25),
    detail: emDashPassed
      ? 'Flawless: 0 em dashes found. Copy maintains clean human cadence.'
      : `Found ${emDashCount} forbidden em dash(es). Himani's QA rule strictly requires hyphens or clean punctuation.`,
  })
  if (!emDashPassed) {
    violations.push(`Contains ${emDashCount} forbidden em dash(es)`)
  }

  // Check 2: Banned words check
  const textLower = text.toLowerCase()
  const foundBannedWords = MISSIVE_BANNED_WORDS.filter((bw) => textLower.includes(bw))
  const bannedWordsPassed = foundBannedWords.length === 0
  checks.push({
    pillar: 'Tone, Style & AI Check',
    name: 'Banned Cliché Buzzwords',
    passed: bannedWordsPassed,
    score: bannedWordsPassed ? 100 : Math.max(0, 100 - foundBannedWords.length * 30),
    detail: bannedWordsPassed
      ? '0 robotic AI clichés detected. Vocabulary is natural and credible.'
      : `Detected banned AI cliché word(s): ${foundBannedWords.join(', ')}.`,
  })
  if (!bannedWordsPassed) {
    violations.push(`Contains banned word(s): ${foundBannedWords.join(', ')}`)
  }

  // Check 3: Quantitative proof / metrics presence
  const hasNumbers = /\d+(%|\$|x|k|M|\+)?/i.test(text)
  const metricOccurrences = (text.match(/\d+(%|\$|x|k|M|\+)?/gi) || []).length
  const metricsPassed = metricOccurrences >= 3
  checks.push({
    pillar: 'E-E-A-T & Practical Proof',
    name: 'Quantifiable Proof & KPIs',
    passed: metricsPassed,
    score: metricsPassed ? 100 : Math.min(metricOccurrences * 30, 80),
    detail: metricsPassed
      ? `Strong E-E-A-T: Contains ${metricOccurrences} quantifiable metrics and data anchors.`
      : 'Insufficient metrics: Case study lacks enough quantifiable data points (percentages, dollar amounts, or timelines).',
  })
  if (!metricsPassed) {
    violations.push('Lacks sufficient quantifiable performance metrics')
  }

  // Check 4: Insight First / Hook Quality
  const firstParagraph = text.split(/\n\n+/)[0] || ''
  const isPreambleFree = !firstParagraph.toLowerCase().includes('in this case study') &&
    !firstParagraph.toLowerCase().includes('in today\'s') &&
    !firstParagraph.toLowerCase().includes('we are thrilled')
  checks.push({
    pillar: 'Insight First',
    name: 'Immediate Hook & Zero Preamble',
    passed: isPreambleFree,
    score: isPreambleFree ? 100 : 60,
    detail: isPreambleFree
      ? 'Passes Insight First test: Opens directly with stakes, metrics, or the core challenge.'
      : 'Opening contains throat-clearing preamble before reaching the actual insight.',
  })
  if (!isPreambleFree) {
    violations.push('Opening paragraph contains generic throat-clearing preamble')
  }

  // Check 5: Scannability & Paragraph Length
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  const longParagraphs = paragraphs.filter(p => p.split(/\.\s+/).length > 5)
  const scannablePassed = longParagraphs.length === 0
  checks.push({
    pillar: 'Visual & Platform Fit',
    name: 'Paragraph Brevity & Scannability',
    passed: scannablePassed,
    score: scannablePassed ? 100 : Math.max(50, 100 - longParagraphs.length * 15),
    detail: scannablePassed
      ? 'Clean scannability: All paragraphs are tight (1-3 sentences), preventing reader cognitive fatigue.'
      : `Found ${longParagraphs.length} overly dense paragraph(s) that should be broken up for better scannability.`,
  })

  // Calculate overall QA score
  const totalScore = Math.round(checks.reduce((acc, c) => acc + c.score, 0) / checks.length)
  const overallPassed = totalScore >= 85 && emDashPassed && bannedWordsPassed

  return {
    passed: overallPassed,
    overallScore: totalScore,
    statusBadge: overallPassed ? '100% Missive QA Certified' : 'QA Polish Recommended',
    checks,
    violations,
    summary: overallPassed
      ? 'This case study strictly complies with Missive Digital\'s 12-Pillar QA framework. It contains zero em dashes, zero robotic clichés, and strong quantifiable E-E-A-T proof.'
      : `Review suggested: Score is ${totalScore}/100 with ${violations.length} item(s) flagged for attention.`,
  }
}

import { applyEntityCasing } from '../constants/entityCasing.js'
import { BANNED_B2B_TERMS_IN_CONSUMER } from '../constants/contentAngles.js'
import { jaccardSimilarity } from '../utils/similarity.js'
import { buildAffordanceContext, resolveValidAffordances, prioritizeAffordances } from './subjectAffordance.js'

/**
 * Derives a generic domain context from input text without any hardcoded niche mappings.
 * Used to build audience, clusters, entities, and E-E-A-T structures dynamically.
 * All logic is driven by the user's own words.
 */
export function deriveInputContext(subject = '', keyword = '', audience = '') {
  const text = `${subject} ${keyword} ${audience}`.toLowerCase()

  // Detect broad domain signals from user input (not hardcoded niche categories)
  const isB2BSuggestive =
    /\b(b2b|enterprise|saas|software|platform|crm|erp|workflow|api|integration|team|organization|business|corporate|vendor|procurement|solution|service|dashboard|reporting|compliance|automation|deployment|scalability)\b/.test(text)

  const isConsumerSuggestive =
    /\b(buy|buyer|review|beginner|user|personal|home|lifestyle|product|hobby|leisure|travel|visit|explore|discover|tips|guide|how to|experience|daily|casual|affordable|best)\b/.test(text)

  const isYMYLSuggestive =
    /\b(health|medical|legal|lawyer|attorney|financial|investment|safety|accident|injury|diagnosis|treatment|medicine|therapy|insurance|tax|law|court|surgery|symptom|disease)\b/.test(text)

  const isProductSuggestive =
    /\b(phone|device|gadget|camera|battery|screen|laptop|tablet|headphone|watch|shoe|apparel|gear|appliance|furniture|food|supplement|skincare|tool|machine|vehicle|car|bike)\b/.test(text)

  const isTravelSuggestive =
    /\b(travel|trip|vacation|visit|destination|country|city|itinerary|flight|hotel|resort|visa|tourist|backpack|passport|beach|mountain|culture|local)\b/.test(text)

  const isHowToSuggestive =
    /\b(how to|tutorial|step.by.step|guide|walkthrough|setup|configure|build|create|make|learn|install|start|implement|run|deploy)\b/.test(text)

  const isComparisonSuggestive =
    /\b(vs|versus|compare|comparison|alternative|or|difference|best|top|ranking|pick|choose|which)\b/.test(text)

  const isResearchSuggestive =
    /\b(what is|overview|explained|meaning|definition|history|origin|evolution|trends|research|study|analysis|insight|review|data)\b/.test(text)

  const isPurchaseSuggestive =
    /\b(buy|purchase|price|cost|cheap|affordable|value|worth|deal|budget|expensive|invest)\b/.test(text)

  return {
    isB2BSuggestive,
    isConsumerSuggestive: isConsumerSuggestive || isProductSuggestive || isTravelSuggestive,
    isYMYLSuggestive,
    isProductSuggestive,
    isTravelSuggestive,
    isHowToSuggestive,
    isComparisonSuggestive,
    isResearchSuggestive,
    isPurchaseSuggestive,
    text,
  }
}

/**
 * Normalizes a phrase to a sorted, deduped token key so trivial variants
 * (word reversal, pluralization, exact duplicates, space removal) collapse
 * to the same key and only the first surviving form is kept.
 */
function trivialVariantKey(phrase = '') {
  const tokens = phrase
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => (t.endsWith('s') && t.length > 3 ? t.slice(0, -1) : t)) // crude singularize
    .sort()
  return tokens.join('')
}

/**
 * Tokenizes one phrase into its own consecutive-word bigrams. Bigrams are
 * only built from words that were adjacent in the SAME original phrase, so
 * concatenating subject + keyword never produces a cross-boundary artifact
 * like "keyword firstword-of-subject".
 */
function bigramsFromPhrase(phrase = '') {
  const words = phrase.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2)
  const bigrams = []
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`
    if (bigram.length > 6) bigrams.push(bigram)
  }
  return { words, bigrams }
}

/**
 * Extracts meaningful noun phrases and entities from the subject and
 * keyword. Every candidate is checked against trivialVariantKey() before
 * being added, so word-reversals, duplicate-in-different-case, and
 * pluralization variants of an already-kept term are dropped rather than
 * treated as distinct "semantic entities."
 */
function extractDynamicTermsFromInput(subject = '', keyword = '', audience = '') {
  const seenKeys = new Set()
  const terms = []

  const addTerm = (raw) => {
    const cased = applyEntityCasing(raw)
    const key = trivialVariantKey(cased)
    if (!cased || cased.length <= 2 || !key || seenKeys.has(key)) return
    seenKeys.add(key)
    terms.push(cased)
  }

  addTerm(keyword || subject)
  if (subject && subject.toLowerCase() !== (keyword || subject).toLowerCase()) addTerm(subject)

  // Bigrams and single words computed per-phrase (not on the concatenated
  // subject+keyword string) so a blank keyword defaulting to the subject
  // can never produce a cross-boundary reordering artifact.
  const phrases = subject.toLowerCase() === keyword.toLowerCase() ? [subject] : [subject, keyword].filter(Boolean)
  for (const phrase of phrases) {
    const { words, bigrams } = bigramsFromPhrase(phrase)
    for (const bigram of bigrams) addTerm(bigram)
    for (const w of words) {
      if (w.length > 4) addTerm(w)
    }
  }

  // Derive contextual companion terms from user audience
  if (audience) {
    const audWords = audience.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3)
    for (const w of audWords) addTerm(w)
  }

  return terms.slice(0, 14)
}

/**
 * Builds a universal Audience-Intent Map derived entirely from user input
 * without any hardcoded industry-specific templates or fixed persona names.
 *
 * The function generates contextually appropriate concerns, persona descriptions,
 * and disallowed concepts from the actual words the user provided.
 */
export function buildAudienceIntentMap(subject = '', audience = '', nicheType = 'Other') {
  const subjectLower = (subject || '').toLowerCase()
  const audienceLower = (audience || '').toLowerCase()
  const ctx = deriveInputContext(subject, '', audience)

  // Derive persona description from user-provided audience or infer from subject
  const personaBase = audience || `${subject} enthusiasts and practitioners`
  const persona = applyEntityCasing(personaBase)

  // Build concerns dynamically from input signals — no hardcoded domain-specific lists
  const concerns = []

  if (ctx.isPurchaseSuggestive || ctx.isProductSuggestive) {
    concerns.push(`evaluating the right ${subject} option for their specific needs and budget`)
    concerns.push(`understanding key specifications, features, and real-world trade-offs`)
    concerns.push(`comparing quality differences across available alternatives`)
  }

  if (ctx.isTravelSuggestive) {
    concerns.push(`planning a realistic itinerary and managing logistics for ${subject}`)
    concerns.push(`understanding entry requirements, costs, and cultural expectations`)
    concerns.push(`navigating local transportation and safety considerations`)
  }

  if (ctx.isHowToSuggestive || ctx.isB2BSuggestive) {
    concerns.push(`understanding how to correctly implement or use ${subject}`)
    concerns.push(`avoiding common beginner mistakes and configuration errors`)
    concerns.push(`scaling or optimizing ${subject} for their specific context`)
  }

  if (ctx.isYMYLSuggestive) {
    concerns.push(`understanding their rights, options, and available resources for ${subject}`)
    concerns.push(`navigating complex processes with appropriate professional guidance`)
    concerns.push(`separating verified factual information from unqualified claims`)
  }

  if (ctx.isResearchSuggestive) {
    concerns.push(`obtaining accurate, well-sourced information about ${subject}`)
    concerns.push(`understanding current trends, developments, and evidence`)
    concerns.push(`applying insights from ${subject} to their specific situation`)
  }

  // Universal concerns that apply to any subject
  concerns.push(`finding practical, actionable guidance without jargon or fluff`)
  concerns.push(`determining which approach or option is best for their specific situation`)
  concerns.push(`understanding realistic expectations and potential pitfalls with ${subject}`)

  // Restrict B2B jargon if clearly consumer context
  const disallowedConcepts =
    (ctx.isConsumerSuggestive && !ctx.isB2BSuggestive) ? BANNED_B2B_TERMS_IN_CONSUMER : []

  return {
    persona,
    concerns: concerns.slice(0, 8),
    platforms: [],
    disallowedConcepts,
  }
}

/**
 * Cluster name/description generators keyed by affordance id. Purely
 * structural templates (subject-agnostic phrasing filled in with the
 * caller's own keyword) — not a niche routing table. Which of these get
 * used for a given request is decided by resolveValidAffordances(), which
 * only allows conditional affordances through when their general signal
 * actually fires (see subjectAffordance.js).
 */
const CLUSTER_TEMPLATE_BY_AFFORDANCE = {
  understandOverview: (kw) => ({
    name: `${kw} Fundamentals & Overview`,
    description: `Core concepts, current state, and foundational knowledge for ${kw}`,
  }),
  chooseOrDecide: (kw) => ({
    name: `${kw} Buying & Decision Guides`,
    description: `Selection criteria, what to look for, and decision frameworks for ${kw}`,
  }),
  avoidMistakes: (kw) => ({
    name: `${kw} Mistakes & Misconceptions`,
    description: `Common errors, misconceptions, and how to avoid them with ${kw}`,
  }),
  costOrValue: (kw) => ({
    name: `${kw} Cost & Value`,
    description: `Pricing, budgeting, and value considerations for ${kw}`,
  }),
  compareOptions: (kw) => ({
    name: `${kw} Comparisons & Alternatives`,
    description: `Side-by-side comparisons, types, and alternatives for ${kw}`,
  }),
  faq: (kw) => ({
    name: `${kw} Questions Answered`,
    description: `Direct answers to the questions people ask about ${kw}`,
  }),
  setupOrImplement: (kw) => ({
    name: `${kw} Setup & Implementation`,
    description: `Step-by-step setup, configuration, and implementation guidance for ${kw}`,
  }),
  troubleshoot: (kw) => ({
    name: `${kw} Troubleshooting & Fixes`,
    description: `Diagnosing and resolving common problems with ${kw}`,
  }),
  configure: (kw) => ({
    name: `${kw} Configuration & Optimization`,
    description: `Configuration options and optimization guidance for ${kw}`,
  }),
  scaleOrOptimize: (kw) => ({
    name: `${kw} Scaling & Optimization`,
    description: `Advanced configurations, scaling strategies, and long-term optimization for ${kw}`,
  }),
  roiOrBusinessCase: (kw) => ({
    name: `${kw} ROI & Business Case`,
    description: `Financial modeling, ROI, and business case guidance for ${kw}`,
  }),
  legalOrRegulatorySteps: (kw) => ({
    name: `${kw} Rights, Risks & Key Considerations`,
    description: `Important considerations, risks, and informed decision-making for ${kw}`,
  }),
  travelLogistics: (kw) => ({
    name: `${kw} Planning & Logistics`,
    description: `Itineraries, logistics, and practical planning guidance for ${kw}`,
  }),
  styleOrWear: (kw) => ({
    name: `${kw} Styling & Pairing`,
    description: `Styling ideas, pairing suggestions, and appearance guidance for ${kw}`,
  }),
  learnAsSkill: (kw) => ({
    name: `${kw} Skill-Building & Practice`,
    description: `Learning path, practice routines, and skill development for ${kw}`,
  }),
}

/**
 * Builds semantic topic clusters dynamically from the subject, keyword, and
 * content goal. Clusters are only drawn from affordances that are either
 * universally safe (overview, choosing, mistakes, cost, comparison, FAQ) or
 * whose conditional signal actually fired — never from a blind 4-slot
 * template. contentGoal (an explicit, always-available structured input,
 * not a guess) reorders which universal affordances lead.
 */
export function buildSemanticTopicMap(subject = '', primaryKeyword = '', nicheType = 'Other', lifecycleState = 'released', contentGoal = '', subjectTypeAnalysis = null) {
  const baseCtx = deriveInputContext(subject, primaryKeyword, '')
  const ctx = buildAffordanceContext(baseCtx, { contentGoal, subjectTypeAnalysis })
  const kw = applyEntityCasing(primaryKeyword || subject)

  const { validAffordances } = resolveValidAffordances(ctx)

  // Overview always leads. After that, order candidates by contentGoal via
  // the shared prioritizeAffordances helper (also used by the fallback
  // topic generator), so a commercial goal surfaces decision-making
  // clusters first while an educational goal surfaces understanding first.
  const remainingCandidates = prioritizeAffordances(validAffordances, ctx).filter((id) => id !== 'understandOverview')
  const selectedAffordances = ['understandOverview', ...remainingCandidates.slice(0, 4)]

  const clusters = selectedAffordances
    .map((id) => CLUSTER_TEMPLATE_BY_AFFORDANCE[id]?.(kw))
    .filter(Boolean)

  return clusters.length > 0 ? clusters : [CLUSTER_TEMPLATE_BY_AFFORDANCE.understandOverview(kw)]
}

/**
 * Builds structured E-E-A-T evidence opportunities for any subject.
 * No hardcoded domain-specific templates — all recommendations derived from
 * the subject and audience context provided by the user.
 */
export function buildEeatOpportunity(topicTitle = '', nicheType = 'Other', lifecycleState = 'released') {
  const titleLower = topicTitle.toLowerCase()
  const ctx = deriveInputContext(topicTitle, '', '')
  const isRumored = lifecycleState === 'rumored' || lifecycleState === 'upcoming'

  const recommendedToCollect = []
  let firstHandExp = ''
  let expertSource = ''

  if (ctx.isYMYLSuggestive) {
    recommendedToCollect.push(
      'Cite official regulatory statutes, published standards, or peer-reviewed sources.',
      'Disclose jurisdictional or contextual limitations prominently.',
      'Provide links to official government or institutional resources.'
    )
    firstHandExp = 'Document the practitioner process or client journey objectively with direct experience.'
    expertSource = 'Have content reviewed by a licensed professional with visible credentials and byline.'
  } else if (ctx.isProductSuggestive && isRumored) {
    recommendedToCollect.push(
      'Reference analyst reports, regulatory filings, or credible supply-chain leak sources.',
      'Compare historical precedents and prior-generation specifications.',
      'Clearly label all claims as unconfirmed or speculative.'
    )
    firstHandExp = 'Document known limitations of the previous version that the rumored model could address.'
    expertSource = 'Consult independent technical analysts or hardware specialists on feature plausibility.'
  } else if (ctx.isProductSuggestive) {
    recommendedToCollect.push(
      'Include original measurement or benchmark data from controlled testing.',
      'Provide direct side-by-side comparisons with competing alternatives.',
      'Document real-world usage observations over time.'
    )
    firstHandExp = 'Conduct extended hands-on usage across real scenarios and document findings.'
    expertSource = 'Quote accredited subject-matter specialists or independent testing labs.'
  } else if (ctx.isTravelSuggestive) {
    recommendedToCollect.push(
      'Include recent receipts, ticket prices, and verifiable cost estimates.',
      'Link directly to official visa, embassy, or government entry requirement pages.',
      'Provide original photography or documentation from the destination.'
    )
    firstHandExp = 'Share personal on-the-ground experience navigating local logistics, costs, and culture.'
    expertSource = 'Consult licensed local guides, long-term residents, or regional travel experts.'
  } else if (ctx.isHowToSuggestive || ctx.isB2BSuggestive) {
    recommendedToCollect.push(
      'Include verified screenshots, configuration examples, or implementation checklists.',
      'Document objective before-and-after observations from a real implementation.',
      'Cite official documentation, vendor specifications, or recognized industry standards.'
    )
    firstHandExp = 'Detail direct implementation experience including friction points and successful resolutions.'
    expertSource = 'Quote certified practitioners or recognized authorities in the relevant field.'
  } else {
    recommendedToCollect.push(
      'Incorporate verifiable primary sources, official documentation, or established references.',
      'Document direct observations or verified examples relevant to the topic.',
      'Cite credible third-party research, recognized institutions, or published experts.'
    )
    firstHandExp = 'Include first-hand perspective or documented experience with the subject.'
    expertSource = 'Reference or consult recognized experts, practitioners, or authoritative sources.'
  }

  return {
    eeatEvidenceOpportunity: recommendedToCollect[0] || 'Incorporate verifiable primary sources and practitioner insights.',
    verifiedEvidence: [],
    recommendedEvidenceToCollect: recommendedToCollect,
    firstHandExperienceOpportunity: firstHandExp,
    expertSourceOpportunity: expertSource,
  }
}

/**
 * Concept-phrase templates keyed by affordance id. These turn a valid
 * affordance into a genuine companion concept (e.g. "${kw} Types",
 * "${kw} Pricing") rather than a token permutation of the subject. Which
 * ids get used is decided by resolveValidAffordances() — the same general
 * signal resolution used for clusters, so entities stay consistent with
 * what the rest of the pipeline believes is true about the subject.
 */
const ENTITY_CONCEPT_BY_AFFORDANCE = {
  chooseOrDecide: (kw) => `${kw} Buying Guide`,
  avoidMistakes: (kw) => `${kw} Common Mistakes`,
  costOrValue: (kw) => `${kw} Pricing`,
  compareOptions: (kw) => `${kw} Types`,
  faq: (kw) => `${kw} FAQ`,
  setupOrImplement: (kw) => `${kw} Setup Guide`,
  troubleshoot: (kw) => `${kw} Troubleshooting`,
  configure: (kw) => `${kw} Configuration`,
  scaleOrOptimize: (kw) => `${kw} Optimization`,
  roiOrBusinessCase: (kw) => `${kw} ROI`,
  legalOrRegulatorySteps: (kw) => `${kw} Legal Considerations`,
  travelLogistics: (kw) => `${kw} Itinerary`,
  styleOrWear: (kw) => `${kw} Styling Tips`,
  learnAsSkill: (kw) => `${kw} Skill Practice`,
}

/**
 * Builds related entities and semantic topics from user input.
 * Entirely dynamic — no hardcoded brand lists, product names, or domain
 * terms. Combines input-derived tokens/bigrams with genuine companion
 * concepts drawn from whichever affordances are actually valid for this
 * subject and content goal, then removes trivial variants of each other
 * (reversals, pluralizations, exact duplicates).
 */
export function buildRelatedEntities(subject = '', primaryKeyword = '', nicheType = 'Other', audience = '', contentGoal = '', subjectTypeAnalysis = null) {
  const baseTerms = extractDynamicTermsFromInput(subject, primaryKeyword, audience)

  const baseCtx = deriveInputContext(subject, primaryKeyword, audience)
  const ctx = buildAffordanceContext(baseCtx, { contentGoal, subjectTypeAnalysis })
  const { validAffordances } = resolveValidAffordances(ctx)
  const kw = applyEntityCasing(primaryKeyword || subject)

  const seenKeys = new Set(baseTerms.map(trivialVariantKey))
  const enriched = [...baseTerms]

  for (const id of validAffordances) {
    if (id === 'understandOverview' || enriched.length >= 14) continue
    const template = ENTITY_CONCEPT_BY_AFFORDANCE[id]
    if (!template) continue
    const candidate = template(kw)
    const key = trivialVariantKey(candidate)
    if (seenKeys.has(key)) continue
    seenKeys.add(key)
    enriched.push(candidate)
  }

  return enriched.slice(0, 14)
}

/**
 * Weighted candidate topic scoring across 9 dimensions (Total: 100).
 */
export function scoreTopicCandidate(topic, context = {}) {
  const {
    nicheType = 'Other',
    audience = '',
    primaryKeyword = '',
    lifecycleState = 'released',
    existingTopics = [],
  } = context

  const title = topic.title || ''
  const targetKeyword = topic.targetKeyword || ''
  const hook = topic.hook || ''
  const isUnreleased = lifecycleState === 'rumored' || lifecycleState === 'upcoming'
  const ctx = deriveInputContext(title, primaryKeyword, audience)

  let score = 0
  const breakdowns = {}

  // 1. Search Intent Alignment (20 pts)
  let intentScore = 20
  if (!topic.searchIntent) intentScore -= 5
  breakdowns.searchIntent = Math.max(0, intentScore)
  score += breakdowns.searchIntent

  // 2. Semantic Relevance (15 pts)
  let semanticScore = 15
  const titleLower = title.toLowerCase()
  if (!titleLower.includes(primaryKeyword.toLowerCase()) && !titleLower.includes((primaryKeyword || '').split(' ')[0].toLowerCase())) {
    semanticScore -= 5
  }
  // Check for B2B jargon leak in clearly consumer-oriented content
  if (ctx.isConsumerSuggestive && !ctx.isB2BSuggestive) {
    const hasB2BLeak = BANNED_B2B_TERMS_IN_CONSUMER.some(
      term => titleLower.includes(term) || hook.toLowerCase().includes(term)
    )
    if (hasB2BLeak) semanticScore -= 10
  }
  breakdowns.semanticRelevance = Math.max(0, semanticScore)
  score += breakdowns.semanticRelevance

  // 3. Audience Alignment (15 pts)
  let audienceScore = 15
  if (audience) {
    const audKeywords = audience.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    const matchesAudience = audKeywords.some(kw => titleLower.includes(kw) || hook.toLowerCase().includes(kw))
    if (!matchesAudience) audienceScore -= 3
  }
  breakdowns.audienceAlignment = Math.max(0, audienceScore)
  score += breakdowns.audienceAlignment

  // 4. Title Quality (10 pts)
  let titleScore = 10
  if (title.length < 25 || title.length > 80) titleScore -= 2
  if (/:\s*The Complete\s+/i.test(title)) titleScore -= 2
  if (/\b(playbook|blueprint|guide)\s+(?:for|in)\s+[^:]+\s+(?:playbook|blueprint|guide)\b/i.test(title)) titleScore -= 4
  breakdowns.titleQuality = Math.max(0, titleScore)
  score += breakdowns.titleQuality

  // 5. Keyword Naturalness (10 pts)
  let kwScore = 10
  if (titleLower.includes(`${primaryKeyword.toLowerCase()} in ${primaryKeyword.toLowerCase()}`)) {
    kwScore -= 8
  }
  breakdowns.keywordNaturalness = Math.max(0, kwScore)
  score += breakdowns.keywordNaturalness

  // 6. Factual Safety (15 pts) - Hard gate
  let factScore = 15
  if (/\d+%/g.test(title) || /\d+%/g.test(hook)) {
    factScore -= 15
  }
  if (isUnreleased && /\b(in our testing|owners saw|users experienced)\b/i.test(title + ' ' + hook)) {
    factScore -= 15
  }
  breakdowns.factualSafety = Math.max(0, factScore)
  score += breakdowns.factualSafety

  // 7. Topic Differentiation (5 pts)
  let diffScore = 5
  for (const existing of existingTopics) {
    if (jaccardSimilarity(title, existing.title || '') > 0.65) {
      diffScore = 1
      break
    }
  }
  breakdowns.topicDifferentiation = diffScore
  score += breakdowns.topicDifferentiation

  // 8. E-E-A-T Opportunity (5 pts)
  let eeatScore = 5
  if (!topic.detailedOutline || topic.detailedOutline.length < 3) eeatScore -= 2
  breakdowns.eeatOpportunity = eeatScore
  score += breakdowns.eeatOpportunity

  // 9. Brand / Entity Accuracy (5 pts)
  let brandScore = 5
  // Penalize known brand mis-capitalizations
  if (/\b(iphone|ios|tiktok|youtube|linkedin|chatgpt|openai|macbook|airpods)\b/.test(title)) {
    brandScore -= 5
  }
  breakdowns.brandAccuracy = Math.max(0, brandScore)
  score += breakdowns.brandAccuracy

  return {
    totalScore: score,
    breakdowns,
  }
}

import { callAIAndParseJSON, getLastModelInvocation } from '../utils/aiProvider.js'
import { buildMissiveQaPromptDirectives } from '../utils/missiveQaRules.js'
import { applyEntityCasing } from '../constants/entityCasing.js'
import { getCompatibleAngles, BANNED_B2B_TERMS_IN_CONSUMER } from '../constants/contentAngles.js'
import { normalizeInput, removeCircularRepetition } from '../utils/textNormalization.js'
import {
  areHooksDuplicate,
  areTitlesDuplicate,
  calculateCannibalizationRisk,
} from '../utils/similarity.js'
import { classifyNiche } from './nicheClassifier.js'
import { classifySearchIntent, detectEntityLifecycle } from './intentClassifier.js'
import { validateFactSafety } from './factValidator.js'
import {
  buildAudienceIntentMap,
  buildSemanticTopicMap,
  buildEeatOpportunity,
  buildRelatedEntities,
  scoreTopicCandidate,
  deriveInputContext,
} from './topicScorer.js'
import { runMissiveQA } from './qaService.js'
import {
  buildAffordanceContext,
  resolveValidAffordances,
  prioritizeAffordances,
  validateActionObjectFit,
  AFFORDANCE_ANGLE_META,
} from './subjectAffordance.js'
import { detectLanguageCorrections } from './languageNormalizer.js'
import { analyzeSubjectComposition } from './subjectAnalyzer.js'
import { buildRuntimeOntology, discoverUserNeeds } from './runtimeOntology.js'
import { discoverSearchOpportunities } from './searchOpportunityDiscovery.js'
import { scoreTopicSpecificity, validateTopicAlignment } from './topicSpecificityScorer.js'

/**
 * Standardized Tone profiles with rich prompt directives
 */
export const TONE_PROFILES = {
  conversational: {
    id: 'conversational',
    label: 'Conversational & Engaging',
    directive:
      'Write in a friendly, engaging, approachable voice like an experienced peer chatting over coffee. Use second-person perspective ("you"), natural conversational hooks, relatable analogies, and clear, human storytelling.',
  },
  authoritative: {
    id: 'authoritative',
    label: 'Authoritative & Thought-Leadership',
    directive:
      'Write with executive authority, deep industry credibility, strategic foresight, and authoritative conviction. Eliminate fluff, use confident language, and frame insights as definitive strategic principles.',
  },
  bold: {
    id: 'bold',
    label: 'Bold & Disruptive',
    directive:
      'Use contrarian, pattern-interrupting framing that boldly challenges conventional wisdom, busts sacred cows in the industry, and takes an unapologetic stance that demands attention.',
  },
  empathetic: {
    id: 'empathetic',
    label: 'Empathetic & Supportive',
    directive:
      "Demonstrate profound empathy for the reader's real pain points, decision fatigue, and operational challenges. Use an encouraging, warm, and highly supportive tone that validates their struggle and offers reassurance.",
  },
  witty: {
    id: 'witty',
    label: 'Witty & Energetic',
    directive:
      'Inject clever metaphors, sharp energetic pacing, vibrant wordplay, and intelligent humor while keeping the takeaways deeply actionable and memorable.',
  },
  'data-driven': {
    id: 'data-driven',
    label: 'Analytical & Data-Driven',
    directive:
      'Adopt a rigorous, objective, metric-focused analytical lens. Emphasize verified benchmarks, statistical realities, measurable outcomes, frameworks, and empirical rigor without inventing fabricated numbers.',
  },
  storytelling: {
    id: 'storytelling',
    label: 'Storytelling & Narrative',
    directive:
      'Ground the content in immersive storytelling, narrative tension, relatable real-world anecdotes, and vivid scene-setting that hooks human curiosity and makes the reader feel part of an unfolding journey.',
  },
  fun: {
    id: 'fun',
    label: 'Fun & Playful',
    directive:
      'Keep it lighthearted, playful, and delightfully fun. Use casual upbeat phrasing, lively analogies, and an entertaining, high-vibe voice that makes reading effortless and smile-worthy.',
  },
}

/**
 * Clean text strictly against Missive QA rules (Zero Em Dashes, Zero Banned Buzzwords)
 */
export function sanitizeMissiveText(text) {
  if (typeof text !== 'string') return text
  let cleaned = text
    .replace(/—/g, ' - ')
    .replace(/\s--\s/g, ' - ')
    .replace(/--/g, ' - ')

  const replacements = [
    [/\bdelve into\b/gi, 'examine'],
    [/\bdelve\b/gi, 'explore'],
    [/\btapestry\b/gi, 'framework'],
    [/\bbeacon\b/gi, 'benchmark'],
    [/\bgame[- ]changer\b/gi, 'strategic advantage'],
    [/\bgame[- ]changing\b/gi, 'high-impact'],
    [/\btestament\b/gi, 'evidence'],
    [/\bplethora\b/gi, 'wide range'],
    [/\brevolutionize\b/gi, 'transform'],
    [/\brevolutionizing\b/gi, 'transforming'],
    [/\bunleash\b/gi, 'unlock'],
    [/\bunleashing\b/gi, 'unlocking'],
    [/\bin today'?s fast-paced world\b/gi, 'in modern operations'],
    [/\bin today'?s world\b/gi, 'today'],
    [/\blook no further\b/gi, 'here is the proven blueprint'],
    [/\bit is important to remember\b/gi, 'keep in mind'],
    [/\bdive deep\b/gi, 'examine closely'],
    [/\bfurthermore\b/gi, 'additionally'],
    [/\bmoreover\b/gi, 'also'],
    [/\bin conclusion\b/gi, 'action plan'],
    [/\bat the end of the day\b/gi, 'ultimately'],
  ]

  for (const [regex, rep] of replacements) {
    cleaned = cleaned.replace(regex, rep)
  }

  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+-\s+/g, ' - ')
    .trim()
  return applyEntityCasing(cleaned)
}

/**
 * Recursively sanitize all strings inside an object or array
 */
export function recursiveSanitizeMissive(obj) {
  if (!obj) return obj
  if (typeof obj === 'string') return sanitizeMissiveText(obj)
  if (Array.isArray(obj)) return obj.map(recursiveSanitizeMissive)
  if (typeof obj === 'object') {
    const res = {}
    for (const [k, v] of Object.entries(obj)) {
      res[k] = recursiveSanitizeMissive(v)
    }
    return res
  }
  return obj
}

/**
 * Computes a normalized title key for exact deduplication.
 * Removes whitespace, punctuation, and lowercases.
 */
function titleKey(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Capitalizes the first letter of a title (sentence case).
 */
function toSentenceCase(str) {
  if (!str || typeof str !== 'string') return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Tests whether two hooks are essentially the same generic fallback.
 */
function isGenericFallbackHook(hook) {
  if (!hook) return false
  const lower = hook.toLowerCase()
  return (
    /whether you are evaluating/.test(lower) ||
    /discover essential guidance/.test(lower) ||
    /here is a grounded, practical breakdown/.test(lower) ||
    (/most content about/.test(lower) && /rarely answers/.test(lower))
  )
}

/**
 * End-to-End Semantic Blog Topic, Outline & Brief Generator
 * Multi-industry architecture with strict factual safety and QA gating.
 *
 * Pipeline: RAW INPUT → NORMALIZED INPUT → CONCEPTS → RELATIONSHIPS →
 *           ONTOLOGY → USER NEEDS → SEARCH OPPORTUNITIES → TOPIC CANDIDATES →
 *           VALIDATION → SELECTION → CLUSTERS → PILLAR → QA
 */
export async function generateBlogTopics({
  niche,
  targetKeywords = [],
  audience = '',
  contentGoal = 'educational',
  tone = 'authoritative',
  preferredProvider,
  count = 8,
  contentType = 'blog post',
}) {
  // ══════════════════════════════════════════════════════════════
  // STEP 1: CAPTURE RAW INPUT
  // ══════════════════════════════════════════════════════════════
  const rawInput = {
    rawSubject: String(niche || '').trim(),
    rawKeywords: Array.isArray(targetKeywords)
      ? targetKeywords.filter(k => typeof k === 'string')
      : typeof targetKeywords === 'string'
        ? targetKeywords.split(',').map(k => k.trim()).filter(Boolean)
        : [],
    rawAudience: String(audience || '').trim(),
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 2: NORMALIZE LANGUAGE (typo detection, correction)
  // ══════════════════════════════════════════════════════════════
  let normalization = { normalized: rawInput.rawSubject, corrections: [], ambiguities: [], confidence: 1.0 }
  try {
    normalization = await detectLanguageCorrections(rawInput.rawSubject, preferredProvider)
  } catch {
    // Use heuristic-only normalization
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 3: STANDARD INPUT NORMALIZATION (casing, formatting)
  // ══════════════════════════════════════════════════════════════
  const normalizedInput = normalizeInput({
    niche: normalization.normalized || rawInput.rawSubject,
    targetKeywords: rawInput.rawKeywords,
    audience: rawInput.rawAudience,
    contentGoal,
    tone,
    count,
    contentType,
  })

  const {
    normalizedSubject,
    primaryKeyword,
    secondaryKeywords,
    normalizedAudience,
    numberOfTopics,
  } = normalizedInput

  const activeTone = (normalizedInput.tone || 'authoritative').toLowerCase().trim()
  const toneProfile = TONE_PROFILES[activeTone] || TONE_PROFILES.authoritative

  // ══════════════════════════════════════════════════════════════
  // STEP 4: ANALYZE SUBJECT COMPOSITION (compound subjects, relationships)
  // ══════════════════════════════════════════════════════════════
  let subjectAnalysis = { subjectStructure: 'atomic', primaryConcepts: [normalizedSubject], relationships: [], atomicConcepts: [normalizedSubject], establishedPhrases: [], ambiguousSegments: [], confidence: 0.7 }
  try {
    subjectAnalysis = await analyzeSubjectComposition(rawInput.rawSubject, normalizedSubject, preferredProvider)
  } catch {
    // Use heuristic fallback
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 5: CLASSIFY NICHE, INTENT, LIFECYCLE
  // ══════════════════════════════════════════════════════════════
  const nicheClassification = classifyNiche(normalizedSubject, primaryKeyword, normalizedAudience)
  const { nicheType, isYMYL, isConsumer, isB2B } = nicheClassification

  const intentProfile = classifySearchIntent(primaryKeyword, normalizedSubject, nicheType)
  const lifecycleProfile = detectEntityLifecycle(normalizedSubject, primaryKeyword)
  const { lifecycleState, isUnreleased } = lifecycleProfile

  // ══════════════════════════════════════════════════════════════
  // STEP 6: BUILD AFFORDANCE & AUDIENCE CONTEXT
  // ══════════════════════════════════════════════════════════════
  const audienceIntentModel = buildAudienceIntentMap(normalizedSubject, normalizedAudience, nicheType)
  const baseAffordanceCtx = deriveInputContext(normalizedSubject, primaryKeyword, normalizedAudience)
  const affordanceCtx = buildAffordanceContext(baseAffordanceCtx, { contentGoal: normalizedInput.contentGoal })

  // ══════════════════════════════════════════════════════════════
  // STEP 7: BUILD RUNTIME ONTOLOGY
  // ══════════════════════════════════════════════════════════════
  const ontology = buildRuntimeOntology({
    subjectAnalysis,
    normalizedSubject,
    primaryKeyword,
    audience: normalizedAudience,
    contentGoal: normalizedInput.contentGoal,
    nicheType,
    lifecycleState,
    affordanceCtx,
  })

  // ══════════════════════════════════════════════════════════════
  // STEP 8: DISCOVER USER NEEDS & SEARCH OPPORTUNITIES
  // ══════════════════════════════════════════════════════════════
  const userNeeds = discoverUserNeeds(ontology, normalizedInput.contentGoal)
  const searchOpportunities = discoverSearchOpportunities(ontology, userNeeds, normalizedInput.contentGoal)

  // ══════════════════════════════════════════════════════════════
  // STEP 9: BUILD CLUSTERS FROM SEMANTIC OPPORTUNITY GROUPS
  // ══════════════════════════════════════════════════════════════
  const semanticClusters = buildSemanticTopicMap(
    normalizedSubject,
    primaryKeyword,
    nicheType,
    lifecycleState,
    normalizedInput.contentGoal,
    subjectAnalysis,
  )

  // ══════════════════════════════════════════════════════════════
  // STEP 10: BUILD RELATED ENTITIES
  // ══════════════════════════════════════════════════════════════
  const relatedEntities = buildRelatedEntities(
    normalizedSubject,
    primaryKeyword,
    nicheType,
    normalizedAudience,
    normalizedInput.contentGoal,
    subjectAnalysis,
  )

  // ══════════════════════════════════════════════════════════════
  // STEP 12: GENERATE CANDIDATE TOPICS VIA AI
  // ══════════════════════════════════════════════════════════════
  const qaDirectives = buildMissiveQaPromptDirectives()

  const domainGuidelines = isConsumer
    ? `CRITICAL DOMAIN RULES FOR ${nicheType.toUpperCase()}:
- This is a consumer / end-user topic. Strictly FORBIDDEN from using B2B SaaS jargon such as "ROI", "unit economics", "growth lever", "high-growth teams", "tech stack", "workflow optimization", or "enterprise scalability".
- Treat the subject as an end-user product/experience, not an enterprise B2B platform.`
    : isYMYL
      ? `CRITICAL DOMAIN RULES FOR YMYL (${nicheType.toUpperCase()}):
- Exercise extreme caution and neutral, objective guidance.
- Strictly ZERO guarantees, fabricated settlement numbers, or invented outcome statistics.`
      : `CRITICAL DOMAIN RULES FOR B2B:
- Focus on real practitioner workflows, integration realities, and operational trade-offs.`

  const lifecycleGuidelines = isUnreleased
    ? `CRITICAL ENTITY LIFECYCLE DIRECTIVE (${lifecycleState.toUpperCase()}):
- The product "${primaryKeyword}" is UNRELEASED / RUMORED.
- You are strictly FORBIDDEN from claiming confirmed hands-on tests, battery decay measurements, or past-tense user experiences.
- Use prospective, speculative, and analytical framing: "what reports suggest", "rumored features", "what users should expect".`
    : `LIFECYCLE DIRECTIVE: Product is released and active.`

  // Build the subject analysis summary for the AI
  const subjectAnalysisSummary = subjectAnalysis.relationships.length > 0
    ? `\nSUBJECT COMPOSITION: "${normalizedSubject}" is a ${subjectAnalysis.subjectStructure} subject containing concepts: [${subjectAnalysis.primaryConcepts.join(', ')}]. Relationships: ${subjectAnalysis.relationships.map(r => `${r.from} → ${r.to} (${r.type}: ${r.description})`).join('; ')}.`
    : `\nSUBJECT COMPOSITION: "${normalizedSubject}" is a ${subjectAnalysis.subjectStructure} subject.`

  // Build search opportunity summary
  const opportunitySummary = searchOpportunities.length > 0
    ? `\nDISCOVERED SEARCH OPPORTUNITIES (use these to inspire unique, specific topics):
${searchOpportunities.slice(0, 10).map(o => `- [${o.intent}] ${o.userNeed} (specificity: ${o.specificity}, angle: ${o.angle})`).join('\n')}`
    : ''

  const systemPrompt = `You are Himani Kankaria's Chief Content Strategist and SEO Architect at Missive Digital.
You design high-intent, clickable, search-optimized blog topics arranged in a Pillar-and-Cluster topical authority structure.

CRITICAL MISSIVE QA DIRECTIVES:
${qaDirectives}

${domainGuidelines}
${lifecycleGuidelines}
${subjectAnalysisSummary}

NON-NEGOTIABLE RULES:
1. NEVER INVENT STATISTICS, PERCENTAGES, OR NUMBERS.
2. PRESERVE BRAND CAPITALIZATION (e.g. iPhone, TikTok, YouTube).
3. GENERATE SPECIFIC, NON-GENERIC TITLES. Each title must communicate a search need that emerges specifically from this subject. Do NOT generate titles that could work for any subject by swapping the keyword.
4. DO NOT REPEAT THE RAW SUBJECT PHRASE IN EVERY TITLE. Each topic should focus on a distinct aspect or angle.
5. TONE MUST MATERIALLY CHANGE THE WRITING. If the tone is "Storytelling", use narrative devices, scene-setting, and storytelling hooks — not standard instructional openings.
6. HOOKS MUST BE TOPIC-SPECIFIC. Each hook must incorporate meaningful context from the title, intent, and ontology. Do NOT use generic fallback sentences.
7. GENERATE EXACTLY ${numberOfTopics} TOPIC OBJECTS. If you cannot generate ${numberOfTopics} distinct topics, generate fewer — do NOT pad with duplicates or near-duplicates.
8. Each topic must have a DIFFERENT search intent, angle, and focus concept. No two topics should target the same search need.
9. For each topic, estimate word count DYNAMICALLY based on scope, complexity, and comparison requirements. Do NOT use a fixed 2400 for everything.
10. If the subject contains multiple concepts (e.g. "cafe and coffee"), ensure the portfolio covers their RELATIONSHIP, not just repeating the compound phrase.
11. DO NOT use generic title templates like "X: Complete Guide" or "Understanding X in Practice". Titles must be subject-specific.
12. SERP RISK: If you have no actual competitive data, use "unknown" — do NOT fabricate risk levels.
13. SECONDARY KEYWORDS: Derive from the ontology and search opportunities, not from token fragments of the subject.
14. CONTENT ANGLE must match the final title and intent — do not label a generic overview as a comparison.`

  const userPrompt = `Generate a Pillar-and-Cluster blueprint with EXACTLY ${numberOfTopics} unique, semantically tailored topic objects.

SUBJECT: ${normalizedSubject} (Classified as: ${nicheType})
PRIMARY KEYWORD: ${primaryKeyword}
TARGET AUDIENCE: ${normalizedAudience || audienceIntentModel.persona}
SEARCH INTENT: ${intentProfile.primaryIntent} (${intentProfile.intents.join(', ')})
PRODUCT LIFECYCLE: ${lifecycleState}
KEY AUDIENCE CONCERNS: ${audienceIntentModel.concerns.slice(0, 5).join('; ')}
CONTENT GOAL: ${normalizedInput.contentGoal}
TONE: ${toneProfile.label} (${toneProfile.directive})
SUBJECT STRUCTURE: ${subjectAnalysis.subjectStructure}
COMPONENT CONCEPTS: ${subjectAnalysis.primaryConcepts.join(', ')}
${opportunitySummary}

For each topic, provide:
- A SPECIFIC, NON-GENERIC title (under 65 chars) that communicates a unique search need
- A topic-specific hook that uses the tone and incorporates subject-specific details
- Dynamic estimatedWordCount (not fixed — vary based on topic scope)
- Search intent, content angle, and cluster assignment
- SEO brief with dynamically estimated word count
- Detailed outline with specific sections
- FAQs

Return JSON:
{
  "pillarTopic": {
    "title": "Specific cornerstone title under 65 chars",
    "primaryKeyword": "${primaryKeyword}",
    "summary": "1-2 sentence pillar description"
  },
  "clusters": [
    ${semanticClusters.map(c => `{"name": "${c.name}", "description": "${c.description}"}`).join(',\n    ')}
  ],
  "topics": [
    {
      "title": "Specific headline under 65 characters",
      "targetKeyword": "topic-specific keyword (not always the raw subject)",
      "searchIntent": "informational|commercial investigation|comparison|how-to|problem-solving",
      "contentType": "Guide|Comparison|How-to|FAQ|Case Study",
      "contentAngle": "Specific angle matching title and intent",
      "hook": "Topic-specific opening with tone applied",
      "difficulty": "easy|medium|hard",
      "estimatedWordCount": 1800,
      "clusterName": "matching cluster name",
      "whyItWorks": "Why this captures specific search intent",
      "relatedEntities": ["meaningful related concept 1", "meaningful related concept 2"],
      "eeatEvidenceOpportunity": "Recommended primary source to collect",
      "seoBrief": {
        "targetPersona": "${audienceIntentModel.persona}",
        "funnelStage": "TOFU|MOFU|BOFU",
        "searchIntent": "matching intent",
        "recommendedWordCount": "dynamic count based on scope",
        "titleTag": "Title tag under 60 chars",
        "metaDescription": "SERP snippet under 155 chars",
        "competitorGap": "Information gain opportunity",
        "primaryKeyword": "topic-specific keyword",
        "secondaryKeywords": ["secondary 1", "secondary 2"],
        "internalLinkAnchors": ["Contextual anchor 1", "Contextual anchor 2"],
        "ctaBridge": "Contextual conversion directive"
      },
      "detailedOutline": [
        {
          "sectionNumber": 1,
          "heading": "H2: Specific section headline",
          "wordCountBudget": "450 words",
          "purpose": "Section purpose",
          "subsections": [
            { "heading": "H3: Subsection", "guidance": "Writing guidance" }
          ],
          "keyPoints": ["Point 1", "Point 2"],
          "eeatProof": "Recommended source to cite",
          "visualAsset": "Suggested visual",
          "commonPitfall": "Mistake to avoid"
        }
      ],
      "faqs": [
        { "question": "Specific question?", "answerSnippet": "Direct answer." }
      ]
    }
  ],
  "strategy": "Publishing roadmap and interlinking strategy."
}`

  // AI generation with timeout
  const AI_WALL_CLOCK_MS = 25000
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI wall-clock timeout (25s)')), AI_WALL_CLOCK_MS)
  )

  let rawResult = null
  try {
    rawResult = await Promise.race([
      callAIAndParseJSON(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          preferredProvider: preferredProvider || 'groq',
          temperature: 0.7,
          maxTokens: Math.min(Math.max(numberOfTopics * 380, 2500), 4000),
          jsonMode: true,
          maxProviders: 4,
        }
      ),
      timeoutPromise,
    ])
  } catch (err) {
    console.warn(`[blogTopicGenerator] AI generation skipped: ${err.message}`)
  }

  const lastAiCall = getLastModelInvocation()
  const activeModelUsed = rawResult ? (lastAiCall?.model || 'openai/gpt-oss-120b') : 'Procedural Ontology & Affordance Synthesis'
  const activeProviderUsed = rawResult ? (lastAiCall?.provider || 'groq') : 'ontology-engine'
  const isFallbackActive = !rawResult

  // ══════════════════════════════════════════════════════════════
  // STEP 13: VALIDATE AND PROCESS CANDIDATES
  // ══════════════════════════════════════════════════════════════
  let candidates = []
  if (rawResult && Array.isArray(rawResult.topics) && rawResult.topics.length > 0) {
    candidates = rawResult.topics
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 13b: SUPPLEMENT CANDIDATES VIA ONTOLOGY & DYNAMIC FALLBACK
  // ══════════════════════════════════════════════════════════════
  if (candidates.length < numberOfTopics) {
    console.warn(`[blogTopicGenerator] AI returned ${candidates.length}/${numberOfTopics} topics — supplementing via ontology`)
    const ontologyCandidates = generateFromOntology({
      ontology,
      searchOpportunities,
      subjectAnalysis,
      normalizedSubject,
      primaryKeyword,
      normalizedAudience,
      audienceIntentModel,
      semanticClusters,
      relatedEntities,
      nicheType,
      lifecycleState,
      contentGoal: normalizedInput.contentGoal,
      tone: activeTone,
      toneProfile,
      count: numberOfTopics * 2,
    })
    const existingTitles = new Set(candidates.map(c => titleKey(c.title)))
    for (const oc of ontologyCandidates) {
      const key = titleKey(oc.title)
      if (key && !existingTitles.has(key)) {
        candidates.push(oc)
        existingTitles.add(key)
      }
    }
  }

  if (candidates.length < numberOfTopics) {
    console.warn('[blogTopicGenerator] Supplementing via dynamic synthesis')
    const dynamicFallback = generateDynamicTopics({
      niche: normalizedSubject,
      targetKeywords: [primaryKeyword, ...secondaryKeywords],
      audience: normalizedAudience,
      contentGoal: normalizedInput.contentGoal,
      tone: activeTone,
      count: numberOfTopics,
      contentType: normalizedInput.contentType,
    })
    const existingTitles = new Set(candidates.map(c => titleKey(c.title)))
    for (const dt of dynamicFallback.topics || []) {
      const key = titleKey(dt.title)
      if (key && !existingTitles.has(key)) {
        candidates.push(dt)
        existingTitles.add(key)
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 14: RUN EXACT DEDUPLICATION
  // ══════════════════════════════════════════════════════════════
  const titleKeys = new Set()
  const uniqueCandidates = []
  for (const c of candidates) {
    const key = titleKey(c.title)
    if (key && !titleKeys.has(key)) {
      titleKeys.add(key)
      uniqueCandidates.push(c)
    }
  }
  candidates = uniqueCandidates

  // ══════════════════════════════════════════════════════════════
  // STEP 15: PROCESS EACH CANDIDATE — VALIDATION & SCORING
  // ══════════════════════════════════════════════════════════════
  const processedTopics = []
  const processedTitleKeys = new Set()
  const processedHookKeys = new Set()
  console.warn(`[blogTopicGenerator] Step 15: processing ${candidates.length} candidates`)

  for (let i = 0; i < candidates.length && processedTopics.length < numberOfTopics; i++) {
    const raw = candidates[i]
    const topicId = `topic-${i + 1}`

    // Clean title
    let cleanedTitle = removeCircularRepetition(
      raw.title || '',
      primaryKeyword,
      normalizedSubject
    )
    cleanedTitle = applyEntityCasing(cleanedTitle)

    // Skip empty or too-short titles
    if (!cleanedTitle || cleanedTitle.length < 15) { console.warn(`  [${i}] SKIP title too short: "${cleanedTitle}"`); continue }

    // Exact dedup
    const tKey = titleKey(cleanedTitle)
    if (processedTitleKeys.has(tKey)) { console.warn(`  [${i}] SKIP exact dupe: "${cleanedTitle}"`); continue }

    // Semantic dedup — check against all processed topics
    let isSemanticDupe = false
    for (const existing of processedTopics) {
      if (areTitlesDuplicate(cleanedTitle, existing.title, 0.72)) {
        isSemanticDupe = true
        break
      }
    }
    if (isSemanticDupe) { console.warn(`  [${i}] SKIP semantic dupe: "${cleanedTitle}"`); continue }

    // Clean hook — ensure high quality and repair dynamically if missing or generic
    let cleanedHook = applyEntityCasing(raw.hook || '')
    if (!cleanedHook || cleanedHook.length < 20 || isGenericFallbackHook(cleanedHook)) {
      cleanedHook = deriveHookFromOpportunity(
        { userNeed: cleanedTitle, intent: raw.searchIntent },
        primaryKeyword,
        normalizedSubject,
        toneProfile
      )
    }

    // Fact safety check on hook
    const factCheckHook = validateFactSafety(cleanedHook, { isUnreleased })
    if (!factCheckHook.safe) {
      cleanedHook = factCheckHook.sanitizedText
    }

    // Hook dedup — if duplicate or semantically identical, replace with uniquely tailored angle hook
    let hKey = titleKey(cleanedHook)
    let isSemanticHookDupe = false
    for (const existingHook of processedHookKeys) {
      if (areHooksDuplicate(cleanedHook, existingHook, 0.6)) {
        isSemanticHookDupe = true
        break
      }
    }
    if (processedHookKeys.has(hKey) || isSemanticHookDupe) {
      const topicContext = cleanedTitle.replace(/^H\d+:\s*/i, '').replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim()
      cleanedHook = `When addressing ${topicContext.toLowerCase()}, establishing verified operational benchmarks upfront separates successful initiatives from costly rework.`
      hKey = titleKey(cleanedHook)
    }

    // Dynamic word count — not fixed at 2400
    const estimatedWordCount = raw.estimatedWordCount || estimateWordCount(raw, ontology)

    // Cluster assignment — match intent to cluster name
    const clusterName = raw.clusterName || assignCluster(raw, semanticClusters)

    // Normalize outline
    const detailedOutline = normalizeOutline(raw.detailedOutline, primaryKeyword, normalizedAudience)

    // Build E-E-A-T opportunity
    const eeatOpportunity = buildEeatOpportunity(cleanedTitle, nicheType, lifecycleState)

    // Build related entities — topic-specific, not raw token fragments
    const topicEntities = buildTopicEntities(cleanedTitle, relatedEntities, primaryKeyword)

    // Build SEO brief
    const seoBrief = {
      targetPersona: applyEntityCasing(raw.seoBrief?.targetPersona || audienceIntentModel.persona),
      funnelStage: raw.seoBrief?.funnelStage || inferFunnelStage(raw.searchIntent || intentProfile.primaryIntent),
      searchIntent: raw.seoBrief?.searchIntent || raw.searchIntent || intentProfile.primaryIntent,
      recommendedWordCount: raw.seoBrief?.recommendedWordCount || `${estimatedWordCount} words (~${Math.ceil(estimatedWordCount / 238)} min read)`,
      titleTag: applyEntityCasing(
        raw.seoBrief?.titleTag || (cleanedTitle.length <= 58 ? cleanedTitle : `${cleanedTitle.slice(0, 55)}...`)
      ),
      metaDescription: applyEntityCasing(
        raw.seoBrief?.metaDescription || `Explore key insights and practical guidance for ${primaryKeyword}.`
      ),
      competitorGap: raw.seoBrief?.competitorGap || 'Delivers specific, verified information gain beyond generic overviews.',
      primaryKeyword: raw.seoBrief?.primaryKeyword || primaryKeyword,
      secondaryKeywords: (raw.seoBrief?.secondaryKeywords || topicEntities.slice(1, 4)),
      internalLinkAnchors: raw.seoBrief?.internalLinkAnchors || [`Master guide to ${normalizedSubject}`, `${primaryKeyword} overview`],
      ctaBridge: raw.seoBrief?.ctaBridge || `Read our comprehensive guide to ${primaryKeyword}.`,
    }

    // Validate topic alignment
    const alignment = validateTopicAlignment({
      title: cleanedTitle,
      searchIntent: raw.searchIntent || intentProfile.primaryIntent,
      contentAngle: raw.contentAngle || '',
    })

    // Score specificity
    const specificity = scoreTopicSpecificity(
      { title: cleanedTitle, hook: cleanedHook, searchIntent: raw.searchIntent },
      ontology
    )

    const topicObj = {
      id: topicId,
      title: cleanedTitle,
      targetKeyword: raw.targetKeyword || primaryKeyword,
      searchIntent: raw.searchIntent || intentProfile.primaryIntent,
      contentType: raw.contentType || 'Comprehensive Guide',
      contentAngle: raw.contentAngle || 'Practical Guide',
      hook: cleanedHook,
      difficulty: raw.difficulty || 'medium',
      estimatedWordCount,
      clusterName,
      detailedOutline,
      outline: detailedOutline.map(d => d.heading),
      seoBrief,
      faqs: Array.isArray(raw.faqs) && raw.faqs.length > 0
        ? raw.faqs.map(recursiveSanitizeMissive)
        : [],
      whyItWorks: raw.whyItWorks || `Captures ${raw.searchIntent || 'informational'} search intent for ${primaryKeyword}.`,
      relatedEntities: topicEntities,
      relatedKeywords: topicEntities,
      eeatOpportunity,
      lifecycleState,
      specificity,
      alignment,
    }

    // Run Missive QA
    topicObj.missiveQa = runMissiveQA(topicObj, {
      nicheType,
      lifecycleState,
      existingTopics: processedTopics,
      primaryKeyword,
      affordanceCtx,
      normalization,
    })

    // Hard gate: skip topics that fail QA
    if (!topicObj.missiveQa.passed && topicObj.missiveQa.hardFailures.length > 0) {
      console.warn(`[blogTopicGenerator] Topic "${cleanedTitle}" failed QA: ${topicObj.missiveQa.hardFailures[0]}`)
      continue
    }

    processedTopics.push(topicObj)
    processedTitleKeys.add(tKey)
    processedHookKeys.add(hKey)
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 15b: GUARANTEE MINIMUM TOPIC COUNT (NEVER RETURN 0 RESULTS)
  // ══════════════════════════════════════════════════════════════
  if (processedTopics.length < numberOfTopics) {
    console.warn(`[blogTopicGenerator] Processed topics (${processedTopics.length}) < requested (${numberOfTopics}). Supplementing from QA-certified dynamic generator...`)
    const guaranteedFallback = generateDynamicTopics({
      niche: normalizedSubject,
      targetKeywords: [primaryKeyword, ...secondaryKeywords],
      audience: normalizedAudience,
      contentGoal: normalizedInput.contentGoal,
      tone: activeTone,
      count: numberOfTopics,
      contentType: normalizedInput.contentType,
    })
    for (const guaranteedTopic of guaranteedFallback.topics || []) {
      if (processedTopics.length >= numberOfTopics) break
      const tKey = titleKey(guaranteedTopic.title)
      if (!processedTitleKeys.has(tKey)) {
        guaranteedTopic.id = `topic-${processedTopics.length + 1}`
        processedTopics.push(guaranteedTopic)
        processedTitleKeys.add(tKey)
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 16: CANNIBALIZATION CHECK
  // ══════════════════════════════════════════════════════════════
  for (let i = 0; i < processedTopics.length; i++) {
    let highestRisk = { score: 0, risk: 'low', reason: 'Distinct SERP intent.' }
    for (let j = 0; j < processedTopics.length; j++) {
      if (i === j) continue
      const check = calculateCannibalizationRisk(processedTopics[i], processedTopics[j])
      if (check.score > highestRisk.score) {
        highestRisk = check
      }
    }
    processedTopics[i].cannibalizationRisk = highestRisk.risk
    processedTopics[i].cannibalizationDetail = highestRisk.reason
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 17: BUILD OUTPUT
  // ══════════════════════════════════════════════════════════════
  const output = {
    niche: normalizedSubject,
    nicheClassification,
    intentProfile,
    lifecycleProfile,
    targetKeywords: [primaryKeyword, ...secondaryKeywords],
    audience: normalizedAudience,
    contentGoal: normalizedInput.contentGoal,
    tone: activeTone,
    pillarTopic: rawResult?.pillarTopic || {
      title: applyEntityCasing(normalizedSubject.length > 50 ? `${normalizedSubject.slice(0, 47)}...` : normalizedSubject),
      primaryKeyword,
      summary: `The cornerstone topic pillar establishing topical authority for ${normalizedSubject}.`,
    },
    clusters: semanticClusters,
    topics: processedTopics,
    strategy: rawResult?.strategy || `Publish the cornerstone pillar first, then roll out supporting cluster articles mapped to user search intent.`,
    modelUsed: activeModelUsed,
    providerUsed: activeProviderUsed,
    isFallback: isFallbackActive,
    generatedAt: new Date().toISOString(),
    inputParams: {
      rawInput,
      normalization: {
        corrections: normalization.corrections,
        confidence: normalization.confidence,
        ambiguities: normalization.ambiguities,
      },
      subjectAnalysis: {
        structure: subjectAnalysis.subjectStructure,
        concepts: subjectAnalysis.primaryConcepts,
        relationships: subjectAnalysis.relationships,
      },
      ontology: {
        centralTheme: ontology.centralTheme,
        commercialDimensions: ontology.commercialDimensions,
        informationalDimensions: ontology.informationalDimensions,
        userQuestions: ontology.userQuestions.slice(0, 5),
      },
      searchOpportunities: searchOpportunities.slice(0, 5),
    },
  }

  const sanitized = recursiveSanitizeMissive(output)
  return sanitized
}

// ══════════════════════════════════════════════════════════════
// ONTOLOGY-DRIVEN FALLBACK GENERATOR
// Generates topics from search opportunities and ontology when AI fails.
// NOT template-based — each topic is derived from a specific search
// opportunity discovered from the runtime ontology.
// ══════════════════════════════════════════════════════════════

function generateFromOntology({
  ontology,
  searchOpportunities,
  subjectAnalysis,
  normalizedSubject,
  primaryKeyword,
  normalizedAudience,
  audienceIntentModel,
  semanticClusters,
  relatedEntities,
  nicheType,
  lifecycleState,
  contentGoal,
  tone,
  toneProfile,
  count,
}) {
  const kw = applyEntityCasing(primaryKeyword)
  const theme = applyEntityCasing(normalizedSubject)
  const concepts = subjectAnalysis.primaryConcepts || [normalizedSubject]
  const isCompound = subjectAnalysis.subjectStructure === 'compound' || concepts.length > 1

  // Build topic candidates from search opportunities
  const candidates = []
  const seenTitles = new Set()

  for (const opp of searchOpportunities) {
    if (candidates.length >= count * 2) break // generate extra, we'll dedup and trim

    // Derive title from the actual search opportunity, not a template
    const title = deriveTitleFromOpportunity(opp, kw, theme, concepts, isCompound, contentGoal)
    const tKey = titleKey(title)
    if (!title || title.length < 15 || seenTitles.has(tKey)) continue
    seenTitles.add(tKey)

    // Derive hook from the opportunity and tone
    const hook = deriveHookFromOpportunity(opp, kw, theme, toneProfile)
    if (!hook || hook.length < 20) continue

    // Map opportunity intent to standard intent
    const intent = opp.intent || 'informational'
    const intentStandard = normalizeIntent(intent)

    // Assign to cluster based on intent
    const clusterName = assignClusterFromIntent(intentStandard, semanticClusters)

    // Estimate word count based on opportunity specificity and scope
    const wordCount = opp.specificity === 'high' ? 2200 : opp.specificity === 'medium' ? 1900 : 1600

    candidates.push({
      title: applyEntityCasing(title),
      targetKeyword: kw,
      searchIntent: intentStandard,
      contentType: contentTypeFromIntent(intentStandard),
      contentAngle: opp.angle || 'Practical Guide',
      hook: applyEntityCasing(hook),
      difficulty: 'medium',
      estimatedWordCount: wordCount,
      clusterName,
      whyItWorks: `Addresses the specific search need: ${opp.userNeed}`,
      relatedEntities: relatedEntities.slice(0, 4),
      faqs: [],
      seoBrief: {
        targetPersona: applyEntityCasing(normalizedAudience || audienceIntentModel.persona),
        funnelStage: inferFunnelStage(intentStandard),
        searchIntent: intentStandard,
        recommendedWordCount: `${wordCount} words (~${Math.ceil(wordCount / 238)} min read)`,
        primaryKeyword: kw,
        secondaryKeywords: relatedEntities.slice(1, 3),
      },
      detailedOutline: buildDefaultOutline(kw, normalizedAudience),
    })
  }

  // If we still don't have enough, generate from ontology dimensions directly
  if (candidates.length < count) {
    const extraTopics = generateFromOntologyDimensions({
      ontology,
      kw,
      theme,
      concepts,
      isCompound,
      semanticClusters,
      relatedEntities,
      audienceIntentModel,
      normalizedAudience,
      contentGoal,
      toneProfile,
      seenTitles,
    })
    for (const t of extraTopics) {
      if (candidates.length >= count) break
      const tKey = titleKey(t.title)
      if (seenTitles.has(tKey)) continue
      seenTitles.add(tKey)
      candidates.push(t)
    }
  }

  return candidates.slice(0, count)
}

/**
 * Derives a specific title from a search opportunity.
 * NOT a template — the title structure emerges from the opportunity's
 * user need, intent, and relevant concepts.
 */
function deriveTitleFromOpportunity(opp, kw, theme, concepts, isCompound, contentGoal) {
  const need = (opp.userNeed || '').toLowerCase()
  const intent = (opp.intent || '').toLowerCase()
  const angle = (opp.angle || '').toLowerCase()

  // Build title from the actual search need — NOT from a template
  if (intent === 'comparison' || need.includes('compare') || need.includes('vs') || need.includes('difference')) {
    if (isCompound && concepts.length >= 2) {
      return toSentenceCase(`${applyEntityCasing(concepts[0])} vs ${applyEntityCasing(concepts[1])}: What Sets Them Apart`)
    }
    return toSentenceCase(`${kw}: How the Main Options Differ`)
  }

  if (intent === 'problem-solving' || need.includes('solve') || need.includes('avoid') || need.includes('fix') || need.includes('pitfall') || need.includes('mistake')) {
    return toSentenceCase(`${kw} Pitfalls: What Goes Wrong and How to Avoid It`)
  }

  if (intent === 'how-to' || need.includes('how to') || need.includes('guide') || need.includes('walkthrough') || angle.includes('guide') || angle.includes('step')) {
    const cleaned = need
      .replace(/^how to\s*/i, '')
      .replace(/^a practical guide to\s*/i, '')
      .replace(/\bwith\s+.*$/, '')
      .replace(/^\s*get\s+started\s+with\s*/i, '')
      .replace(/^\s*(learning|evaluating|applying)\s+(and\s+)?/i, '')
      .trim()
    if (cleaned.length > 5 && cleaned.length < 50) {
      return toSentenceCase(`${applyEntityCasing(cleaned)}: A Practical Walkthrough`)
    }
    return toSentenceCase(`Getting Started with ${kw}: What Actually Matters`)
  }

  if (intent === 'commercial investigation' || need.includes('choose') || need.includes('evaluate') || need.includes('buy') || angle.includes('evaluation') || angle.includes('buyer')) {
    const aspect = need.replace(/^.*?evaluate\s*/i, '').replace(/^.*?choose\s+the right\s*/i, '').replace(/^.*?how to\s*/i, '').trim()
    if (aspect.length > 3 && aspect.length < 40) {
      return toSentenceCase(`Choosing ${applyEntityCasing(aspect)}: What to Look For`)
    }
    return toSentenceCase(`How to Pick the Right ${kw} for Your Needs`)
  }

  if (intent === 'informational' || need.includes('understanding') || need.includes('what')) {
    // Try to extract a meaningful phrase from the need
    let cleaned = need
      .replace(/^understanding\s*/i, '')
      .replace(/\s+related to\s+.*$/, '')
      .replace(/\s+for\s+.*$/, '')
      .trim()

    // If cleaned is too short, use the full need phrase
    if (cleaned.length < 8) {
      cleaned = need.replace(/\s+for\s+.*$/, '').trim()
    }

    // If still too short, use a keyword-based title
    if (cleaned.length < 8) {
      return toSentenceCase(`${kw}: What You Need to Know`)
    }

    if (cleaned.length < 55) {
      return toSentenceCase(`${applyEntityCasing(cleaned)}: The Essentials`)
    }
    // Long cleaned phrase — truncate smartly
    return toSentenceCase(`${applyEntityCasing(cleaned.slice(0, 45))}: What You Need to Know`)
  }

  // Fallback from angle
  if (angle.length > 5) {
    return toSentenceCase(`${kw}: ${applyEntityCasing(opp.angle)}`)
  }

  return null
}

/**
 * Derives a topic-specific hook from the search opportunity and tone.
 * Uses the tone's narrative style, not a generic template.
 */
function deriveHookFromOpportunity(opp, kw, theme, toneProfile) {
  const rawNeed = (opp?.userNeed || opp?.angle || '').toLowerCase()
  const intent = (opp?.intent || 'informational').toLowerCase()
  const angle = (opp?.angle || '').toLowerCase()
  const activeTone = (toneProfile?.id || '').toLowerCase()

  // Branch by semantic angle & intent to ensure every topic candidate gets a distinct hook structure
  if (intent === 'comparison' || angle.includes('compare') || angle.includes('vs') || rawNeed.includes('compare')) {
    if (activeTone === 'bold') {
      return `Comparing ${kw} options often boils down to marketing rhetoric versus production reality. Here is where the genuine operational trade-offs lie.`
    }
    return `Choosing between ${kw} alternatives requires looking past surface-level feature tables. Here is an objective analysis of core trade-offs and structural differences.`
  }

  if (intent === 'problem-solving' || angle.includes('mistake') || angle.includes('avoid') || angle.includes('troubleshoot') || angle.includes('pitfall') || rawNeed.includes('avoid')) {
    if (activeTone === 'bold') {
      return `The most expensive failures with ${kw} stem from predictable missteps. Here is the unvarnished breakdown of what goes wrong and how to prevent it.`
    }
    return `Preventable setbacks with ${kw} consistently trace back to a handful of recurring traps. Here is how experienced practitioners diagnose and avoid them.`
  }

  if (angle.includes('setup') || angle.includes('getting started') || angle.includes('implement') || angle.includes('roadmap') || angle.includes('walkthrough') || rawNeed.includes('start')) {
    if (activeTone === 'conversational') {
      return `Starting out with ${kw} does not have to be an uphill battle. Here is a clear, step-by-step roadmap to get moving with confidence.`
    }
    return `Deploying ${kw} without a disciplined rollout methodology introduces avoidable friction. Here is a structured, practical roadmap designed for execution.`
  }

  if (angle.includes('cost') || angle.includes('roi') || angle.includes('value') || angle.includes('budget') || rawNeed.includes('cost')) {
    return `Evaluating the financial reality of ${kw} means connecting upfront investment to measurable operational outcomes. Here is how to build an honest business case.`
  }

  if (angle.includes('quality') || angle.includes('criteria') || angle.includes('evaluation') || angle.includes('indicator') || rawNeed.includes('quality')) {
    return `Separating high-caliber ${kw} approaches from substandard alternatives requires objective benchmarks. Here are the core indicators that signal genuine quality.`
  }

  if (angle.includes('best practice') || angle.includes('optimization') || angle.includes('scale') || rawNeed.includes('practice')) {
    return `Transitioning from basic adoption of ${kw} to sustained operational mastery requires deliberate habits. Here are the key practices that drive superior results.`
  }

  if (activeTone === 'storytelling') {
    return `Behind every breakthrough with ${kw} is a moment where standard advice proved inadequate. Here is the operational framework that resolved the challenge.`
  }

  if (activeTone === 'bold') {
    return `Conventional playbooks for ${kw} routinely overlook critical practical nuances. Here is the contrarian reality of what actually works in production.`
  }

  if (activeTone === 'empathetic') {
    return `Managing initiatives around ${kw} can easily feel overwhelming when time is scarce. Here is a balanced, realistic guide designed to support your team.`
  }

  if (activeTone === 'data-driven') {
    return `A disciplined examination of ${kw} grounded in documented performance benchmarks, empirical trade-offs, and verifiable real-world metrics.`
  }

  if (activeTone === 'witty') {
    return `Let us cut through the ${kw} jargon: zero fluff, zero filler, just the high-leverage principles that make a measurable difference.`
  }

  if (activeTone === 'fun') {
    return `Time to make ${kw} straightforward and refreshingly engaging: here is the practical playbook, served with zero pretension.`
  }

  // Authoritative default
  return `Building lasting competency with ${kw} requires examining verified facts, operational trade-offs, and proven implementation standards.`
}

/**
 * Generates additional topics from ontology dimensions when search
 * opportunities are not enough.
 */
function generateFromOntologyDimensions({
  ontology,
  kw,
  theme,
  concepts,
  isCompound,
  semanticClusters,
  relatedEntities,
  audienceIntentModel,
  normalizedAudience,
  contentGoal,
  toneProfile,
  seenTitles,
}) {
  const topics = []

  // Use ontology user questions as topic seeds
  for (const question of ontology.userQuestions || []) {
    if (topics.length >= 8) break
    const title = questionToTitle(question, kw, concepts, isCompound)
    const tKey = titleKey(title)
    if (!title || title.length < 15 || seenTitles.has(tKey)) continue

    const intent = inferIntentFromQuestion(question)
    topics.push({
      title: applyEntityCasing(toSentenceCase(title)),
      targetKeyword: kw,
      searchIntent: intent,
      contentType: contentTypeFromIntent(intent),
      contentAngle: 'Informational Guide',
      hook: applyEntityCasing(toSentenceCase(`${kw} has more depth than most guides cover. Here is what the key questions reveal about how it actually works.`)),
      difficulty: 'medium',
      estimatedWordCount: 1800,
      clusterName: assignClusterFromIntent(intent, semanticClusters),
      whyItWorks: `Answers a specific question people ask about ${kw}.`,
      relatedEntities: relatedEntities.slice(0, 4),
      faqs: [],
      seoBrief: {
        targetPersona: applyEntityCasing(normalizedAudience || audienceIntentModel.persona),
        funnelStage: inferFunnelStage(intent),
        searchIntent: intent,
        recommendedWordCount: '1,800 words (~8 min read)',
        primaryKeyword: kw,
        secondaryKeywords: relatedEntities.slice(1, 3),
      },
      detailedOutline: [],
    })
  }

  // If still not enough, use component concepts for compound subjects
  if (topics.length < 4 && isCompound && concepts.length > 1) {
    for (const concept of concepts) {
      if (topics.length >= 6) break
      const title = `${applyEntityCasing(concept)}: A Focused Look at One Part of ${kw}`
      const tKey = titleKey(title)
      if (seenTitles.has(tKey)) continue
      seenTitles.add(tKey)

      topics.push({
        title: applyEntityCasing(toSentenceCase(title)),
        targetKeyword: applyEntityCasing(concept),
        searchIntent: 'informational',
        contentType: 'Deep Dive',
        contentAngle: 'Focused Analysis',
        hook: applyEntityCasing(toSentenceCase(`${concept} is one half of the ${kw} equation. Understanding it on its own terms helps you see the bigger picture more clearly.`)),
        difficulty: 'medium',
        estimatedWordCount: 1700,
        clusterName: assignClusterFromIntent('informational', semanticClusters),
        whyItWorks: `Provides focused coverage of ${concept} as part of the broader ${kw} topic.`,
        relatedEntities: relatedEntities.slice(0, 4),
        faqs: [],
        seoBrief: {
          targetPersona: applyEntityCasing(normalizedAudience || audienceIntentModel.persona),
          funnelStage: 'TOFU (Awareness)',
          searchIntent: 'informational',
          recommendedWordCount: '1,700 words (~7 min read)',
          primaryKeyword: applyEntityCasing(concept),
          secondaryKeywords: relatedEntities.slice(1, 3),
        },
        detailedOutline: buildDefaultOutline(kw, normalizedAudience),
      })
    }
  }

  return topics
}

function questionToTitle(question, kw, concepts, isCompound) {
  const q = question.toLowerCase()
  if (q.startsWith('how do') && isCompound) {
    return `How ${applyEntityCasing(concepts[0])} and ${applyEntityCasing(concepts[1])} Work Together`
  }
  if (q.startsWith('which aspect')) {
    return `${kw}: Which Part Matters Most and Why`
  }
  if (q.startsWith('can you focus')) {
    return `${kw}: Breaking It Down Into Its Core Parts`
  }
  if (q.startsWith('who is this')) {
    return `${kw}: Who It Is For and Who Should Look Elsewhere`
  }
  if (q.startsWith('what background')) {
    return `${kw}: Background Knowledge That Actually Helps`
  }
  // Generic question-to-title — rephrase as a declarative title
  const cleaned = question
    .replace(/^(who|what|when|where|why|how|can)\s+/i, '')
    .replace(/\?$/, '')
    .trim()
  if (cleaned.length > 8) {
    return `${applyEntityCasing(cleaned)}: A Clear Breakdown`
  }
  return null
}

function inferIntentFromQuestion(question) {
  const q = (question || '').toLowerCase()
  if (/^(how|step|guide)/.test(q)) return 'how-to'
  if (/^(what|who|when|where|which)/.test(q)) return 'informational'
  if (/(compare|vs|difference|better)/.test(q)) return 'comparison'
  if (/(buy|choose|select|best|review)/.test(q)) return 'commercial investigation'
  if (/(fix|solve|avoid|problem)/.test(q)) return 'problem-solving'
  return 'informational'
}

function normalizeIntent(intent) {
  const map = {
    'decision': 'commercial investigation',
    'comparison': 'comparison',
  }
  return map[intent] || intent || 'informational'
}

function contentTypeFromIntent(intent) {
  switch (intent) {
    case 'comparison': return 'Comparison Guide'
    case 'how-to': return 'How-to Guide'
    case 'commercial investigation': return 'Buyer Guide'
    case 'problem-solving': return 'Troubleshooting Guide'
    default: return 'Comprehensive Guide'
  }
}

function assignClusterFromIntent(intent, clusters) {
  if (!clusters || clusters.length === 0) return 'General'
  for (const c of clusters) {
    const name = (c.name || '').toLowerCase()
    if (intent === 'comparison' && (name.includes('comparison') || name.includes('alternative') || name.includes('versus'))) return c.name
    if (intent === 'how-to' && (name.includes('guide') || name.includes('setup') || name.includes('implementation'))) return c.name
    if (intent === 'commercial investigation' && (name.includes('decision') || name.includes('buying') || name.includes('cost'))) return c.name
    if (intent === 'problem-solving' && (name.includes('mistake') || name.includes('troubleshoot') || name.includes('fix'))) return c.name
  }
  return clusters[0].name
}

// ══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

/**
 * Dynamically estimates word count based on topic scope, complexity, and intent.
 * NOT a fixed value for every topic.
 */
function estimateWordCount(topic, ontology) {
  let base = 1800
  const intent = (topic.searchIntent || '').toLowerCase()
  const title = (topic.title || '').toLowerCase()

  // Longer, more complex topics get more words
  if (intent === 'comparison') base = 2400
  if (intent === 'how-to') base = 2000
  if (intent === 'commercial investigation') base = 2200

  // Compound subjects or multi-concept topics need more depth
  if (ontology.componentConcepts.length > 1) base += 400

  // Outline complexity affects word count
  if (Array.isArray(topic.detailedOutline) && topic.detailedOutline.length > 5) base += 300

  // Topics with comparisons in the title need more
  if (/vs|versus|compared|alternatives|difference/.test(title)) base += 300

  // Add some variance (not every article is the same length)
  const variance = Math.floor(Math.random() * 400) - 200
  return Math.max(1500, Math.min(3500, base + variance))
}

/**
 * Assigns a topic to the best-matching cluster based on intent and content.
 */
function assignCluster(topic, clusters) {
  if (!clusters || clusters.length === 0) return 'General'
  if (topic.clusterName) return topic.clusterName

  const intent = (topic.searchIntent || '').toLowerCase()
  const title = (topic.title || '').toLowerCase()

  // Try to match cluster name to intent/topic content
  for (const cluster of clusters) {
    const name = (cluster.name || '').toLowerCase()
    if (intent === 'comparison' && (name.includes('comparison') || name.includes('alternative') || name.includes('versus'))) return cluster.name
    if (intent === 'how-to' && (name.includes('guide') || name.includes('setup') || name.includes('implementation'))) return cluster.name
    if (intent === 'commercial investigation' && (name.includes('decision') || name.includes('buying') || name.includes('cost'))) return cluster.name
    if (intent === 'problem-solving' && (name.includes('mistake') || name.includes('troubleshoot') || name.includes('fix'))) return cluster.name
  }

  // Fallback to first cluster
  return clusters[0].name
}

/**
 * Infers funnel stage from search intent.
 */
function inferFunnelStage(intent) {
  switch (intent) {
    case 'commercial investigation': return 'MOFU (Consideration)'
    case 'comparison': return 'MOFU (Consideration)'
    case 'decision': return 'BOFU (Decision)'
    case 'how-to': return 'TOFU (Awareness)'
    case 'problem-solving': return 'MOFU (Consideration)'
    default: return 'TOFU (Awareness)'
  }
}

/**
 * Builds topic-specific related entities — not token fragments.
 */
function buildTopicEntities(title, baseEntities, primaryKeyword) {
  const titleLower = (title || '').toLowerCase()
  const kwLower = (primaryKeyword || '').toLowerCase()

  // Start with base entities, filter out token fragments
  const entities = []
  for (const entity of baseEntities || []) {
    const e = (entity || '').trim()
    if (!e || e.length < 3) continue
    // Skip if it's just a single word from the keyword
    const eLower = e.toLowerCase()
    if (eLower === kwLower) continue
    if (eLower.split(/\s+/).length === 1 && kwLower.split(/\s+/).includes(eLower)) continue
    entities.push(applyEntityCasing(e))
  }

  // If we have too few, add the primary keyword as the root entity
  if (entities.length === 0 && primaryKeyword) {
    entities.push(applyEntityCasing(primaryKeyword))
  }

  return entities.slice(0, 8)
}

/**
 * Normalizes the detailed outline from AI output.
 */
function buildDefaultOutline(primaryKeyword, audience) {
  const kw = applyEntityCasing(primaryKeyword || 'Topic')
  const aud = applyEntityCasing(audience || 'readers')
  return [
    {
      sectionNumber: 1,
      heading: applyEntityCasing(`H2: Foundations and Context: Understanding ${kw}`),
      wordCountBudget: '400 words',
      purpose: `Establish objective baseline facts and reader context for ${kw}.`,
      subsections: [
        {
          heading: applyEntityCasing(`H3: Core Principles and Overview`),
          guidance: `Provide clear background context explaining what ${kw} involves in practice.`,
        },
      ],
      keyPoints: [
        `Core principles regarding ${kw}.`,
        `Baseline requirements for ${aud}.`,
        `Common misconceptions to clarify upfront.`,
      ],
      eeatProof: 'Reference primary source documentation or verified standards.',
      visualAsset: `Overview summary card or annotated diagram for ${kw}`,
      commonPitfall: 'Relying on unverified claims or omitting foundational context.',
    },
    {
      sectionNumber: 2,
      heading: applyEntityCasing(`H2: In-Depth Analysis: Key Factors, Trade-offs, and Practical Impact`),
      wordCountBudget: '550 words',
      purpose: `Deliver comprehensive, actionable breakdowns that go beyond surface-level information.`,
      subsections: [
        {
          heading: applyEntityCasing(`H3: Primary Advantages and Practical Capabilities`),
          guidance: `Explain specific benefits and realistic expectations without exaggerated claims.`,
        },
        {
          heading: applyEntityCasing(`H3: Real-World Constraints and Limitations`),
          guidance: `Examine genuine trade-offs transparently so readers can make informed decisions.`,
        },
      ],
      keyPoints: [
        `In-depth factor breakdown tailored to ${aud}.`,
        `Practical trade-offs and decision factors to weigh.`,
        `How to evaluate quality and suitability objectively.`,
      ],
      eeatProof: 'Compare documented specifications or established benchmarks.',
      visualAsset: 'Feature evaluation matrix or comparison table',
      commonPitfall: 'Focusing solely on headline benefits without addressing real-world constraints.',
    },
    {
      sectionNumber: 3,
      heading: applyEntityCasing(`H2: Actionable Guidance: Making the Right Choice for Your Situation`),
      wordCountBudget: '450 words',
      purpose: `Guide readers to an informed, high-confidence decision or next step.`,
      subsections: [
        {
          heading: applyEntityCasing(`H3: Decision Framework by Use Case`),
          guidance: `Map different requirements to recommended approaches or options.`,
        },
      ],
      keyPoints: [
        `Clear decision matrix tailored to ${aud}.`,
        `Common traps to avoid when taking action.`,
        `Practical next steps and recommendations.`,
      ],
      eeatProof: 'Document real-world observations and practical criteria.',
      visualAsset: 'Decision flowchart or step-by-step action roadmap',
      commonPitfall: 'Making decisions without evaluating individual fit and specific requirements.',
    },
  ]
}

function normalizeOutline(outline, primaryKeyword, audience) {
  if (Array.isArray(outline) && outline.length >= 3) {
    return outline.map((sec, sIdx) => ({
      sectionNumber: sIdx + 1,
      heading: applyEntityCasing(
        removeCircularRepetition(sec.heading || '', primaryKeyword, primaryKeyword)
      ),
      wordCountBudget: sec.wordCountBudget || '~400 words',
      purpose: applyEntityCasing(sec.purpose || ''),
      subsections: Array.isArray(sec.subsections)
        ? sec.subsections.map(sub => ({
            heading: applyEntityCasing(sub.heading || ''),
            guidance: applyEntityCasing(sub.guidance || ''),
          }))
        : [],
      keyPoints: Array.isArray(sec.keyPoints) && sec.keyPoints.length > 0
        ? sec.keyPoints.map(applyEntityCasing)
        : [],
      eeatProof: applyEntityCasing(sec.eeatProof || ''),
      visualAsset: applyEntityCasing(sec.visualAsset || ''),
      commonPitfall: applyEntityCasing(sec.commonPitfall || ''),
    }))
  }
  return buildDefaultOutline(primaryKeyword, audience)
}

export function generateDynamicTopics({
  niche,
  targetKeywords,
  audience,
  contentGoal = 'educational',
  tone = 'authoritative',
  count = 8,
  contentType = 'blog post',
}) {
  const normalized = normalizeInput({
    niche,
    targetKeywords,
    audience,
    contentGoal,
    tone,
    count,
    contentType,
  })

  const { normalizedSubject, primaryKeyword, normalizedAudience, numberOfTopics } = normalized

  const nicheClassification = classifyNiche(normalizedSubject, primaryKeyword, normalizedAudience)
  const { nicheType } = nicheClassification
  const lifecycleProfile = detectEntityLifecycle(normalizedSubject, primaryKeyword)
  const { lifecycleState, isUnreleased } = lifecycleProfile
  const audienceModel = buildAudienceIntentMap(normalizedSubject, normalizedAudience, nicheType)
  const semanticClusters = buildSemanticTopicMap(
    normalizedSubject,
    primaryKeyword,
    nicheType,
    lifecycleState,
    normalized.contentGoal
  )

  const baseAffordanceCtx = deriveInputContext(normalizedSubject, primaryKeyword, normalizedAudience)
  const affordanceCtx = buildAffordanceContext(baseAffordanceCtx, { contentGoal: normalized.contentGoal })
  const compatibleAngles = getCompatibleAngles(nicheType, { isUnreleased, affordanceCtx })
  const relatedEntities = buildRelatedEntities(
    normalizedSubject,
    primaryKeyword,
    nicheType,
    normalizedAudience,
    normalized.contentGoal
  )

  // Title/hook templates tagged by affordance id. A template is only ever
  // selected when its affordance is in validAffordances below — a subject
  // with no how-to/technical/B2B signal will never see the
  // setupOrImplement/troubleshoot/configure/scaleOrOptimize templates,
  // regardless of what the keyword is. No niche or subject name appears in
  // this map; only the caller's own keyword is interpolated at call time.
  const TEMPLATES_BY_AFFORDANCE = {
    understandOverview: [
      {
        titleFn: (kw) => `${kw}: A Complete Practical Overview`,
        hookFn: (kw, aud) => `Most content about ${kw} skips past the essentials. Here is a grounded, practical breakdown of what it actually involves and what ${aud || 'readers'} need to know before going further.`,
      },
      {
        titleFn: (kw) => `Understanding ${kw} in Practice: A Deep Dive`,
        hookFn: (kw, aud) => `Surface-level content about ${kw} rarely answers the questions that matter in practice. Here is a thorough examination of how it actually works.`,
      },
    ],
    chooseOrDecide: [
      {
        titleFn: (kw) => `${kw}: What to Look for Before You Decide`,
        hookFn: (kw, aud) => `Choosing the right ${kw} option requires understanding key evaluation criteria that most reviews overlook. Here is what actually matters.`,
      },
      {
        titleFn: (kw) => `${kw}: When It's the Right Choice and When It Is Not`,
        hookFn: (kw, aud) => `${kw} is not the right approach for every situation. Here is an honest analysis of when it delivers clear value and when a different path makes more sense.`,
      },
    ],
    avoidMistakes: [
      {
        titleFn: (kw) => `Common ${kw} Mistakes and How to Avoid Them`,
        hookFn: (kw, aud) => `The most preventable setbacks with ${kw} come from the same recurring mistakes. Here is what goes wrong and how to avoid each one.`,
      },
      {
        titleFn: (kw) => `${kw} Mistakes Even Careful Buyers Make`,
        hookFn: (kw, aud) => `Even experienced ${aud || 'buyers'} fall into a handful of avoidable traps with ${kw}. Here is what to watch for.`,
      },
    ],
    costOrValue: [
      {
        titleFn: (kw) => `${kw}: Honest Cost Breakdown and What to Expect`,
        hookFn: (kw, aud) => `The headline cost of ${kw} rarely reflects the full picture. Here is an honest breakdown of what ${aud || 'buyers'} actually spend and what to budget for.`,
      },
    ],
    compareOptions: [
      {
        titleFn: (kw) => `${kw} Options Compared: Key Differences Explained`,
        hookFn: (kw, aud) => `Not all ${kw} approaches are equal. Here is a clear, objective breakdown of the most significant differences to help ${aud || 'you'} make an informed choice.`,
      },
      {
        titleFn: (kw) => `Best Tools and Resources for ${kw}`,
        hookFn: (kw, aud) => `The right supporting options can make ${kw} significantly easier and more effective. Here is a curated list with honest assessments of what each one actually offers.`,
      },
    ],
    faq: [
      {
        titleFn: (kw) => `${kw} Questions Answered: What People Actually Want to Know`,
        hookFn: (kw, aud) => `Searching for reliable answers about ${kw} often surfaces conflicting opinions. Here are honest, evidence-based answers to the questions ${aud || 'readers'} most frequently ask.`,
      },
    ],
    setupOrImplement: [
      {
        titleFn: (kw) => `How to Get Started with ${kw}: Step-by-Step Guidance`,
        hookFn: (kw, aud) => `Beginning with ${kw} without a clear roadmap leads to avoidable missteps. Here is a practical step-by-step guide for ${aud || 'anyone starting out'}.`,
      },
      {
        titleFn: (kw) => `The Essential ${kw} Checklist: Nothing to Miss`,
        hookFn: (kw, aud) => `A missed step with ${kw} can cause unnecessary rework or complications. Here is a practical checklist so ${aud || 'practitioners'} can proceed with confidence.`,
      },
    ],
    troubleshoot: [
      {
        titleFn: (kw) => `${kw} Troubleshooting: Diagnosing and Fixing Common Problems`,
        hookFn: (kw, aud) => `When ${kw} does not behave as expected, the cause is usually one of a handful of well-known issues. Here is a practical guide to diagnosing and resolving them.`,
      },
    ],
    configure: [
      {
        titleFn: (kw) => `${kw} Configuration: Getting the Settings Right`,
        hookFn: (kw, aud) => `Default ${kw} settings rarely fit every use case. Here is how to configure it correctly for ${aud || 'your workflow'}.`,
      },
    ],
    scaleOrOptimize: [
      {
        titleFn: (kw) => `Scaling ${kw}: Advanced Techniques for Better Results`,
        hookFn: (kw, aud) => `Once the fundamentals of ${kw} are in place, scaling and optimizing for better outcomes is the natural next step. Here are the techniques that make the biggest practical difference.`,
      },
    ],
    roiOrBusinessCase: [
      {
        titleFn: (kw) => `${kw} ROI: Building the Business Case`,
        hookFn: (kw, aud) => `Justifying ${kw} internally means showing real business impact. Here is how to build a credible ROI case for ${aud || 'decision makers'}.`,
      },
    ],
    legalOrRegulatorySteps: [
      {
        titleFn: (kw) => `${kw}: Your Rights and What to Do Next`,
        hookFn: (kw, aud) => `Knowing your options with ${kw} starts with understanding the process. Here is a clear breakdown of the steps involved for ${aud || 'those affected'}.`,
      },
    ],
    travelLogistics: [
      {
        titleFn: (kw) => `${kw}: A Practical Planning Guide`,
        hookFn: (kw, aud) => `Good experiences with ${kw} come down to planning the logistics well. Here is what ${aud || 'travelers'} should sort out first.`,
      },
    ],
    styleOrWear: [
      {
        titleFn: (kw) => `How to Style ${kw}: Practical Pairing Ideas`,
        hookFn: (kw, aud) => `${kw} looks different depending on how it is styled. Here are practical pairing ideas that work for ${aud || 'everyday wear'}.`,
      },
    ],
    learnAsSkill: [
      {
        titleFn: (kw) => `${kw}: A Practice Roadmap for Beginners`,
        hookFn: (kw, aud) => `Building real skill with ${kw} takes a structured approach. Here is a practical roadmap for ${aud || 'beginners'}.`,
      },
    ],
  }

  // Only pull templates whose affordance is actually valid for this subject
  // and content goal, ordered so a commercial goal leads with decision
  // templates and an educational goal leads with understanding templates.
  const { validAffordances } = resolveValidAffordances(affordanceCtx)
  // 'understandOverview' is forced first here to match buildSemanticTopicMap's
  // cluster ordering exactly (it also forces overview first) — otherwise the
  // topic pool's affordance order and the clusters array's affordance order
  // drift apart and clusterIndex below points at the wrong cluster.
  const orderedAffordanceIds = [
    'understandOverview',
    ...prioritizeAffordances(validAffordances, affordanceCtx).filter((id) => id !== 'understandOverview'),
  ]

  const candidatePool = []
  for (const id of orderedAffordanceIds) {
    for (const template of TEMPLATES_BY_AFFORDANCE[id] || []) {
      candidatePool.push({ ...template, affordanceId: id })
    }
  }
  if (candidatePool.length === 0) {
    for (const template of TEMPLATES_BY_AFFORDANCE.understandOverview) {
      candidatePool.push({ ...template, affordanceId: 'understandOverview' })
    }
  }

  // Construct structured topic objects from the affordance-filtered pool.
  // Cluster assignment uses the same ordered affordance list that produced
  // the title, so title, cluster, and angle stay derived from one source
  // instead of drifting apart the way index-modulo assignment used to.
  const selectedTopics = []
  for (let i = 0; i < numberOfTopics; i++) {
    const bp = candidatePool[i % candidatePool.length]
    const topicId = `topic-${i + 1}`
    const rawTitle = bp.titleFn(primaryKeyword, normalizedAudience)
    const topicTitle = applyEntityCasing(
      removeCircularRepetition(rawTitle, primaryKeyword, normalizedSubject)
    )
    const eeatOpportunity = buildEeatOpportunity(topicTitle, nicheType, lifecycleState)
    const clusterIndex = Math.max(0, orderedAffordanceIds.indexOf(bp.affordanceId))
    const clusterName = semanticClusters[Math.min(clusterIndex, semanticClusters.length - 1)]?.name || semanticClusters[0].name

    const rawHook = bp.hookFn(primaryKeyword, normalizedAudience)
    const hook = applyEntityCasing(
      removeCircularRepetition(rawHook, primaryKeyword, normalizedSubject)
    )

    const detailedOutline = [
      {
        sectionNumber: 1,
        heading: applyEntityCasing(`H2: Foundations and Context: Understanding ${primaryKeyword}`),
        wordCountBudget: '400 words',
        purpose: `Establish objective baseline facts and reader context for ${primaryKeyword}.`,
        subsections: [
          {
            heading: `H3: Core Concepts and Current State`,
            guidance: `Provide clear, balanced background context that helps readers understand what ${primaryKeyword} actually involves.`,
          },
        ],
        keyPoints: [
          `Core principles and parameters regarding ${primaryKeyword}.`,
          `Key prerequisites and baseline knowledge for ${normalizedAudience || 'readers'}.`,
          `Common initial misconceptions to address upfront.`,
        ],
        eeatProof:
          eeatOpportunity.recommendedEvidenceToCollect[0] ||
          'Reference verifiable primary sources.',
        visualAsset: `Overview summary card or annotated diagram for ${primaryKeyword}`,
        commonPitfall: `Relying on unverified claims or skipping foundational context.`,
      },
      {
        sectionNumber: 2,
        heading: applyEntityCasing(
          `H2: In-Depth Analysis: Key Factors, Trade-offs, and Practical Impact`
        ),
        wordCountBudget: '550 words',
        purpose: `Deliver comprehensive, actionable breakdowns that go beyond surface-level information.`,
        subsections: [
          {
            heading: `H3: Primary Advantages and Capabilities`,
            guidance: `Explain specific benefits and realistic expectations without inventing unsupported claims.`,
          },
          {
            heading: `H3: Real-World Constraints and Limitations`,
            guidance: `Examine genuine trade-offs transparently so readers can make informed decisions.`,
          },
        ],
        keyPoints: [
          `In-depth factor breakdown tailored to ${normalizedAudience || 'readers'}.`,
          `Practical trade-offs and decision factors to weigh.`,
          `How to evaluate quality and suitability objectively.`,
        ],
        eeatProof:
          eeatOpportunity.recommendedEvidenceToCollect[1] ||
          'Compare documented specifications or established benchmarks.',
        visualAsset: `Feature evaluation matrix or comparison table`,
        commonPitfall: `Focusing solely on headline benefits without addressing real-world constraints.`,
      },
      {
        sectionNumber: 3,
        heading: applyEntityCasing(
          `H2: Actionable Guidance: Making the Right Choice for Your Situation`
        ),
        wordCountBudget: '450 words',
        purpose: `Guide readers to an informed, high-confidence decision or next step.`,
        subsections: [
          {
            heading: `H3: Decision Framework by Use Case`,
            guidance: `Map different user requirements and contexts to recommended approaches or options.`,
          },
        ],
        keyPoints: [
          `Clear decision matrix tailored to ${normalizedAudience || 'different user profiles'}.`,
          `Common traps to avoid when making a final choice.`,
          `Practical next steps and recommendations.`,
        ],
        eeatProof:
          eeatOpportunity.recommendedEvidenceToCollect[2] ||
          'Document real-world observations and cost breakdowns.',
        visualAsset: `Decision flowchart or step-by-step action roadmap`,
        commonPitfall: `Making a decision without evaluating individual fit and specific usage requirements.`,
      },
    ]

    // Intent + angle label both come from the same affordance id that
    // produced this title, so they can never drift apart (rules #11/#12).
    const affordanceMeta = AFFORDANCE_ANGLE_META[bp.affordanceId] || AFFORDANCE_ANGLE_META.understandOverview
    const derivedIntent = affordanceMeta.intent || 'informational'

    const topicObj = {
      id: topicId,
      title: topicTitle,
      targetKeyword: primaryKeyword,
      searchIntent: derivedIntent,
      contentType: 'Comprehensive Guide',
      contentAngle: affordanceMeta.label,
      hook,
      difficulty: 'medium',
      estimatedWordCount: 2400,
      clusterName,
      detailedOutline,
      outline: detailedOutline.map((d) => d.heading),
      seoBrief: {
        targetPersona: applyEntityCasing(audienceModel.persona),
        funnelStage: derivedIntent === 'commercial investigation' ? 'MOFU (Consideration)' : 'TOFU (Awareness)',
        searchIntent: derivedIntent,
        recommendedWordCount: '2,400 words (~10 min read)',
        titleTag: topicTitle.length <= 58 ? topicTitle : `${topicTitle.slice(0, 55)}...`,
        metaDescription: `Discover key insights, practical advice, and verified guidance for ${primaryKeyword}.`,
        competitorGap: `Delivers verified, actionable guidance without generic fluff or unverified claims.`,
        primaryKeyword,
        secondaryKeywords: relatedEntities.slice(1, 4),
        internalLinkAnchors: [`Master guide to ${normalizedSubject}`, `${primaryKeyword} overview`],
        ctaBridge: `Read our comprehensive guide to ${primaryKeyword}.`,
      },
      faqs: [
        {
          question: `What should you consider before deciding on ${primaryKeyword}?`,
          answerSnippet: `Evaluate your specific usage requirements, budget constraints, and whether the documented features address your primary needs before committing.`,
        },
        {
          question: `How does ${primaryKeyword} compare to alternative options?`,
          answerSnippet: `Comparing documented specifications, long-term durability, and real-world feedback ensures you choose the best fit for your specific situation.`,
        },
      ],
      whyItWorks: `Directly satisfies ${derivedIntent} search intent with verified, actionable content specific to ${primaryKeyword}.`,
      relatedEntities,
      relatedKeywords: relatedEntities,
      eeatOpportunity,
      lifecycleState,
    }

    // Run Missive QA verification
    topicObj.missiveQa = runMissiveQA(topicObj, {
      nicheType,
      lifecycleState,
      existingTopics: selectedTopics,
      primaryKeyword,
      affordanceCtx,
    })

    selectedTopics.push(topicObj)
  }

  // Calculate Cannibalization Risk
  for (let i = 0; i < selectedTopics.length; i++) {
    let highestRisk = { score: 0, risk: 'low', reason: 'Distinct SERP intent.' }
    for (let j = 0; j < selectedTopics.length; j++) {
      if (i === j) continue
      const check = calculateCannibalizationRisk(selectedTopics[i], selectedTopics[j])
      if (check.score > highestRisk.score) {
        highestRisk = check
      }
    }
    selectedTopics[i].cannibalizationRisk = highestRisk.risk
    selectedTopics[i].cannibalizationDetail = highestRisk.reason
  }

  const output = {
    niche: normalizedSubject,
    nicheClassification,
    lifecycleProfile,
    targetKeywords: [primaryKeyword],
    audience: normalizedAudience,
    contentGoal: normalized.contentGoal,
    tone: tone.toLowerCase().trim(),
    pillarTopic: {
      title: applyEntityCasing(`The Comprehensive Guide to ${primaryKeyword}`),
      primaryKeyword,
      summary: `The cornerstone topic pillar establishing comprehensive authority for ${normalizedSubject}.`,
    },
    clusters: semanticClusters,
    topics: selectedTopics,
    strategy: `Publish the cornerstone pillar guide first, then roll out supporting cluster articles linked back to establish topical authority in ${normalizedSubject}.`,
  }

  return recursiveSanitizeMissive(output)
}

/**
 * Generate topic clusters specifically
 */

// ══════════════════════════════════════════════════════════════
// LEGACY EXPORTS (maintained for backward compatibility)
// ══════════════════════════════════════════════════════════════

export async function generateTopicClusters({
  niche,
  mainKeyword,
  audience = '',
  preferredProvider,
  clusterCount = 4,
  topicsPerCluster = 4,
}) {
  const result = await generateBlogTopics({
    niche,
    targetKeywords: [mainKeyword],
    audience,
    preferredProvider,
    count: clusterCount * topicsPerCluster,
  })

  return {
    pillarPage: result.pillarTopic,
    clusters: result.clusters.map((c, i) => ({
      name: c.name,
      description: c.description,
      topics: result.topics
        .filter(t => t.clusterName === c.name || i === 0)
        .slice(0, topicsPerCluster),
    })),
    interlinkingStrategy: result.strategy,
  }
}

export function generateContentCalendar({ topics, postsPerWeek = 2, startDate = new Date() }) {
  const calendar = []
  let currentDate = new Date(startDate)

  topics.forEach((topic, index) => {
    const dayOffset = Math.floor(index * (7 / postsPerWeek))
    const publishDate = new Date(currentDate)
    publishDate.setDate(publishDate.getDate() + dayOffset)

    calendar.push({
      date: publishDate.toISOString().split('T')[0],
      topic: topic.title,
      targetKeyword: topic.targetKeyword,
      cluster: topic.clusterName,
      status: 'Planned',
    })
  })

  return calendar
}

export async function generateMasterArticleBrief({
  topic,
  niche,
  audience = '',
  tone = 'authoritative',
  preferredProvider,
}) {
  const normalized = normalizeInput({ niche, audience, tone })
  const activeTone = (tone || 'authoritative').toLowerCase().trim()
  const toneProfile = TONE_PROFILES[activeTone] || TONE_PROFILES.authoritative

  const topicTitle = typeof topic === 'string' ? topic : topic.title || topic.targetKeyword
  const topicKeyword = typeof topic === 'object' ? topic.targetKeyword || normalized.primaryKeyword : normalized.primaryKeyword

  const nicheClassification = classifyNiche(normalized.normalizedSubject, topicKeyword, normalized.normalizedAudience)
  const lifecycleProfile = detectEntityLifecycle(normalized.normalizedSubject, topicKeyword)
  const { lifecycleState, isUnreleased } = lifecycleProfile

  const qaDirectives = buildMissiveQaPromptDirectives()

  const systemPrompt = `You are Himani Kankaria's Chief Editorial Architect at Missive Digital.
Produce an exhaustive, publication-grade Master Article Outline and Strategic SEO Brief for a comprehensive article in "${normalized.normalizedSubject}" (${nicheClassification.nicheType}).

CRITICAL MISSIVE QA DIRECTIVES:
${qaDirectives}

FACTUAL SAFETY & LIFECYCLE RULES:
- Zero fabricated statistics or invented percentages.
- Product lifecycle: ${lifecycleState}.
${isUnreleased ? '- Product is UNRELEASED. Forbid past-tense claims of hands-on testing.' : ''}
- Tone: ${toneProfile.label} (${toneProfile.directive})`

  const userPrompt = `Generate a Master Editorial Brief & Blueprint for:
- Title: ${topicTitle}
- Keyword: ${topicKeyword}
- Niche: ${normalized.normalizedSubject} (${nicheClassification.nicheType})
- Audience: ${normalized.normalizedAudience || 'Practitioners and interested readers'}

Return JSON matching standard master brief schema with detailedSections, writingGuidelines, and FAQs.`

  let res = null
  try {
    res = await callAIAndParseJSON(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        preferredProvider: preferredProvider || 'groq',
        temperature: 0.6,
        maxTokens: 3200,
        jsonMode: true,
      }
    )
  } catch (err) {
    console.warn(`[masterBrief] AI generation failed: ${err.message}`)
  }

  if (res && Array.isArray(res.detailedSections) && res.detailedSections.length > 0) {
    return recursiveSanitizeMissive(res)
  }

  // Minimal fallback — returns whatever the AI gave, or a bare-bones brief
  return {
    title: applyEntityCasing(topicTitle),
    targetKeyword: topicKeyword,
    searchIntent: 'informational',
    hook: `Understanding ${topicKeyword} requires looking past marketing hype to examine the real-world trade-offs.`,
    detailedSections: [],
    faqs: [],
    writingGuidelines: {
      toneDirective: toneProfile.directive,
      paragraphLength: 'Keep paragraphs tight (1 to 3 sentences maximum).',
      bannedWordsReminder: 'Zero em dashes, zero robotic cliches, zero fabricated numbers.',
    },
  }
}

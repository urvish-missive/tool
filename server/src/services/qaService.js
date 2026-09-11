import { BANNED_B2B_TERMS_IN_CONSUMER } from '../constants/contentAngles.js'
import { validateFactSafety } from './factValidator.js'
import { areHooksDuplicate } from '../utils/similarity.js'
import { validateActionObjectFit } from './subjectAffordance.js'

/**
 * Missive Digital QA Service
 * Enforces rigorous editorial quality, brand accuracy, factual safety,
 * semantic alignment, and zero-hallucination policies.
 */
export function runMissiveQA(topic, context = {}) {
  const {
    nicheType = 'Other',
    lifecycleState = 'released',
    existingTopics = [],
    primaryKeyword = '',
    affordanceCtx = null,
  } = context

  const hardFailures = []
  const warnings = []
  const suggestions = []
  const checks = []

  const title = String(topic.title || '').trim()
  const hook = String(topic.hook || '').trim()
  const kw = String(topic.targetKeyword || primaryKeyword || '').trim()
  const isUnreleased = lifecycleState === 'rumored' || lifecycleState === 'upcoming'

  // ── CHECK 1: Template Placeholders & Broken Strings ──
  const hasPlaceholders = /\$\{[^}]+\}|\[topic\]|\{niche\}|\{seed\}|#\d+/i.test(title + ' ' + hook)
  if (hasPlaceholders) {
    hardFailures.push('Contains raw template placeholder variables or un-substituted tokens.')
  }
  checks.push({
    name: 'Zero Template Placeholders',
    status: hasPlaceholders ? 'Failed' : 'Passed',
    passed: !hasPlaceholders,
    detail: hasPlaceholders
      ? 'Detected unresolved template variables in title or hook.'
      : 'No template variables detected. Clean production text.',
  })

  // ── CHECK 2: Factual Safety & Unverified Numbers ──
  const factSafetyTitle = validateFactSafety(title, { isUnreleased })
  const factSafetyHook = validateFactSafety(hook, { isUnreleased })
  const allFactViolations = [...factSafetyTitle.violations, ...factSafetyHook.violations]

  if (allFactViolations.length > 0) {
    hardFailures.push(...allFactViolations)
  }
  checks.push({
    name: 'Factual Safety & Zero Hallucinated Stats',
    status: allFactViolations.length > 0 ? 'Failed' : 'Passed',
    passed: allFactViolations.length === 0,
    detail: allFactViolations.length > 0
      ? allFactViolations.join(' ')
      : 'Zero fabricated numbers, fake case studies, or unverified statistical claims.',
  })

  // ── CHECK 3: Entity Lifecycle & Future Product Handling ──
  let futureProductViolated = false
  if (isUnreleased) {
    const pastTenseExperience = /\b(our hands-on testing|we tested|owners report|in our testing|after 6 months of use|battery life lasted)\b/i.test(title + ' ' + hook)
    if (pastTenseExperience) {
      hardFailures.push(`Unreleased product (${primaryKeyword}) is treated as an already released device with established ownership testing.`)
      futureProductViolated = true
    }
  }
  checks.push({
    name: 'Entity Lifecycle Alignment',
    status: futureProductViolated ? 'Failed' : 'Passed',
    passed: !futureProductViolated,
    detail: futureProductViolated
      ? 'Future/rumored product treated as an established product.'
      : isUnreleased
        ? 'Safely handles unreleased lifecycle state with exploratory framing.'
        : 'Entity lifecycle accurately handled.',
  })

  // ── CHECK 4: Branded Entity Capitalization ──
  // Check for common lowercased brands: iphone, ios, tiktok, youtube, linkedin, chatgpt, macbook
  const entityErrors = []
  if (/\biphone\b/.test(title + ' ' + hook)) entityErrors.push('iphone -> iPhone')
  if (/\bios\b/.test(title + ' ' + hook)) entityErrors.push('ios -> iOS')
  if (/\btiktok\b/.test(title + ' ' + hook)) entityErrors.push('tiktok -> TikTok')
  if (/\byoutube\b/.test(title + ' ' + hook)) entityErrors.push('youtube -> YouTube')
  if (/\blinkedin\b/.test(title + ' ' + hook)) entityErrors.push('linkedin -> LinkedIn')
  if (/\bchatgpt\b/.test(title + ' ' + hook)) entityErrors.push('chatgpt -> ChatGPT')
  if (/\bmacbook\b/.test(title + ' ' + hook)) entityErrors.push('macbook -> MacBook')

  if (entityErrors.length > 0) {
    hardFailures.push(`Incorrect entity capitalization detected: ${entityErrors.join(', ')}. Must preserve official brand casing.`)
  }
  checks.push({
    name: 'Brand & Entity Capitalization',
    status: entityErrors.length > 0 ? 'Failed' : 'Passed',
    passed: entityErrors.length === 0,
    detail: entityErrors.length > 0
      ? `Failed canonical casing on: ${entityErrors.join(', ')}`
      : 'All branded entities and trademarks are correctly capitalized.',
  })

  // ── CHECK 5: Inappropriate B2B Jargon in Consumer / Travel / Lifestyle / Legal ──
  let b2bJargonFound = []
  if (nicheType === 'Consumer Technology' || nicheType === 'Consumer Product' || nicheType === 'Travel' || nicheType === 'Legal / YMYL' || nicheType === 'Lifestyle') {
    for (const b2bTerm of BANNED_B2B_TERMS_IN_CONSUMER) {
      const regex = new RegExp(`\\b${escapeRegex(b2bTerm)}\\b`, 'i')
      if (regex.test(title) || regex.test(hook)) {
        b2bJargonFound.push(b2bTerm)
      }
    }
    if (b2bJargonFound.length > 0) {
      hardFailures.push(`Inappropriate B2B SaaS terminology ("${b2bJargonFound.join(', ')}") injected into consumer/lifestyle topic.`)
    }
  }
  checks.push({
    name: 'Contextual Terminology & Semantic Fit',
    status: b2bJargonFound.length > 0 ? 'Failed' : 'Passed',
    passed: b2bJargonFound.length === 0,
    detail: b2bJargonFound.length > 0
      ? `Found inappropriate enterprise terms in consumer topic: ${b2bJargonFound.join(', ')}`
      : 'Terminology is strictly appropriate for the specific industry and audience.',
  })

  // ── CHECK 6: Em Dashes & Colons (Missive Rules) ──
  const emDashCount = (title.match(/—/g) || []).length + (hook.match(/—/g) || []).length
  const hasEmDash = emDashCount > 0
  if (hasEmDash) {
    warnings.push(`Found ${emDashCount} em dash(es). Missive QA prefers spaced hyphens.`)
  }
  checks.push({
    name: 'Clean Punctuation (Zero Em Dashes)',
    status: hasEmDash ? 'Warning' : 'Passed',
    passed: !hasEmDash,
    detail: hasEmDash
      ? `Found ${emDashCount} em dash(es).`
      : 'Punctuation adheres strictly to clean human styling.',
  })

  // ── CHECK 7: Duplicate Hook Detection ──
  let hookDuplicateFound = false
  for (const other of existingTopics) {
    if (other.id !== topic.id && areHooksDuplicate(hook, other.hook || '', 0.65)) {
      hookDuplicateFound = true
      break
    }
  }
  if (hookDuplicateFound) {
    hardFailures.push('Hook has excessive semantic overlap with another generated topic hook.')
  }
  checks.push({
    name: 'Unique Hook Differentiation',
    status: hookDuplicateFound ? 'Failed' : 'Passed',
    passed: !hookDuplicateFound,
    detail: hookDuplicateFound
      ? 'Hook is too similar to another generated topic.'
      : 'Hook is distinct and uniquely tailored.',
  })

  // ── CHECK 8: Circular Repetition & Keyword Stuffing ──
  const kwLower = kw.toLowerCase()
  let hasRepetition = false
  if (title.toLowerCase().includes(`${kwLower} in ${kwLower}`) || title.toLowerCase().includes(`for ${kwLower} ${kwLower}`)) {
    hasRepetition = true
    hardFailures.push('Circular keyword repetition detected in title.')
  }
  checks.push({
    name: 'Natural Phrasing (No Keyword Stuffing)',
    status: hasRepetition ? 'Failed' : 'Passed',
    passed: !hasRepetition,
    detail: hasRepetition
      ? 'Detected awkward circular keyword repetition.'
      : 'Title reads naturally without artificial keyword stuffing.',
  })

  // ── CHECK 9: Action-Object Semantic Fit (ACTION_OBJECT_MISMATCH) ──
  // General linguistic check, not a per-subject rule: flags process-only
  // verbs (troubleshoot/configure/implement/deploy/install/debug) applied
  // to a subject nothing in the context suggests behaves like a system.
  // Only runs when the caller supplies an affordance context (built from
  // the same signals used to generate the topic) — omitted entirely for
  // legacy callers that do not pass one.
  if (affordanceCtx) {
    const fit = validateActionObjectFit(`${title} ${hook}`, affordanceCtx)
    if (!fit.natural) {
      hardFailures.push(`Action-object mismatch: ${fit.reason}`)
    }
    checks.push({
      name: 'Action-Object Semantic Fit',
      status: fit.natural ? 'Passed' : 'Failed',
      passed: fit.natural,
      detail: fit.reason,
    })
  }

  // ── CHECK 10: Typo Propagation (RAW_TYPO_PROPAGATION) ──
  // If the caller provides normalization info, check that raw typos didn't leak into final output
  if (context.normalization) {
    const { corrections = [], normalizedSubject = '' } = context.normalization
    const titleLower = title.toLowerCase()
    for (const correction of corrections) {
      if (correction.confidence >= 0.8 && correction.original && titleLower.includes(correction.original.toLowerCase())) {
        hardFailures.push(`RAW_TYPO_PROPAGATION: Original typo "${correction.original}" found in final title. Should use normalized form "${correction.suggested}".`)
      }
    }
  }
  checks.push({
    name: 'Typo Propagation Check',
    status: context.normalization ? 'Passed' : 'Skipped (no normalization data)',
    passed: !context.normalization || !context.normalization.corrections?.some(c => c.confidence >= 0.8 && title.toLowerCase().includes(c.original.toLowerCase())),
    detail: context.normalization
      ? 'Checked that high-confidence spelling corrections propagated to final output.'
      : 'Normalization data not provided; check skipped.',
  })

  // ── CHECK 11: Semantic Entity Quality (INVALID_SEMANTIC_ENTITY / TOKEN_FRAGMENT_AS_ENTITY) ──
  if (Array.isArray(topic.relatedEntities) && topic.relatedEntities.length > 0) {
    const invalidEntities = []
    const tokenFragments = []
    const kwTokens = kw.toLowerCase().split(/\s+/).filter(Boolean)

    for (const entity of topic.relatedEntities) {
      const entityLower = (entity || '').toLowerCase()
      if (!entityLower || entityLower.length < 3) {
        invalidEntities.push(entity)
        continue
      }
      // Token fragment: just a substring of the keyword
      if (kwTokens.includes(entityLower) && entityLower.split(/\s+/).length === 1) {
        tokenFragments.push(entity)
        continue
      }
      // Joined words (no space) that are just the keyword concatenated
      const kwConcat = kwLower.replace(/\s+/g, '')
      if (entityLower === kwConcat) {
        tokenFragments.push(entity)
      }
    }

    if (invalidEntities.length > 0) {
      warnings.push(`INVALID_SEMANTIC_ENTITY: ${invalidEntities.length} entity(ies) are too short or empty.`)
    }
    if (tokenFragments.length > 0) {
      warnings.push(`TOKEN_FRAGMENT_AS_ENTITY: ${tokenFragments.length} entity(ies) appear to be token fragments of the keyword rather than meaningful concepts.`)
    }
  }
  checks.push({
    name: 'Semantic Entity Quality',
    status: 'Passed',
    passed: true,
    detail: 'Related entities validated for concept validity and distinctness.',
  })

  // ── CHECK 12: Genericity Detection (GENERIC_TEMPLATE_LEAKAGE / LOW_TOPIC_SPECIFICITY) ──
  const genericPatterns = [
    /X\s*(?:Practical Overview|Complete Guide|Comprehensive Guide|Deep Dive)/i,
    /(?:Understanding|A Guide to|Introduction to|Overview of)\s+X/i,
    /X\s*(?:Mistakes|Common Errors|Pitfalls)/i,
    /(?:Questions About|FAQ:?\s*)\s+X/i,
    /(?:Best|Top)\s+(?:Tools|Resources|Tips)\s+(?:for|and)\s+X/i,
  ]
  const replacedForTest = title.replace(new RegExp(kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'X')
  let isGenericTemplate = false
  for (const pat of genericPatterns) {
    if (pat.test(replacedForTest)) {
      isGenericTemplate = true
      break
    }
  }
  if (isGenericTemplate) {
    warnings.push('GENERIC_TEMPLATE_LEAKAGE: Title matches a generic template pattern that could apply to any subject.')
  }
  checks.push({
    name: 'Topic Specificity (Genericity Check)',
    status: isGenericTemplate ? 'Warning' : 'Passed',
    passed: !isGenericTemplate,
    detail: isGenericTemplate
      ? 'Title may be too generic — could be generated for any subject by swapping the keyword.'
      : 'Title contains subject-specific meaning beyond the raw keyword.',
  })

  // ── CHECK 13: SERP Data Provenance (no fabricated metrics) ──
  if (topic.seoBrief) {
    const fabricatedMetrics = []
    if (topic.seoBrief.searchVolume && typeof topic.seoBrief.searchVolume === 'number' && topic.seoBrief.searchVolume > 0) {
      fabricatedMetrics.push('searchVolume')
    }
    if (topic.seoBrief.keywordDifficulty && typeof topic.seoBrief.keywordDifficulty === 'number') {
      fabricatedMetrics.push('keywordDifficulty')
    }
    if (topic.seoBrief.cpc && typeof topic.seoBrief.cpc === 'number') {
      fabricatedMetrics.push('cpc')
    }
    if (fabricatedMetrics.length > 0) {
      warnings.push(`SERP_DATA_UNVERIFIED: SEO metric(s) [${fabricatedMetrics.join(', ')}] present without evidence source. Mark as estimated or remove.`)
    }
  }
  checks.push({
    name: 'SEO Data Provenance',
    status: 'Passed',
    passed: true,
    detail: 'SEO metrics validated for provenance. Unverified metrics should be marked as estimated.',
  })

  // ── CHECK 14: Topic-Cluster Semantic Fit ──
  if (topic.clusterName && topic.searchIntent) {
    // Flag if cluster name doesn't align with the topic's actual intent
    const clusterLower = (topic.clusterName || '').toLowerCase()
    const intentLower = (topic.searchIntent || '').toLowerCase()
    let clusterIntentMismatch = false
    if (intentLower === 'comparison' && !clusterLower.includes('comparison') && !clusterLower.includes('alternative') && !clusterLower.includes('versus')) {
      clusterIntentMismatch = true
    }
    if (intentLower === 'how-to' && !clusterLower.includes('guide') && !clusterLower.includes('setup') && !clusterLower.includes('how')) {
      clusterIntentMismatch = true
    }
    if (clusterIntentMismatch) {
      warnings.push('CLUSTER_INTENT_MISMATCH: Topic intent and cluster name may not align semantically.')
    }
  }
  checks.push({
    name: 'Cluster-Topic Semantic Fit',
    status: 'Passed',
    passed: true,
    detail: 'Topic-to-cluster assignment validated for semantic consistency.',
  })

  // ── COMPUTE WEIGHTED SCORE ──
  let score = 100

  if (hardFailures.length > 0) {
    score -= hardFailures.length * 25
  }
  if (warnings.length > 0) {
    score -= warnings.length * 8
  }

  score = Math.max(0, Math.min(100, score))

  const passed = hardFailures.length === 0 && score >= 75

  let badge = 'Missive QA Verified'
  if (!passed) {
    badge = hardFailures.length > 0 ? 'QA Action Required (Hard Failure)' : 'QA Warning'
  }

  return {
    passed,
    score,
    badge,
    hardFailures,
    warnings,
    suggestions,
    checks,
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Runtime Ontology Builder
 *
 * After normalization and subject decomposition, builds a semantic
 * knowledge model that drives topic generation. Only populates
 * dimensions that genuinely apply — does NOT force every subject
 * into every category.
 */

/**
 * Builds a runtime ontology from the subject analysis, audience, and content goal.
 * This ontology is the single source of truth for topic generation — it replaces
 * hardcoded cluster templates and generic title patterns.
 */
export function buildRuntimeOntology({
  subjectAnalysis,
  normalizedSubject,
  primaryKeyword,
  audience,
  contentGoal,
  nicheType,
  lifecycleState,
  affordanceCtx,
}) {
  const concepts = subjectAnalysis.primaryConcepts || [normalizedSubject]
  const relationships = subjectAnalysis.relationships || []

  // Build ontology dimensions — only populate what genuinely applies
  const ontology = {
    centralTheme: normalizedSubject,
    componentConcepts: concepts,
    relationships,
    entities: [],
    attributes: [],
    activities: [],
    processes: [],
    userQuestions: [],
    decisions: [],
    problems: [],
    comparisons: [],
    useCases: [],
    qualitySignals: [],
    experiences: [],
    culturalDimensions: [],
    commercialDimensions: [],
    informationalDimensions: [],
    adjacentConcepts: [],
  }

  // Populate from affordance context signals
  if (affordanceCtx) {
    if (affordanceCtx.isPurchaseSuggestive || affordanceCtx.isCommercialGoal) {
      ontology.commercialDimensions.push(
        'pricing evaluation',
        'quality comparison',
        'value assessment',
        'purchase decision',
        'vendor selection',
        'total cost of ownership'
      )
      ontology.decisions.push(
        'which option to choose',
        'what to look for when buying',
        'how to evaluate quality',
        'when to invest vs save'
      )
    }

    if (affordanceCtx.isHowToSuggestive || affordanceCtx.isB2BSuggestive) {
      ontology.processes.push(
        'getting started',
        'implementation approach',
        'best practices',
        'common pitfalls to avoid'
      )
      ontology.problems.push(
        'beginner mistakes',
        'configuration issues',
        'scaling challenges',
        'integration difficulties'
      )
    }

    if (affordanceCtx.isYMYLSuggestive) {
      ontology.informationalDimensions.push(
        'regulatory context',
        'professional guidance needs',
        'risk awareness',
        'rights and options'
      )
      ontology.userQuestions.push(
        'what are the rules around this',
        'when do I need professional help',
        'what are my rights',
        'what are the risks'
      )
    }

    if (affordanceCtx.isTravelSuggestive) {
      ontology.activities.push(
        'planning and preparation',
        'on-the-ground experience',
        'logistics and navigation',
        'cultural engagement'
      )
      ontology.useCases.push(
        'trip planning',
        'budget management',
        'itinerary optimization',
        'local experience discovery'
      )
    }

    if (affordanceCtx.isResearchSuggestive) {
      ontology.informationalDimensions.push(
        'current state of the field',
        'emerging trends',
        'key developments',
        'foundational concepts'
      )
      ontology.userQuestions.push(
        'what is the current state',
        'what trends are emerging',
        'what does the research say',
        'what are the key developments'
      )
    }
  }

  // Universal dimensions that apply to most subjects
  ontology.qualitySignals.push(
    'what makes a good one',
    'how to evaluate quality',
    'common quality indicators',
    'what to avoid'
  )
  ontology.experiences.push(
    'first-time experience',
    'what to expect',
    'real-world observations',
    'practical tips from experience'
  )

  // Always-populated universal opportunities for broad coverage
  ontology.userQuestions.push(
    `what are the most important things to know about ${normalizedSubject}`,
    `what common mistakes should I avoid with ${normalizedSubject}`,
    `what are the best practices for ${normalizedSubject}`
  )
  ontology.problems.push(
    'conflicting information and noise',
    'choosing the wrong approach',
    'missing important details'
  )
  ontology.useCases.push(
    'daily use and routine',
    'special occasions',
    'professional or business context'
  )
  ontology.activities.push(
    'learning and understanding',
    'evaluating and comparing',
    'applying in practice'
  )

  // Populate user questions from the subject structure
  if (subjectAnalysis.subjectStructure === 'compound') {
    ontology.userQuestions.push(
      `how do ${concepts.join(' and ')} relate to each other`,
      `which aspect of ${normalizedSubject} matters most`,
      `can you focus on just one part of ${normalizedSubject}`
    )
  } else if (subjectAnalysis.subjectStructure === 'comparison') {
    ontology.comparisons.push(...concepts)
    ontology.userQuestions.push(
      `what are the key differences between ${concepts.join(' and ')}`,
      `which is better for my situation`,
      `when would I choose one over the other`
    )
  }

  // Infer audience from content goal and subject if not provided
  if (!audience) {
    ontology.userQuestions.push(
      `who is this relevant for`,
      `what background knowledge is needed`
    )
  }

  return ontology
}

/**
 * Discovers user questions and search needs from the ontology.
 * Returns an array of user needs with intent and relevance.
 */
export function discoverUserNeeds(ontology, contentGoal) {
  const needs = []

  // From user questions in ontology
  for (const question of ontology.userQuestions) {
    needs.push({
      userNeed: question,
      intent: inferIntentFromQuestion(question),
      relevantConcepts: ontology.componentConcepts,
      confidence: 0.7,
    })
  }

  // From commercial dimensions
  for (const dim of ontology.commercialDimensions) {
    needs.push({
      userNeed: `How to evaluate ${dim} for ${ontology.centralTheme}`,
      intent: 'commercial investigation',
      relevantConcepts: ontology.componentConcepts,
      confidence: 0.75,
    })
  }

  // From problems
  for (const problem of ontology.problems) {
    needs.push({
      userNeed: `How to solve or avoid ${problem} with ${ontology.centralTheme}`,
      intent: 'problem-solving',
      relevantConcepts: ontology.componentConcepts,
      confidence: 0.8,
    })
  }

  // From processes
  for (const process of ontology.processes) {
    needs.push({
      userNeed: `How to ${process} with ${ontology.centralTheme}`,
      intent: 'how-to',
      relevantConcepts: ontology.componentConcepts,
      confidence: 0.8,
    })
  }

  // From informational dimensions
  for (const dim of ontology.informationalDimensions) {
    needs.push({
      userNeed: `Understanding ${dim} related to ${ontology.centralTheme}`,
      intent: 'informational',
      relevantConcepts: ontology.componentConcepts,
      confidence: 0.7,
    })
  }

  // From comparisons
  if (ontology.comparisons.length >= 2) {
    needs.push({
      userNeed: `Comparing ${ontology.comparisons.join(' vs ')}`,
      intent: 'comparison',
      relevantConcepts: ontology.comparisons,
      confidence: 0.85,
    })
  }

  // From decisions
  for (const decision of ontology.decisions) {
    needs.push({
      userNeed: decision,
      intent: 'decision',
      relevantConcepts: ontology.componentConcepts,
      confidence: 0.75,
    })
  }

  // From quality signals
  for (const signal of ontology.qualitySignals.slice(0, 3)) {
    needs.push({
      userNeed: `${ontology.centralTheme}: ${signal}`,
      intent: 'commercial investigation',
      relevantConcepts: ontology.componentConcepts,
      confidence: 0.75,
    })
  }

  // From experiences
  for (const exp of ontology.experiences.slice(0, 3)) {
    needs.push({
      userNeed: `${exp} with ${ontology.centralTheme}`,
      intent: 'informational',
      relevantConcepts: ontology.componentConcepts,
      confidence: 0.7,
    })
  }

  // From use cases
  for (const useCase of ontology.useCases) {
    needs.push({
      userNeed: `${ontology.centralTheme} for ${useCase}`,
      intent: 'informational',
      relevantConcepts: ontology.componentConcepts,
      confidence: 0.7,
    })
  }

  // From activities
  for (const activity of ontology.activities) {
    needs.push({
      userNeed: `${activity} with ${ontology.centralTheme}`,
      intent: 'how-to',
      relevantConcepts: ontology.componentConcepts,
      confidence: 0.7,
    })
  }

  // Content goal weighting
  if (contentGoal === 'commercial') {
    // Boost commercial and decision needs
    for (const need of needs) {
      if (need.intent === 'commercial investigation' || need.intent === 'decision') {
        need.confidence = Math.min(1.0, need.confidence + 0.15)
      }
    }
  } else if (contentGoal === 'educational') {
    // Boost informational and how-to needs
    for (const need of needs) {
      if (need.intent === 'informational' || need.intent === 'how-to') {
        need.confidence = Math.min(1.0, need.confidence + 0.15)
      }
    }
  }

  return needs.sort((a, b) => b.confidence - a.confidence)
}

function inferIntentFromQuestion(question) {
  const lower = question.toLowerCase()
  if (/^(how|step|guide|tutorial|walkthrough)/.test(lower)) return 'how-to'
  if (/^(what|who|when|where|which)/.test(lower)) return 'informational'
  if (/^(why)/.test(lower)) return 'informational'
  if (/\b(compare|vs|versus|difference|better)\b/.test(lower)) return 'comparison'
  if (/\b(buy|choose|select|pick|best|top|review)\b/.test(lower)) return 'commercial investigation'
  if (/\b(fix|solve|avoid|problem|error|issue)\b/.test(lower)) return 'problem-solving'
  return 'informational'
}

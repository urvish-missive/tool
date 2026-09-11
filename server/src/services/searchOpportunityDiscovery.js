/**
 * Search Opportunity Discovery
 *
 * Before generating titles, discovers what users might reasonably want to:
 * learn, understand, compare, choose, solve, experience, buy, evaluate,
 * avoid, improve, decide, discover, research.
 *
 * Only generates needs supported by the subject context.
 * Does NOT assume all categories apply.
 */

/**
 * Discovers search opportunities from the ontology and user needs.
 * Each opportunity represents a genuine content gap that can be filled.
 */
export function discoverSearchOpportunities(ontology, userNeeds, contentGoal) {
  const opportunities = []
  const seen = new Set()

  // Convert user needs into search opportunities
  for (const need of userNeeds) {
    const key = need.userNeed.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.has(key)) continue
    seen.add(key)

    opportunities.push({
      userNeed: need.userNeed,
      intent: need.intent,
      relevantConcepts: need.relevantConcepts,
      audienceFit: 'general',
      goalFit: contentGoal || 'educational',
      confidence: need.confidence,
      angle: inferAngleFromIntent(need.intent),
      specificity: inferSpecificityFromNeed(need.userNeed, ontology),
    })
  }

  // Discover opportunities from ontology dimensions
  const ontologyOpportunities = discoverFromOntology(ontology, contentGoal)
  for (const opp of ontologyOpportunities) {
    const key = opp.userNeed.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.has(key)) continue
    seen.add(key)
    opportunities.push(opp)
  }

  // Discover opportunities from component relationships
  if (ontology.relationships && ontology.relationships.length > 0) {
    for (const rel of ontology.relationships) {
      const opp = {
        userNeed: `How ${rel.from} and ${rel.to} relate to each other`,
        intent: 'informational',
        relevantConcepts: [rel.from, rel.to],
        audienceFit: 'general',
        goalFit: contentGoal || 'educational',
        confidence: 0.7,
        angle: 'relationship analysis',
        specificity: 'high',
      }
      const key = opp.userNeed.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!seen.has(key)) {
        seen.add(key)
        opportunities.push(opp)
      }
    }
  }

  return opportunities.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Discovers opportunities directly from ontology dimensions.
 */
function discoverFromOntology(ontology, contentGoal) {
  const opportunities = []
  const theme = ontology.centralTheme

  // Quality and evaluation opportunities
  if (ontology.qualitySignals.length > 0) {
    opportunities.push({
      userNeed: `How to evaluate quality and choose the right ${theme}`,
      intent: 'commercial investigation',
      relevantConcepts: ontology.componentConcepts,
      audienceFit: 'general',
      goalFit: contentGoal,
      confidence: 0.8,
      angle: 'evaluation guide',
      specificity: 'medium',
    })
  }

  // Problem-solving opportunities
  if (ontology.problems.length > 0) {
    for (const problem of ontology.problems.slice(0, 2)) {
      opportunities.push({
        userNeed: `How to address ${problem} with ${theme}`,
        intent: 'problem-solving',
        relevantConcepts: ontology.componentConcepts,
        audienceFit: 'general',
        goalFit: contentGoal,
        confidence: 0.75,
        angle: 'problem-solution',
        specificity: 'high',
      })
    }
  }

  // Experience-based opportunities
  if (ontology.experiences.length > 0) {
    opportunities.push({
      userNeed: `What to expect when getting started with ${theme}`,
      intent: 'informational',
      relevantConcepts: ontology.componentConcepts,
      audienceFit: 'beginners',
      goalFit: contentGoal,
      confidence: 0.7,
      angle: 'experience guide',
      specificity: 'medium',
    })
  }

  // Process opportunities
  if (ontology.processes.length > 0) {
    for (const process of ontology.processes.slice(0, 2)) {
      opportunities.push({
        userNeed: `A practical guide to ${process} with ${theme}`,
        intent: 'how-to',
        relevantConcepts: ontology.componentConcepts,
        audienceFit: 'general',
        goalFit: contentGoal,
        confidence: 0.8,
        angle: 'step-by-step guide',
        specificity: 'high',
      })
    }
  }

  // Commercial opportunities (only if content goal supports it)
  if (contentGoal === 'commercial' && ontology.commercialDimensions.length > 0) {
    for (const dim of ontology.commercialDimensions.slice(0, 2)) {
      opportunities.push({
        userNeed: `${theme}: ${dim} considerations and practical advice`,
        intent: 'commercial investigation',
        relevantConcepts: ontology.componentConcepts,
        audienceFit: 'buyers',
        goalFit: 'commercial',
        confidence: 0.85,
        angle: 'buyer guide',
        specificity: 'high',
      })
    }
  }

  // Decision opportunities
  if (ontology.decisions.length > 0) {
    for (const decision of ontology.decisions.slice(0, 2)) {
      opportunities.push({
        userNeed: decision,
        intent: 'decision',
        relevantConcepts: ontology.componentConcepts,
        audienceFit: 'decision-makers',
        goalFit: contentGoal,
        confidence: 0.75,
        angle: 'decision framework',
        specificity: 'high',
      })
    }
  }

  return opportunities
}

function inferAngleFromIntent(intent) {
  const angleMap = {
    'how-to': 'step-by-step guide',
    'informational': 'comprehensive overview',
    'comparison': 'side-by-side comparison',
    'commercial investigation': 'buyer decision guide',
    'problem-solving': 'troubleshooting and solutions',
    'decision': 'decision framework',
  }
  return angleMap[intent] || 'practical guide'
}

function inferSpecificityFromNeed(need, ontology) {
  const lower = need.toLowerCase()
  const theme = (ontology.centralTheme || '').toLowerCase()
  // If the need mentions specific concepts from the ontology, it's more specific
  for (const concept of ontology.componentConcepts || []) {
    if (lower.includes(concept.toLowerCase())) return 'high'
  }
  // Generic needs are lower specificity
  if (/^(what|how|why|when|where|who)\b/.test(lower)) return 'medium'
  return 'low'
}

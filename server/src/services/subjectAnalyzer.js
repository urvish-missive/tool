/**
 * Subject Composition Analyzer
 *
 * Determines whether the user's subject represents:
 * - one atomic concept
 * - one established multi-word concept
 * - multiple connected concepts
 * - a compound subject
 * - a comparison
 * - a category plus subcategory
 * - an entity plus activity
 * - a product plus use case
 *
 * Does NOT mechanically split on "and", "&", "/", etc.
 * Uses AI-based semantic analysis to understand the actual structure.
 */

import { callAIAndParseJSON } from '../utils/aiProvider.js'

/**
 * Analyzes the semantic composition of a subject string.
 * Returns structured decomposition with confidence scores.
 */
export async function analyzeSubjectComposition(rawSubject, normalizedSubject, preferredProvider) {
  if (!normalizedSubject) {
    return {
      subjectStructure: 'empty',
      primaryConcepts: [],
      relationships: [],
      atomicConcepts: [],
      establishedPhrases: [],
      ambiguousSegments: [],
      confidence: 0,
      rawInput: rawSubject,
    }
  }

  // First pass: heuristic analysis
  const heuristicResult = heuristicSubjectAnalysis(normalizedSubject)

  // Second pass: AI-based semantic analysis
  let aiResult = null
  try {
    aiResult = await callAIAndParseJSON(
      [
        {
          role: 'system',
          content: `You are a semantic text analyst. Analyze the STRUCTURE and COMPOSITION of the user's subject phrase.

CRITICAL RULES:
1. Determine if the subject is ONE concept, MULTIPLE concepts, or an ESTABLISHED phrase.
2. Do NOT mechanically split on "and", "&", or "/" — some phrases with "and" are single established concepts.
3. For each concept detected, identify its ROLE and RELATIONSHIP to other concepts.
4. Detect if the subject represents a comparison, category+subcategory, entity+activity, product+use case, etc.
5. Identify any AMBIGUOUS segments where the meaning is unclear.
6. Assign confidence to your analysis.

EXAMPLES:
- "cafe and coffee" → likely two related concepts (cafe as a place + coffee as a product) with a complementary relationship
- "artificial intelligence" → ONE established phrase, do not split
- "best running shoes" → one concept (running shoes) with a "best" modifier indicating commercial/evaluative intent
- "react vs vue" → comparison of two concepts
- "coffee brewing methods" → one concept (coffee brewing) with "methods" as an informational modifier

Return JSON:
{
  "subjectStructure": "atomic|established_phrase|compound|comparison|category_subcategory|entity_activity|product_usecase|modified_concept|other",
  "primaryConcepts": ["concept1", "concept2"],
  "relationships": [{ "from": "concept1", "to": "concept2", "type": "complementary|comparison|modifier|category|activity|dependency|adjacent", "description": "natural language description" }],
  "atomicConcepts": ["individual atomic concept words or phrases"],
  "establishedPhrases": ["phrases that should not be split"],
  "ambiguousSegments": ["segments where meaning is unclear"],
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation of your analysis"
}`,
        },
        {
          role: 'user',
          content: `Analyze this subject: "${normalizedSubject}"`,
        },
      ],
      {
        preferredProvider: preferredProvider || 'groq',
        temperature: 0.2,
        maxTokens: 600,
        jsonMode: true,
      }
    )
  } catch {
    // AI unavailable — use heuristic result
  }

  // Merge AI and heuristic results, preferring AI when available
  if (aiResult && aiResult.subjectStructure) {
    return {
      subjectStructure: aiResult.subjectStructure,
      primaryConcepts: Array.isArray(aiResult.primaryConcepts) ? aiResult.primaryConcepts : heuristicResult.primaryConcepts,
      relationships: Array.isArray(aiResult.relationships) ? aiResult.relationships : heuristicResult.relationships,
      atomicConcepts: Array.isArray(aiResult.atomicConcepts) ? aiResult.atomicConcepts : heuristicResult.atomicConcepts,
      establishedPhrases: Array.isArray(aiResult.establishedPhrases) ? aiResult.establishedPhrases : heuristicResult.establishedPhrases,
      ambiguousSegments: Array.isArray(aiResult.ambiguousSegments) ? aiResult.ambiguousSegments : heuristicResult.ambiguousSegments,
      confidence: aiResult.confidence || heuristicResult.confidence,
      rawInput: rawSubject,
    }
  }

  return { ...heuristicResult, rawInput: rawSubject }
}

/**
 * Heuristic subject analysis — no AI required.
 * Provides a basic structural analysis as a fallback.
 */
function heuristicSubjectAnalysis(subject) {
  const lower = subject.toLowerCase()
  const words = lower.split(/\s+/).filter(Boolean)

  // Detect established single-concept phrases (multi-word terms that are one concept)
  const establishedPatterns = [
    /\b(artificial intelligence|machine learning|deep learning|natural language|data science|web development|mobile development|cloud computing|block chain|supply chain|real estate|content marketing|email marketing|social media|search engine|project management|product management|quality assurance|user experience|user interface)\b/,
  ]

  const isEstablished = establishedPatterns.some(p => p.test(lower))

  // Detect comparison patterns
  const isComparison = /\b(vs\.?|versus|compared? to?|or)\b/.test(lower) && words.length <= 6

  // Detect modifier patterns
  const hasModifier = /^(best|top|how to|what is|guide|tutorial|review|vs|compare)\b/.test(lower)

  // Detect "and" usage
  const hasAnd = /\band\b/.test(lower)

  let subjectStructure = 'atomic'
  const primaryConcepts = [subject]
  const relationships = []
  const atomicConcepts = words.filter(w => w.length > 3)
  const establishedPhrases = []
  const ambiguousSegments = []

  if (isComparison) {
    subjectStructure = 'comparison'
    // Split on comparison words
    const parts = lower.split(/\b(?:vs\.?|versus|compared?\s+to?|or)\b/)
    primaryConcepts.length = 0
    primaryConcepts.push(...parts.map(p => p.trim()).filter(Boolean))
    if (primaryConcepts.length >= 2) {
      relationships.push({
        from: primaryConcepts[0],
        to: primaryConcepts[1],
        type: 'comparison',
        description: `Comparing ${primaryConcepts[0]} and ${primaryConcepts[1]}`,
      })
    }
  } else if (isEstablished) {
    subjectStructure = 'established_phrase'
    establishedPhrases.push(subject)
  } else if (hasAnd) {
    subjectStructure = 'compound'
    // Don't mechanically split — flag as ambiguous
    ambiguousSegments.push(subject)
    // Provide a conservative split attempt for the primary concepts
    const parts = lower.split(/\band\b/).map(p => p.trim()).filter(Boolean)
    if (parts.length >= 2) {
      primaryConcepts.length = 0
      primaryConcepts.push(...parts)
      for (let i = 0; i < parts.length - 1; i++) {
        relationships.push({
          from: parts[i],
          to: parts[i + 1],
          type: 'complementary',
          description: `${parts[i]} and ${parts[i + 1]} are related concepts`,
        })
      }
    }
  } else if (hasModifier) {
    subjectStructure = 'modified_concept'
  }

  return {
    subjectStructure,
    primaryConcepts,
    relationships,
    atomicConcepts,
    establishedPhrases,
    ambiguousSegments,
    confidence: isEstablished ? 0.85 : isComparison ? 0.8 : hasAnd ? 0.5 : 0.7,
  }
}

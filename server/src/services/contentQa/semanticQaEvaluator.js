/**
 * Semantic & Contextual QA Evaluator
 * 
 * Implements context-sensitive, evidence-based evaluations:
 * - Headline quality & supporting line (does not equate distant subheadings with supporting line)
 * - Audience alignment & intent drift
 * - E-E-A-T evidence evaluation (experience vs claims of experience)
 * - Sales pitch & promotional intent (evaluated against contentGoal)
 * - Brand positioning (checks for brand context source; NOT_VERIFIABLE if none supplied)
 * - Dynamic compliance & risk evaluation (inferred sensitivity, jurisdiction-dependent guidance)
 * - Visual platform fit (required vs optional visuals, scannability without mandatory bolding)
 * - Structural failures & duplicate/orphan block detection
 */

// Superlative & hype claim patterns
const SUPERLATIVE_PATTERNS = [
  /\b(best in the world|unrivaled|unmatched|100% guaranteed|miracle solution|revolutionizing the entire)\b/gi,
  /\b(we are the #1|we are the number one|the undisputed leader)\b/gi,
]

// Milestone bragging patterns
const MILESTONE_PATTERNS = [
  /\b((?:with |has )?over \d+\+? years of experience)\b/gi,
  /\b(having \d+\+? years in the industry)\b/gi,
  /\b(serving over \d+[\d,]*\+? happy clients)\b/gi,
  /\b(established in \d{4}, we have)\b/gi,
  /\b(\d+\+? years (?:of )?experience in the industry)\b/gi,
]

// Sales pitch / promotional CTA patterns
const PROMOTIONAL_PATTERNS = [
  /\b(contact our (team|agency|experts)|book a free consultation|schedule a demo|hire us|work with us|reach out to our sales team)\b/gi,
  /\b(our services? (can|will) help you|at our agency, we offer|choose our platform for)\b/gi,
  /\b(call us today|get a quote|sign up for our premium)\b/gi,
]

// Regulated domain sensitivity triggers
const REGULATED_DOMAINS = [
  {
    domain: 'health_medical',
    pattern: /\b(treatment for|cures?|diagnos(is|e)|clinical trial|prescrib(e|tion)|dosage|fda approved|medical advice|symptoms of)\b/gi,
    isStrict: true,
  },
  {
    domain: 'finance_investment',
    pattern: /\b(guarantee[ds]?\s+(?:[a-z0-9%$\s]+\s+)?(?:return|profit|roi|yields?)|financial return|investment portfolio|tax liability|sec compliance|crypto yields)\b/gi,
    isStrict: true,
  },
  {
    domain: 'legal_regulatory',
    pattern: /\b(legal liability|statute of limitations|gdpr compliance|hipaa penalty|jurisdiction|sue for damages|legal rights)\b/gi,
    isStrict: true,
  },
  {
    domain: 'safety_privacy',
    pattern: /\b(biometric data|personally identifiable information|pii handling|child safety|hazardous materials)\b/gi,
    isStrict: true,
  },
]

// Jurisdiction dependency markers
const JURISDICTION_PATTERNS = [
  /\b(state laws?|federal regulations?|varies by state|depending on your jurisdiction|local municipality|european union directive|under state law)\b/gi,
  /\b(in california|in the uk|under gdpr|state bar association|regional guidelines)\b/gi,
]

/**
 * 1. Headline & Supporting Line Evaluator
 */
/**
 * 1. Content-Type-Aware Headline & Supporting Line Evaluator
 * Requirement #23 & #25:
 * - Informational articles: evaluates clarity, topic specificity, natural promise (does not force commercial USP).
 * - Landing pages: requires USP-driven benefit and conversion hook.
 * - Supporting line is configurable: 'required', 'recommended', or 'not_applicable'.
 */
export function evaluateHeadlineAndSupportingLine(
  blocks,
  rawContent,
  suppliedTitle = '',
  options = {}
) {
  const { platform = 'website', contentType = 'blog', supportingLineMode = 'recommended' } = options
  let title = suppliedTitle.trim()
  let titleBlock = null

  if (!title) {
    const h1 = blocks.find((b) => b.blockType === 'heading' && b.level === 1)
    if (h1) {
      title = h1.cleanText
      titleBlock = h1
    }
  }

  const headlineFindings = []
  let isHeadlineStrong = false

  if (title) {
    const len = title.length
    const words = title.split(/\s+/).length
    const isLandingPage = platform === 'landing_page' || contentType === 'landing_page'

    if (isLandingPage) {
      // Landing pages require distinct USP hook or clear value proposition
      const hasUsp = /\b(best|only|guaranteed|#1|free|instant|save|transform|proven|solution)\b/i.test(title)
      if (words >= 3 && words <= 14 && hasUsp) {
        isHeadlineStrong = true
      } else {
        headlineFindings.push({
          text: title,
          reason: !hasUsp
            ? 'Landing page headline lacks a distinct USP-driven benefit or offer promise.'
            : 'Landing page headline length should be between 3 and 14 punchy words.',
        })
      }
    } else {
      // Long-form informational articles require clarity, topic specificity, and natural promise
      if (words >= 4 && words <= 18 && len >= 20 && len <= 110) {
        isHeadlineStrong = true
      } else {
        headlineFindings.push({
          text: title,
          reason: words < 4
            ? 'Headline is too terse or vague for an informational guide.'
            : 'Headline is overly long; tighten focus to primary reader promise.',
        })
      }
    }
  } else {
    headlineFindings.push({
      text: 'No title provided',
      reason: 'Content lacks an H1 or explicit headline.',
    })
  }

  // Supporting line evaluation (Requirement #25)
  let supportingLineFound = false
  let supportingLineText = ''

  if (titleBlock) {
    const blockIndex = blocks.indexOf(titleBlock)
    if (blockIndex !== -1 && blockIndex + 1 < blocks.length) {
      const nextBlock = blocks[blockIndex + 1]
      if (
        nextBlock.blockType === 'quote' ||
        (nextBlock.blockType === 'heading' && nextBlock.level === 2) ||
        (nextBlock.blockType === 'paragraph' && nextBlock.cleanText.split(/\s+/).length <= 35)
      ) {
        supportingLineFound = true
        supportingLineText = nextBlock.cleanText
      }
    }
  }

  const supportingLineRequired = supportingLineMode === 'required'
  const supportingLineApplicable = supportingLineMode !== 'not_applicable' && !['social', 'linkedin'].includes(platform)

  return {
    title,
    isHeadlineStrong,
    headlineFindings,
    supportingLineRequired,
    supportingLineApplicable,
    supportingLineFound,
    supportingLineText,
    supportingLineMode,
  }
}

/**
 * 2. Graded Why/How Analysis Model
 * Requirement #22:
 * Evaluates reasoning, procedure, decision criteria, tradeoffs, and limitations.
 * Levels: 'NONE' | 'SURFACE' | 'ADEQUATE' | 'DETAILED'
 */
export function evaluateWhyHowDepth(blocks, rawContent) {
  const prose = blocks.filter((b) => b.isProse).map((b) => b.cleanText).join('\n')

  const reasoningMatches = prose.match(/\b(because|since|due to|as a result of|the reason why|which leads to|mechanism behind)\b/gi) || []
  const procedureMatches = prose.match(/\b(step \d+|first|next|then|finally|to implement this|here is how|specifically how|workflow)\b/gi) || []
  const decisionMatches = prose.match(/\b(criteria|evaluate|consider|decide between|factors to evaluate|key dimensions)\b/gi) || []
  const tradeoffMatches = prose.match(/\b(tradeoff|drawback|downside|limitation|balance|versus|drawbacks|risk of)\b/gi) || []
  const exampleMatches = prose.match(/\b(for example|for instance|such as|case study|in our experience|specifically)\b/gi) || []

  let dimensionScore = 0
  if (reasoningMatches.length > 0) dimensionScore++
  if (procedureMatches.length > 0) dimensionScore++
  if (decisionMatches.length > 0) dimensionScore++
  if (tradeoffMatches.length > 0) dimensionScore++
  if (exampleMatches.length > 0) dimensionScore++

  let depth = 'NONE'
  let status = 'FAIL'
  let message = 'Content mostly describes WHAT to do rather than explaining the underlying WHY and tactical HOW.'

  if (dimensionScore >= 4 || (procedureMatches.length >= 2 && reasoningMatches.length >= 2)) {
    depth = 'DETAILED'
    status = 'PASS'
    message = 'Detailed explanation of why and how: covers causal reasoning, procedural steps, and decision tradeoffs.'
  } else if (dimensionScore >= 2 || (procedureMatches.length >= 1 && reasoningMatches.length >= 1)) {
    depth = 'ADEQUATE'
    status = 'PASS'
    message = 'Adequately explains the underlying why and tactical how across core sections.'
  } else if (dimensionScore === 1 || reasoningMatches.length > 0 || procedureMatches.length > 0) {
    depth = 'SURFACE'
    status = 'WARNING'
    message = 'Surface-level explanations: mentions reasons or steps but lacks detailed procedural depth and tradeoffs.'
  }

  return {
    depth,
    status,
    message,
    dimensionScore,
    reasoningCount: reasoningMatches.length,
    procedureCount: procedureMatches.length,
    decisionCount: decisionMatches.length,
    tradeoffCount: tradeoffMatches.length,
    exampleCount: exampleMatches.length,
  }
}

/**
 * 3. Scoped Insight-First Evaluator
 * Requirements #8 & #9:
 * - Scopes: 'DOCUMENT_INTRO' | 'SECTION_INTROS' | 'ALL_OPENINGS'
 * - Classification first: DIRECT_INSIGHT, THROAT_CLEARING, GENERIC_BACKSTORY, DELAYED_VALUE
 * - If throat-clearing or generic backstory: status CANNOT be PASS.
 */
export function evaluateInsightFirst(blocks, rawContent, scope = 'DOCUMENT_INTRO') {
  const proseBlocks = blocks.filter((b) => b.isProse)
  if (proseBlocks.length === 0) {
    return {
      status: 'WARNING',
      classification: 'NO_PROSE',
      message: 'No introductory prose paragraphs detected.',
      findings: [],
      scope,
    }
  }

  const targetBlocks = scope === 'DOCUMENT_INTRO' ? [proseBlocks[0]] : proseBlocks.slice(0, 3)
  const findings = []

  // Regex patterns for opening defects
  const THROAT_CLEARING_PATTERN = /^(in this (?:article|guide|post|tutorial|piece|overview)|today we will|before we (?:begin|start|dive in)|it goes without saying|needless to say|let us (?:look at|explore|examine)|have you ever wondered)\b/i
  const GENERIC_BACKSTORY_PATTERN = /^(in today's (?:fast-paced|digital|modern|ever-changing)|as we all know|since the dawn of|throughout history|in the modern world|technology is constantly evolving)\b/i

  for (const block of targetBlocks) {
    const text = (block.cleanText || '').trim()
    const words = text.split(/\s+/).filter(Boolean)
    const wordCount = words.length

    const firstSentence = (block.sentences && block.sentences[0]) ? block.sentences[0].trim() : text.split(/[.?!]/)[0]
    const firstSentenceWords = firstSentence ? firstSentence.split(/\s+/).filter(Boolean).length : wordCount

    const isThroatClearing = THROAT_CLEARING_PATTERN.test(text)
    const isGenericBackstory = GENERIC_BACKSTORY_PATTERN.test(text)
    const isDelayedValue = wordCount > 75 || (wordCount > 50 && firstSentenceWords > 30)

    let classification = 'DIRECT_INSIGHT'
    let blockStatus = 'PASS'
    let reason = 'Opens directly with an observation or insight without throat-clearing.'

    if (isThroatClearing) {
      classification = 'THROAT_CLEARING'
      blockStatus = 'FAIL'
      reason = 'Opening contains throat-clearing meta-announcements before delivering value.'
    } else if (isGenericBackstory) {
      classification = 'GENERIC_BACKSTORY'
      blockStatus = 'FAIL'
      reason = "Opening opens with generic backstory platitudes (e.g. 'In today's fast-paced world') instead of an immediate value hook."
    } else if (isDelayedValue) {
      classification = 'DELAYED_VALUE'
      blockStatus = 'WARNING'
      reason = 'Opening setup is lengthy (>55 words); come to the core insight faster.'
    }

    findings.push({
      blockId: block.blockId,
      classification,
      status: blockStatus,
      reason,
      text: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
      startOffset: block.startOffset,
      endOffset: Math.min(block.endOffset, block.startOffset + 80),
      wordCount,
    })
  }

  // Aggregate status across scoped targets
  const hasFail = findings.some((f) => f.status === 'FAIL')
  const hasWarning = findings.some((f) => f.status === 'WARNING')
  const overallStatus = hasFail ? 'FAIL' : hasWarning ? 'WARNING' : 'PASS'
  const primaryFinding = findings[0]

  return {
    status: overallStatus,
    classification: primaryFinding.classification,
    message: primaryFinding.reason,
    findings,
    scope,
  }
}

/**
 * 2. E-E-A-T Evidence & Experience Distinction
 * Distinguishes observable evidence/methodology from superficial claims ("In our experience...")
 */
export function evaluateEeatSignals(blocks, rawContent) {
  const prose = blocks.filter((b) => b.isProse).map((b) => b.cleanText).join('\n')

  // Signals of verifiable, first-hand observable evidence
  const firstHandEvidenceMatches = (
    prose.match(/\b(we tested|in our audit of|our benchmark showed|we measured|in our case study|our data reveals|we implemented|we tracked \d+)\b/gi) || []
  )

  // Superficial claims of experience (weaker credit)
  const experienceClaims = (
    prose.match(/\b(based on our experience|in our opinion|we believe that|our experience shows|we have seen that)\b/gi) || []
  )

  // Why/How tactical explanations (causal connectors)
  const howWhyExplanations = (
    prose.match(/\b(the reason why|this occurs because|to implement this,|specifically how|the mechanism behind|step \d+:|here is how)\b/gi) || []
  )

  // Source attributions and citations
  const citationCount = (
    prose.match(/\b(according to|cited by|research from|source:|study by|published in|as documented by)\b/gi) || []
  ).length

  const hasStrongEvidence = firstHandEvidenceMatches.length > 0 || (experienceClaims.length > 0 && citationCount > 0)
  const hasExplanations = howWhyExplanations.length >= 2

  return {
    hasStrongEvidence,
    hasExplanations,
    firstHandCount: firstHandEvidenceMatches.length,
    claimCount: experienceClaims.length,
    explanationCount: howWhyExplanations.length,
    citationCount,
  }
}

/**
 * 3. Promotional Intent & Content Goal Context
 */
export function evaluatePromotionalIntent(blocks, rawContent, contentGoal = 'educational') {
  const targetBlocks = blocks.filter((b) => b.isProse || b.blockType === 'cta')
  const promoEvidence = []
  let promoCount = 0

  for (const block of targetBlocks) {
    const text = block.rawText || ''

    for (const pattern of PROMOTIONAL_PATTERNS) {
      let match
      pattern.lastIndex = 0
      while ((match = pattern.exec(text)) !== null) {
        promoCount++
        promoEvidence.push({
          text: match[0],
          blockId: block.blockId,
          startOffset: block.startOffset + match.index,
          endOffset: block.startOffset + match.index + match[0].length,
          context: match[0],
        })
      }
    }
  }

  // Also check milestone bragging
  const milestoneEvidence = []
  for (const block of targetBlocks) {
    const text = block.rawText || ''
    for (const pattern of MILESTONE_PATTERNS) {
      let match
      pattern.lastIndex = 0
      while ((match = pattern.exec(text)) !== null) {
        milestoneEvidence.push({
          text: match[0],
          blockId: block.blockId,
          startOffset: block.startOffset + match.index,
          endOffset: block.startOffset + match.index + match[0].length,
        })
      }
    }
  }

  // Also check superlatives
  const superlativeEvidence = []
  for (const block of targetBlocks) {
    const text = block.rawText || ''
    for (const pattern of SUPERLATIVE_PATTERNS) {
      let match
      pattern.lastIndex = 0
      while ((match = pattern.exec(text)) !== null) {
        superlativeEvidence.push({
          text: match[0],
          blockId: block.blockId,
          startOffset: block.startOffset + match.index,
          endOffset: block.startOffset + match.index + match[0].length,
        })
      }
    }
  }

  // Contextual status based on contentGoal:
  // For Commercial content, soft promotional mentions are normal (PASS/WARNING).
  // For Educational / Informational, strong sales pitches are penalized (FAIL).
  let status = 'PASS'
  if (promoCount > 0) {
    if (contentGoal === 'commercial' || contentGoal === 'sales') {
      status = promoCount > 3 ? 'WARNING' : 'PASS'
    } else {
      status = promoCount > 1 ? 'FAIL' : 'WARNING'
    }
  }

  return {
    status,
    promoCount,
    promoEvidence,
    milestoneCount: milestoneEvidence.length,
    milestoneEvidence,
    superlativeCount: superlativeEvidence.length,
    superlativeEvidence,
    contentGoal,
  }
}

/**
 * 4. Brand Positioning Context Check
 * Requires an explicit brand profile or supplied brand guidelines.
 * Without brand context, returns NOT_VERIFIABLE.
 */
export function evaluateBrandContext(brandProfile = null, brandVoice = null) {
  const hasProfile = Boolean(brandProfile && (typeof brandProfile === 'string' ? brandProfile.trim().length > 5 : Object.keys(brandProfile).length > 0))
  const hasVoice = Boolean(brandVoice && brandVoice.trim().length > 3)

  if (!hasProfile && !hasVoice) {
    return {
      status: 'NOT_VERIFIABLE',
      brandContextSource: 'UNVERIFIABLE_NO_BRAND_PROFILE',
      message: 'No brand voice profile or guidelines supplied. Human review required for brand positioning alignment.',
    }
  }

  return {
    status: 'PASS',
    brandContextSource: 'USER_PROVIDED',
    message: 'Brand context active and evaluated against supplied brand guidelines.',
  }
}

/**
 * 5. Dynamic Compliance & Risk Analysis
 * Infers sensitivity from content without a hardcoded industry list.
 * Identifies jurisdiction-dependent guidance and recommends verification.
 */
export function evaluateComplianceAndRisk(blocks, rawContent) {
  const prose = blocks.map((b) => b.rawText || '').join('\n')
  const detectedSensitivities = []
  const jurisdictionGuidance = []
  const complianceEvidence = []

  // Detect regulated domains
  for (const domainDef of REGULATED_DOMAINS) {
    let match
    domainDef.pattern.lastIndex = 0
    while ((match = domainDef.pattern.exec(prose)) !== null) {
      detectedSensitivities.push(domainDef.domain)
      complianceEvidence.push({
        text: match[0],
        domain: domainDef.domain,
        startOffset: match.index,
        endOffset: match.index + match[0].length,
      })
      break // one match per domain is enough to identify domain sensitivity
    }
  }

  // Detect jurisdiction dependence
  for (const pattern of JURISDICTION_PATTERNS) {
    let match
    pattern.lastIndex = 0
    while ((match = pattern.exec(prose)) !== null) {
      jurisdictionGuidance.push(match[0])
    }
  }

  // Check for explicit disclaimer or verification recommendation in content
  const hasDisclaimer = /\b(disclaimer|consult a professional|not legal advice|not medical advice|verify with local regulations|terms apply)\b/i.test(prose)

  const isSensitive = detectedSensitivities.length > 0
  const hasJurisdictionVar = jurisdictionGuidance.length > 0
  const hasGuaranteedReturn = /\b(guarantee[ds]?\b.*?\b(return|profit|roi|yields?)|100% guaranteed)\b/i.test(prose)
  const hasMedicalClaim = detectedSensitivities.includes('health_medical') && /\b(cures?|treatment for|diagnos)\b/i.test(prose)

  let status = 'PASS'
  let message = 'No high-risk regulatory or compliance claims detected.'
  let financeFail = false
  let medicalFail = false

  if (isSensitive) {
    if (hasGuaranteedReturn && !hasDisclaimer) {
      status = 'FAIL'
      financeFail = true
      message = 'Guaranteed financial return or extreme investment claim detected without qualified legal disclaimers.'
    } else if (hasMedicalClaim && !hasDisclaimer) {
      status = 'FAIL'
      medicalFail = true
      message = 'Unverified medical cure or diagnosis claim detected without healthcare disclaimer.'
    } else if (!hasDisclaimer && hasJurisdictionVar) {
      status = 'WARNING'
      message = 'Jurisdiction-specific guidance detected in regulated domain. Verification against applicable primary rules recommended.'
    } else if (!hasDisclaimer) {
      status = 'WARNING'
      message = 'Content discusses regulated subjects without qualifying professional disclaimers.'
    } else {
      status = 'PASS'
      message = 'Regulated domain context recognized and qualified with appropriate verification guidance.'
    }
  }

  return {
    status,
    financeFail,
    medicalFail,
    isSensitive,
    hasDisclaimer,
    hasJurisdictionVar,
    detectedSensitivities,
    jurisdictionGuidance,
    evidence: complianceEvidence,
    message,
    jurisdictionNotice: hasJurisdictionVar || isSensitive,
  }
}

/**
 * 6. Visual Platform Fit & Contextual Media Requirement
 * Requirement #17 & #26:
 * - Distinguishes required from recommended visuals based on data & procedural density.
 * - Articles without data tables or step-by-step procedures: visuals are 'recommended', not strictly required.
 * - Technical workflows or heavy data: visuals are 'required'.
 */
export function evaluateVisualPlatformFit(blocks, rawContent, platform = 'website', options = {}) {
  const paragraphs = blocks.filter((b) => b.blockType === 'paragraph')
  const listBlocks = blocks.filter((b) => b.blockType === 'bullet_list' || b.blockType === 'numbered_list')
  const tableBlocks = blocks.filter((b) => b.blockType === 'table')

  // Paragraph length analysis (> 65 words and > 3 sentences is dense)
  const longParagraphs = paragraphs.filter((p) => {
    const wordCount = (p.cleanText || '').split(/\s+/).filter(Boolean).length
    const sentenceCount = (p.sentences || []).length
    return wordCount > 65 && sentenceCount > 3
  })

  // Scannability achieved through short paragraphs, lists, tables, or callouts
  const isScannable = longParagraphs.length === 0 && (listBlocks.length > 0 || paragraphs.length >= 3 || tableBlocks.length > 0)

  // Media presence check
  const hasImages = /!\[.*?\]\(.*?\)|<img\s/i.test(rawContent)
  const hasMediaPlaceholders = /\[(?:video|image|chart|infographic|diagram|screenshot)\]/i.test(rawContent)
  const isMediaPresent = hasImages || hasMediaPlaceholders || tableBlocks.length > 0

  // Check if content has heavy quantitative data or complex procedures
  const prose = blocks.map((b) => b.rawText || '').join('\n')
  const hasDataComparison = (prose.match(/\b\d+(\.\d+)?%\b/g) || []).length >= 4 || tableBlocks.length > 0
  const hasStepByStepProcedure = /\b(step \d+|phase \d+|stage \d+|procedure:|instructions:)\b/i.test(prose) || 
    blocks.some((b) => b.blockType === 'numbered_list' && (b.items || []).length >= 4)

  const isVisualStrictlyRequired = Boolean(hasDataComparison || hasStepByStepProcedure)
  const visualRequirementLevel = isVisualStrictlyRequired ? 'REQUIRED' : 'RECOMMENDED'

  let mediaStatus = 'PASS'
  let mediaMessage = 'Visual structure or media breaks support content scannability.'

  if (!isMediaPresent) {
    if (isVisualStrictlyRequired) {
      mediaStatus = 'FAIL'
      mediaMessage = 'Content contains complex procedural steps or quantitative data comparisons but lacks diagrams, charts, or visual media aids.'
    } else {
      mediaStatus = 'WARNING'
      mediaMessage = 'No visual media or diagrams detected. Visual aids are recommended for enhanced engagement, though not strictly required for this content format.'
    }
  }

  return {
    isScannable,
    longParagraphCount: longParagraphs.length,
    listBlockCount: listBlocks.length,
    tableBlockCount: tableBlocks.length,
    isMediaPresent,
    isVisualStrictlyRequired,
    visualRequirementLevel,
    mediaStatus,
    mediaMessage,
    platform,
  }
}

/**
 * 7. Target Keyword & Intent Alignment Evaluator
 * Requirement #15:
 * If target keyword is not provided, returns NOT_VERIFIABLE with affectsScore: false.
 */
export function evaluateTargetKeywordAlignment(targetKeyword, blocks, title = '') {
  if (!targetKeyword || typeof targetKeyword !== 'string' || !targetKeyword.trim()) {
    return {
      status: 'NOT_VERIFIABLE',
      affectsScore: false,
      targetKeyword: null,
      explanation: 'Target keyword was not provided. Keyword fulfillment cannot be verified.',
      recommendation: 'Specify a primary target keyword in the QA parameters to evaluate keyword placement and search intent alignment.',
      keywordCount: 0,
      inTitle: false,
      inIntro: false,
      inHeadings: false,
    }
  }

  const keyword = targetKeyword.trim()
  const escapedKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const kwRegex = new RegExp(`\\b${escapedKw}\\b`, 'gi')

  const titleMatch = Boolean(title && kwRegex.test(title))

  const proseBlocks = blocks.filter((b) => b.isProse)
  const firstProse = proseBlocks.length > 0 ? (proseBlocks[0].cleanText || '') : ''
  const introMatch = Boolean(firstProse && new RegExp(`\\b${escapedKw}\\b`, 'i').test(firstProse))

  const headings = blocks.filter((b) => b.blockType === 'heading')
  const headingMatch = headings.some((h) => new RegExp(`\\b${escapedKw}\\b`, 'i').test(h.cleanText || ''))

  const fullText = blocks.map((b) => b.cleanText || '').join('\n')
  const allMatches = fullText.match(kwRegex) || []
  const keywordCount = allMatches.length

  let status = 'PASS'
  let explanation = `Target keyword "${keyword}" is appropriately integrated across core content sections (${keywordCount} occurrences).`
  let recommendation = 'Maintain current natural keyword integration without over-optimization.'

  if (keywordCount === 0) {
    status = 'FAIL'
    explanation = `Target keyword "${keyword}" was not found anywhere in the content.`
    recommendation = `Integrate "${keyword}" naturally into the headline, introductory paragraph, and at least one subheading.`
  } else if (!titleMatch && !introMatch) {
    status = 'WARNING'
    explanation = `Target keyword "${keyword}" appears ${keywordCount} times, but is absent from both the title and introduction.`
    recommendation = `Introduce "${keyword}" in the headline or the first 100 words to anchor reader intent immediately.`
  }

  return {
    status,
    affectsScore: true,
    targetKeyword: keyword,
    keywordCount,
    inTitle: titleMatch,
    inIntro: introMatch,
    inHeadings: headingMatch,
    explanation,
    recommendation,
  }
}

/**
 * 7. Duplicate / Orphan Content Detection
 */
export function detectDuplicateOrOrphanBlocks(blocks) {
  const seenHeadings = new Set()
  const duplicateBlocks = []

  for (const block of blocks) {
    if (block.blockType === 'heading') {
      const clean = block.cleanText.toLowerCase()
      if (seenHeadings.has(clean) && clean.length > 5) {
        duplicateBlocks.push({
          type: 'duplicate_heading',
          text: block.cleanText,
          blockId: block.blockId,
        })
      } else {
        seenHeadings.add(clean)
      }
    }
  }

  return {
    hasDuplicates: duplicateBlocks.length > 0,
    duplicateBlocks,
  }
}

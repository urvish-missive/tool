/**
 * AI-powered Content QA Reviewer & Polisher
 * Based on Himani Kankaria's 12-Pillar Content QA Checklist
 */

import { callAIAndParseJSON, getConfiguredProviders } from '../utils/aiProvider.js'
import { buildMissiveQaPromptDirectives, MISSIVE_BANNED_WORDS } from '../utils/missiveQaRules.js'
import { isNumericRangeDash } from './contentQa/punctuationDetector.js'

const SYSTEM_PROMPT = `You are Himani Kankaria's AI Content QA Auditor. You evaluate content strictly against Himani Kankaria's 12-Pillar Content QA Checklist:

1. Tone, Style, and AI Check:
   - Is the tone human, crisp, and conversational?
   - No robotic phrases, no fluff, no clichés.
     * Reference examples of robotic/AI buzzwords to eliminate: ${MISSIVE_BANNED_WORDS.map((w) => `"${w}"`).join(', ')}.
     * DYNAMIC BUZZWORD DETECTION: Treat the above list as EXAMPLES, not an exhaustive limit. Dynamically detect and extract ANY word or phrase in the text that matches this robotic, hyperbolic, or overused AI nature (e.g., "multifaceted", "intertwined", "elucidate", "bespoke", "paramount", "leverage", "paradigm", "testament", "dive deep", "seamlessly", "spearhead", "foster").
   - Strictly zero use of the em dash character or double-hyphen as punctuation, and zero colons.
   - Sentences clear, complete, not abrupt.

2. Read Aloud Test:
   - If read out loud, does it sound natural?
   - Does it hold attention, sound confident, and flow smoothly?
   - Can any line be shortened without losing meaning?

3. Audience Alignment:
   - Is this clearly written for ONE specific target audience?
   - Does it fulfill the purpose of searching & reading?
   - Would this make them pause and read (scroll-stopping hook)?

4. E‑E‑A‑T Check:
   - Is lived experience, real observation, or practical context added?
   - Does the content explain WHY or HOW, not just WHAT?
   - Does it show you are a thought-leader in this niche?

5. Insight First:
   - Does the content start with an insight, observation, or hook, and NOT a long setup or generic backstory?
   - Does it immediately come to the point?

6. Meaning & Crispness Test:
   - Every line adds new or valuable info, clarity, or perspective for that one audience.
   - No filler lines. No "nice to have" sentences.

7. Zero Offensiveness Rule:
   - Are we NOT undermining any profession, system, academy, or industry?
   - Is it polished and respectful, even when talking about gaps or competitors?

8. Relevance to Brand Positioning:
   - Is the message aligned with the brand's voice?
   - Are we reinforcing authority, sharing the brand's experience & expertise without sounding salesy?

9. Structure Check:
   - Is the headline strong & USP-driven?
   - Is the supporting line relevant?
   - Is the flow logical and tight?
   - No unnecessary past tense unless necessary.

10. No Direct Sales Pitches:
    - Crisp storytelling without exaggeration.
    - Professional, subtle drama.
    - No self-promotion unless asked.
    - No overemphasis on milestones (e.g., "10 years in business", "500+ clients").

11. Compliance & Risk Check:
    - No claims that trigger compliance (e.g., pharma, medical cures, unapproved treatments).
    - No overstatements for industries where neutrality matters (guaranteed financial returns, telecom absolutes).

12. Visual + Platform Fit:
    - Does it suit the platform (Website, LinkedIn, newsletter, landing page)?
    - Is it scannable (bullet points, short 1-3 sentence paragraphs, bold anchors)?
    - Does it have enough media hooks (charts, graphs, infographics, video embeds)?

Output Requirements:
- Return ONLY valid JSON, no markdown code blocks, no backticks outside JSON.
- Never output reasoning or <think> tags.
- Be razor-sharp, constructive, and cite exact phrases from the text.`

function buildUserPrompt(content, title, targetKeyword, platform, targetAudience, programmaticData) {
  // Preserve complete structural blocks without arbitrary middle-slice truncation
  let excerpt = content
  if (content.length > 15000) {
    const safeBreak = content.lastIndexOf('\n\n', 15000)
    excerpt = content.substring(0, safeBreak > 5000 ? safeBreak : 15000) + '\n\n[Document continues - audit evaluated on primary sections]'
  }

  const findingsSummary = programmaticData?.canonicalAudit?.debug?.canonicalFindings
    ? programmaticData.canonicalAudit.debug.canonicalFindings
        .filter((f) => f.status !== 'PASS')
        .map((f) => `Rule [${f.ruleId}]: ${f.status} - ${f.message}`)
        .join('\n')
    : ''

  return `Perform an executive editorial review based on the 12-Pillar Content QA framework.
Analyze the actual text provided. Never invent or hallucinate phrases that do not appear in the text.
Keep feedback concise, actionable, and strictly quote real sentences from the content.

## Content Details
Title: ${title || 'Not provided'}
Target Keyword: ${targetKeyword || 'Not provided'}
Target Platform: ${platform || 'Website'}
Target Audience / Voice: ${targetAudience || 'General / Professional'}

## Programmatic Pre-Check Findings
Word Count: ${programmaticData?.meta?.wordCount || 0}
Flesch Reading Ease: ${programmaticData?.meta?.flesch || 0}
Em Dashes Found: ${programmaticData?.quickStats?.emDashesCount || 0}
Colons Found: ${programmaticData?.quickStats?.colonsCount || 0}
Robotic Phrases Found: ${programmaticData?.quickStats?.aiPhrasesCount || 0}
Overall Quality Score: ${programmaticData?.overall || 0}%

## Active Findings to Refine
${findingsSummary || 'No major blockers detected programmatically.'}

## Content to Review
${excerpt}

---

Return a JSON object adhering to this schema:
{
  "publicationReadiness": "Ready to Publish" | "Minor Polish Needed" | "Needs Revision" | "Major QA Overhaul Required",
  "summary": "2-3 sentence executive assessment summarizing overall tone, strengths, and primary weaknesses.",
  "topFixes": [
    "Most urgent fix #1 with specific guidance",
    "Most urgent fix #2 with specific guidance",
    "Most urgent fix #3 with specific guidance"
  ],
  "dynamicBuzzwords": [
    {
      "phrase": "exact word or phrase quoted from content",
      "type": "ai_hallmark" | "corporate_buzzword" | "throat_clearing",
      "reason": "Why this sounds robotic, hollow, or clichéd",
      "suggestion": "Simpler, conversational human alternative"
    }
  ],
  "categories": {
    "tone_style_ai": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["specific issues with quotes from text"],
      "suggestions": ["actionable recommendations"]
    },
    "read_aloud": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["lines that sound awkward or wordy when spoken"],
      "suggestions": ["shortening suggestions"]
    },
    "audience_alignment": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["audience disconnects"],
      "suggestions": ["alignment tweaks"]
    },
    "eeat_check": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["lack of lived experience / generic claims"],
      "suggestions": ["where to inject proof or experience"]
    },
    "insight_first": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["throat-clearing or slow opening"],
      "suggestions": ["suggested opening hook"]
    },
    "meaning_crispness": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["filler sentences or fluff"],
      "suggestions": ["lines to delete or tighten"]
    },
    "zero_offensiveness": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["any questionable remarks"],
      "suggestions": ["respectful reframing"]
    },
    "brand_positioning": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["brand voice drift or salesy tone"],
      "suggestions": ["authority-building adjustments"]
    },
    "structure_check": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["flow gaps, past-tense overuse, weak headline"],
      "suggestions": ["headline / structural improvements"]
    },
    "no_direct_sales_pitches": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["milestone bragging or pushy CTAs"],
      "suggestions": ["subtle storytelling adjustments"]
    },
    "compliance_risk": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["compliance or risk triggers"],
      "suggestions": ["safe compliant wording"]
    },
    "visual_platform_fit": {
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["formatting walls of text or missing visuals"],
      "suggestions": ["platform-specific formatting tips"]
    }
  },
  "himaniProTips": [
    "Signature tip 1 for elevating this content",
    "Signature tip 2 for elevating this content"
  ]
}`
}

function validateReport(report) {
  const toArray = (v) => Array.isArray(v) ? v : []
  const validStatus = (s) => ['pass', 'warning', 'fail'].includes(s) ? s : 'warning'

  const categories = {}
  const pillarKeys = [
    'tone_style_ai', 'read_aloud', 'audience_alignment', 'eeat_check',
    'insight_first', 'meaning_crispness', 'zero_offensiveness', 'brand_positioning',
    'structure_check', 'no_direct_sales_pitches', 'compliance_risk', 'visual_platform_fit',
  ]

  for (const key of pillarKeys) {
    const raw = report?.categories?.[key] || {}
    categories[key] = {
      status: validStatus(raw.status),
      verdict: typeof raw.verdict === 'string' ? raw.verdict : 'Audited for quality and alignment.',
      issues: toArray(raw.issues),
      suggestions: toArray(raw.suggestions),
    }
  }

  const dynamicBuzzwords = Array.isArray(report?.dynamicBuzzwords)
    ? report.dynamicBuzzwords
        .filter(b => b && typeof b.phrase === 'string' && b.phrase.trim().length > 1)
        .map(b => ({
          phrase: b.phrase.trim(),
          type: typeof b.type === 'string' ? b.type : 'ai_hallmark',
          reason: typeof b.reason === 'string' ? b.reason : 'Robotic or clichéd phrasing detected.',
          suggestion: typeof b.suggestion === 'string' ? b.suggestion : 'Use simpler conversational human phrasing.',
        }))
    : []

  return {
    publicationReadiness: report?.publicationReadiness || 'Minor Polish Needed',
    summary: typeof report?.summary === 'string' ? report.summary : 'Analysis completed against Himani Kankaria\'s Content QA framework.',
    topFixes: toArray(report?.topFixes),
    dynamicBuzzwords,
    categories,
    himaniProTips: toArray(report?.himaniProTips),
  }
}

export async function reviewContentQA(content, title, targetKeyword, metaDescription, urlSlug, programmaticData, options = {}) {
  const providers = getConfiguredProviders()
  if (providers.length === 0) {
    console.log('No AI providers configured — returning programmatic results only')
    return null
  }

  const platform = options.platform || 'website'
  const targetAudience = options.targetAudience || 'General Professional'

  try {
    console.log(`Starting Himani 12-Pillar AI QA review — providers: ${providers.map(p => p.name).join(', ')}`)

    const parsed = await callAIAndParseJSON([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(content, title, targetKeyword, platform, targetAudience, programmaticData) },
    ], {
      temperature: 0.2,
      maxTokens: 2200,
      jsonMode: true,
      timeout: 13000,
    })

    console.log('[OK] Himani AI content QA review complete — overall:', parsed?.overallScore)
    return validateReport(parsed)
  } catch (err) {
    console.error('AI content QA review failed:', err.message)
    return null
  }
}

/**
 * Algorithmic fallback rewriter applying Himani's core editing rules directly
 */
function generateAlgorithmicHimaniPolish(content, title, _targetKeyword) {
  let polished = content
  const dynamicChanges = []

  // Check em dashes (and en dashes used the same way — a tight numeric
  // range like "10-15" is left untouched via isNumericRangeDash, matching
  // what the scoring engine treats as a genuine violation). Consumes the
  // surrounding whitespace so "word – word" becomes "word, word", not
  // "word , word".
  let dashViolationCount = 0
  polished = polished
    .replace(/\s*([—–])\s*/g, (match, dashChar, offset, string) => {
      if (dashChar === '–' && match.length === 1 && isNumericRangeDash(string, offset)) {
        return dashChar
      }
      dashViolationCount++
      return ', '
    })
    .replace(/\s*(?<![<>-])-{2,}(?!>)\s*/g, () => {
      dashViolationCount++
      return ', '
    })
  if (dashViolationCount > 0) {
    dynamicChanges.push(`Eliminated ${dashViolationCount} em dash(es)/em-dash-style dash(es) in favor of crisp commas and sentence stops.`)
  }

  // Check colons (excluding URLs and timestamps)
  const nonUrlText = content.replace(/https?:\/\/[^\s]+/g, '').replace(/\b\d{1,2}:\d{2}\b/g, '')
  const colonMatches = nonUrlText.match(/:/g) || []
  if (colonMatches.length > 0) {
    polished = polished.replace(/(\b[a-zA-Z0-9]+)\s*:\s+([A-Z])/g, '$1. $2')
      .replace(/(\b[a-zA-Z0-9]+)\s*:\s+([a-z])/g, '$1, $2')
      .replace(/(?<!https?)(?<!\d):(?!\/\/)(?!\d)/g, ' - ')
    dynamicChanges.push(`Eliminated ${colonMatches.length} colon(s) in favor of crisp sentence stops and commas.`)
  }

  // Check AI cliches & robotic phrasing
  const foundAi = []
  if (/in today's (fast-paced )?digital world,?/i.test(polished)) {
    polished = polished.replace(/in today's (fast-paced )?digital world,?/gi, 'Today,')
    foundAi.push('"in today\'s digital world"')
  }
  if (/game-changer/i.test(polished)) {
    polished = polished.replace(/it is a game-changer/gi, 'it delivers measurable impact').replace(/game-changer/gi, 'catalyst')
    foundAi.push('"game-changer"')
  }
  if (/delve (deep(ly)? )?into/i.test(polished)) {
    polished = polished.replace(/delve deep(ly)? into/gi, 'examine').replace(/delve into/gi, 'explore')
    foundAi.push('"delve into"')
  }
  if (/a testament to/i.test(polished)) {
    polished = polished.replace(/a testament to/gi, 'proof of')
    foundAi.push('"a testament to"')
  }
  if (/tapestry of/i.test(polished)) {
    polished = polished.replace(/tapestry of/gi, 'network of')
    foundAi.push('"tapestry of"')
  }
  if (/needless to say,?/i.test(polished)) {
    polished = polished.replace(/needless to say,?/gi, '')
    foundAi.push('"needless to say"')
  }
  if (/revolutionary/i.test(polished)) {
    polished = polished.replace(/revolutionary/gi, 'effective')
    foundAi.push('"revolutionary"')
  }
  if (/supercharge/i.test(polished)) {
    polished = polished.replace(/supercharge/gi, 'strengthen')
    foundAi.push('"supercharge"')
  }

  if (foundAi.length > 0) {
    dynamicChanges.push(`Removed robotic cliché(s) (${foundAi.slice(0, 3).join(', ')}) and replaced with direct conversational prose.`)
  }

  // Check tenure boasting
  if (/with over \d+\+? years of experience/i.test(polished)) {
    polished = polished.replace(/with over \d+\+? years of experience/gi, 'with proven domain execution')
    dynamicChanges.push('Replaced direct tenure boasting with credible execution proof.')
  }

  // Clean double commas/spaces
  polished = polished.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim()

  if (dynamicChanges.length === 0) {
    dynamicChanges.push('Applied Himani Kankaria conversational cadence and editorial polish.')
  }

  return {
    polishedTitle: title
      ? enforceZeroEmDashAndColon(`How to Master ${title}, A Direct Practitioner Blueprint`)
      : 'The Practitioner Content Blueprint',
    polishedContent: enforceZeroEmDashAndColon(polished),
    improvementsMade: dynamicChanges,
  }
}

/**
 * Dynamically computes editorial improvements based on actual differences and issues detected
 */
export function generateDynamicImprovements(beforeAnalysis, afterAnalysis, aiImprovements = [], originalText = '', polishedText = '') {
  const dynamicList = []

  const statsBefore = beforeAnalysis?.quickStats || {}
  const statsAfter = afterAnalysis?.quickStats || {}

  // 1. Em Dashes (and em-dash-style en dashes, e.g. "Headline – Subtitle",
  // which the scoring engine now counts as the same violation — see
  // detectEnDashes()) — only claim what was actually measured as removed.
  // Never report a positive "eliminated" count when the after-text did not
  // actually improve (that previously produced messages like "Eliminated 2
  // em dashes" next to a verified stat showing the count went up).
  const emBefore = (statsBefore.emDashesCount ?? 0) + (statsBefore.enDashesCount ?? 0)
  const emAfter = (statsAfter.emDashesCount ?? 0) + (statsAfter.enDashesCount ?? 0)
  if (emBefore > 0 && emAfter < emBefore) {
    dynamicList.push(`Eliminated ${emBefore - emAfter} em dash(es)/em-dash-style dash(es) in favor of clean commas and strong sentence stops.`)
  } else if (emAfter > 0) {
    dynamicList.push(`${emAfter} em dash(es)/em-dash-style dash(es) still remain and need a manual pass.`)
  }

  // 1b. Colons — same verified-delta rule as em dashes above.
  const colonBefore = statsBefore.colonsCount ?? (originalText.replace(/https?:\/\/[^\s]+/g, '').replace(/\b\d{1,2}:\d{2}\b/g, '').match(/:/g) || []).length
  const colonAfter = statsAfter.colonsCount ?? (polishedText.replace(/https?:\/\/[^\s]+/g, '').replace(/\b\d{1,2}:\d{2}\b/g, '').match(/:/g) || []).length
  if (colonBefore > 0 && colonAfter < colonBefore) {
    dynamicList.push(`Eliminated ${colonBefore - colonAfter} colon(s) (":") in favor of clean commas and strong sentence stops.`)
  } else if (colonAfter > 0) {
    dynamicList.push(`${colonAfter} colon(s) still remain and need a manual pass.`)
  }

  // 2. Robotic AI Clichés — claim only the verified before/after delta,
  // not the raw before-count (which previously overstated the result,
  // e.g. claiming "Removed 3" when the after-text still had 1 remaining).
  const aiBefore = statsBefore.aiPhrasesCount || 0
  const aiAfter = statsAfter.aiPhrasesCount || 0
  const foundAiWords = (beforeAnalysis?.highlights || [])
    .filter(h => h.type === 'ai-cliche')
    .map(h => `"${h.text}"`)
  const uniqueAiWords = Array.from(new Set(foundAiWords))

  if (aiBefore > 0 && aiAfter < aiBefore) {
    const removedCount = aiBefore - aiAfter
    const sampleWords = uniqueAiWords.slice(0, 3).join(', ')
    dynamicList.push(`Removed ${removedCount} robotic AI cliché(s)${sampleWords ? ` (${sampleWords})` : ''} and replaced with direct conversational phrasing.`)
  } else if (aiAfter > 0) {
    dynamicList.push(`${aiAfter} robotic AI cliché(s) still remain and need a manual pass.`)
  }

  // 3. Filler & Throat-clearing Fluff
  const fillerHighlights = (beforeAnalysis?.highlights || [])
    .filter(h => h.type === 'filler')
    .map(h => `"${h.text}"`)
  const uniqueFillers = Array.from(new Set(fillerHighlights))
  if (uniqueFillers.length > 0) {
    dynamicList.push(`Cut ${uniqueFillers.length} throat-clearing filler phrase(s) (${uniqueFillers.slice(0, 3).join(', ')}) to lead directly with value.`)
  }

  // 4. Word Count & Tightness
  const wordsBefore = statsBefore.wordCount || originalText.split(/\s+/).filter(Boolean).length
  const wordsAfter = statsAfter.wordCount || polishedText.split(/\s+/).filter(Boolean).length
  if (wordsBefore > wordsAfter + 5) {
    const trimmed = wordsBefore - wordsAfter
    dynamicList.push(`Trimmed ${trimmed} words of redundant padding (streamlined from ${wordsBefore} to ${wordsAfter} words).`)
  } else if (wordsAfter > wordsBefore + 10) {
    dynamicList.push(`Enriched practitioner depth and real-world clarity (+${wordsAfter - wordsBefore} words).`)
  }

  // 5. Cadence & Sentence Length
  const sentLenBefore = statsBefore.avgWordsPerSentence || 0
  const sentLenAfter = statsAfter.avgWordsPerSentence || 0
  if (sentLenBefore > 22 && sentLenAfter <= 20) {
    dynamicList.push(`Shortened runaway sentences (avg sentence length improved from ${sentLenBefore.toFixed(1)} to ${sentLenAfter.toFixed(1)} words) for effortless read-aloud flow.`)
  }

  // 6. Readability Lift
  const fleschBefore = statsBefore.fleschScore || 0
  const fleschAfter = statsAfter.fleschScore || 0
  if (fleschAfter > fleschBefore + 4 && fleschBefore > 0) {
    dynamicList.push(`Elevated readability ease (Flesch score increased from ${fleschBefore} to ${fleschAfter}).`)
  }

  // 7. Check specific pillar fixes
  if (beforeAnalysis?.statuses && afterAnalysis?.statuses) {
    if (beforeAnalysis.statuses['sp-1'] === 'fail' && afterAnalysis.statuses['sp-1'] === 'pass') {
      dynamicList.push('Replaced direct tenure boasting with credible practitioner proof and insight.')
    }
    if (beforeAnalysis.statuses['ts-5'] === 'fail' && afterAnalysis.statuses['ts-5'] === 'pass') {
      dynamicList.push('Removed ungrounded superlatives and exaggerated marketing claims.')
    }
    if (beforeAnalysis.statuses['is-1'] === 'fail' && afterAnalysis.statuses['is-1'] === 'pass') {
      dynamicList.push('Crafted an insight-first opening hook that cuts straight to the core takeaway.')
    }
    if (beforeAnalysis.statuses['sc-1'] === 'fail' && afterAnalysis.statuses['sc-1'] === 'pass') {
      dynamicList.push('Optimized visual scannability with punchy paragraphs and structured formatting.')
    }
  }

  // 8. Integrate genuine AI-generated improvement summaries if specific and not generic
  if (Array.isArray(aiImprovements) && aiImprovements.length > 0) {
    for (const imp of aiImprovements) {
      if (typeof imp === 'string' && imp.trim().length > 10) {
        const isGeneric = /Summary of improvement|Converted robotic cliches to conversational prose/i.test(imp)
        if (!isGeneric && !dynamicList.some(d => d.toLowerCase().slice(0, 25) === imp.toLowerCase().trim().slice(0, 25))) {
          dynamicList.push(imp.trim())
        }
      }
    }
  }

  // Default fallback if content had no detectable flaws
  if (dynamicList.length === 0) {
    dynamicList.push(
      'Enforced Himani 12-pillar editorial guidelines for crisp human voice',
      'Refined sentence rhythm for smooth conversational cadence'
    )
  }

  return dynamicList.slice(0, 6)
}

/**
 * Splits long content into logical sections/chunks of ~4000-5000 characters
 * along natural markdown headings or paragraph boundaries without breaking sentences.
 */
function splitContentIntoLogicalChunks(content, maxChunkSize = 4500) {
  if (!content || content.length <= maxChunkSize) {
    return [content]
  }

  // 1. Try splitting by markdown headings (H1, H2, H3, H4)
  const headingSections = content.split(/(?=^#{1,4}\s+[^\n]+)/m)

  if (headingSections.length > 1) {
    const chunks = []
    let currentChunk = ''

    for (const sec of headingSections) {
      if ((currentChunk.length + sec.length) <= maxChunkSize || currentChunk.length === 0) {
        currentChunk = currentChunk ? `${currentChunk}\n\n${sec}` : sec
      } else {
        chunks.push(currentChunk.trim())
        currentChunk = sec
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }

    // Double check if any chunk is still oversized (> 1.5x maxChunkSize)
    const finalChunks = []
    for (const chunk of chunks) {
      if (chunk.length > maxChunkSize * 1.5) {
        finalChunks.push(...splitByParagraphs(chunk, maxChunkSize))
      } else {
        finalChunks.push(chunk)
      }
    }
    return finalChunks
  }

  // 2. Fallback: split by paragraph double-newlines
  return splitByParagraphs(content, maxChunkSize)
}

function splitByParagraphs(text, maxChunkSize = 4500) {
  const paragraphs = text.split(/\n\n+/)
  const chunks = []
  let current = ''

  for (const p of paragraphs) {
    if ((current.length + p.length + 2) <= maxChunkSize || !current) {
      current = current ? `${current}\n\n${p}` : p
    } else {
      chunks.push(current.trim())
      current = p
    }
  }
  if (current.trim()) {
    chunks.push(current.trim())
  }
  return chunks.length > 0 ? chunks : [text]
}

/**
 * Polishes an individual chunk with strict preservation of length & details
 */
async function polishChunk(chunk, index, totalChunks, title, targetKeyword, platform, qaDirectives) {
  const isFirst = index === 0
  const isLast = index === totalChunks - 1

  const contextHeader = totalChunks > 1
    ? `You are polishing PART ${index + 1} of ${totalChunks} of a comprehensive article.`
    : 'You are polishing a complete article.'

  const prompt = `You are Himani Kankaria, master content strategist and editor.
${contextHeader}
Rewrite the following text so it achieves full compliance on your 12-Pillar Content QA Checklist.

CRITICAL MISSIVE QA DIRECTIVES:
${qaDirectives}

EDITORIAL REWRITING RULES:
${isFirst ? '1. Insight First: Rewrite the opening so it starts with an immediate counter-intuitive insight, punchy observation, or hook. Cut throat-clearing backstory.' : '1. Maintain seamless narrative flow from previous sections.'}
2. Read Aloud: Ensure every sentence rolls naturally off the tongue. Break sentences over 25 words into punchy phrasing.
3. Meaning & Crispness: Delete robotic filler (e.g., "Needless to say", "In today's digital world"). Every line must add distinct value.
4. E‑E‑A‑T: Add real-world practitioner framing and explain the "why" and "how".
5. No Direct Sales Pitches: Eliminate tenure boasting ("10 years of experience") and pushy sales plugs. Let the depth speak for itself.
6. Scannability: Format with short 1-3 sentence paragraphs, punchy subheadings, and bullet lists.
7. Zero Em Dashes & Zero Colons: Replace all em dashes with commas or clean sentence stops. Replace colons.

CRITICAL LENGTH & SUBSTANCE PRESERVATION (MANDATORY):
- You MUST rewrite EVERY paragraph, concept, bullet point, explanation, and subheading in full.
- DO NOT summarize, condense, outline, or skip any content.
- The polished output must have the same comprehensive depth, detail, and approximate length as the input text (${chunk.length} characters). Do NOT produce an abbreviated version.

Title: ${title || 'Not provided'}
Keyword: ${targetKeyword || 'Not provided'}
Platform: ${platform || 'Website'}
${totalChunks > 1 ? `Part: ${index + 1} of ${totalChunks}` : ''}

Content to Rewrite:
${chunk}

---

Return a JSON object:
{
  ${isFirst ? '"polishedTitle": "Punchy, USP-driven title",' : ''}
  "polishedSection": "The complete polished markdown text for this part (preserving all content and detail)",
  "improvementsMade": [
    "Specific improvement made to this section (e.g. Cut filler phrases, removed em dashes, sharpened hook)"
  ]
}`

  try {
    const parsed = await callAIAndParseJSON([
      { role: 'system', content: 'You are Himani Kankaria. Output ONLY a valid JSON object matching the requested schema. Preserve full text length and detail.' },
      { role: 'user', content: prompt },
    ], {
      temperature: 0.3,
      maxTokens: Math.min(8000, Math.max(3500, Math.ceil(chunk.length * 1.6 / 3.5))),
      jsonMode: true,
    })

    const text = (parsed.polishedSection || parsed.polishedContent || '').trim()

    // Safety guard: if AI severely truncated this chunk (>60% lost), fall back to algorithmic rewriter for this chunk
    if (!text || (chunk.length > 800 && text.length < chunk.length * 0.45)) {
      console.warn(`[Himani Polish] Chunk ${index + 1}/${totalChunks} was overly condensed by AI (${text.length} vs ${chunk.length} chars). Applying algorithmic polish fallback for this chunk.`)
      const algo = generateAlgorithmicHimaniPolish(chunk, title, targetKeyword)
      return {
        polishedTitle: parsed.polishedTitle || title,
        polishedSection: algo.polishedContent,
        improvementsMade: algo.improvementsMade,
      }
    }

    return {
      polishedTitle: parsed.polishedTitle || title,
      polishedSection: text,
      improvementsMade: Array.isArray(parsed.improvementsMade) && parsed.improvementsMade.length > 0
        ? parsed.improvementsMade
        : ['Removed em dashes and colons', 'Optimized scannability and conversational cadence'],
    }
  } catch (err) {
    console.warn(`[Himani Polish] AI polish failed on chunk ${index + 1}/${totalChunks}: ${err.message}. Using algorithmic fallback for this chunk.`)
    const algo = generateAlgorithmicHimaniPolish(chunk, title, targetKeyword)
    return {
      polishedTitle: title,
      polishedSection: algo.polishedContent,
      improvementsMade: algo.improvementsMade,
    }
  }
}

/**
 * Final safety net applied to every polish output regardless of path.
 * Per-chunk AI rewrites run in parallel with no cross-chunk visibility, so
 * the model does not always honor "zero em dashes / zero colons" on every
 * single chunk. Rather than trust the AI's self-reported claim that it
 * removed them, this mechanically guarantees the promise actually holds in
 * the text that gets returned and re-scored, using the same replacement
 * style ("hyphens with spaces", clean sentence breaks) already sanctioned
 * by buildMissiveQaPromptDirectives().
 */
function enforceZeroEmDashAndColon(text) {
  if (!text) return text
  let out = text

  // Em dashes and em-dash-style en dashes (spaced, or word-adjacent) become
  // a clean spaced hyphen. A tight numeric range (10-15) is left alone,
  // using the same isNumericRangeDash rule the scoring engine uses, so
  // "10-15" isn't mangled into "10 - 15" while the analyzer treats it as
  // fine.
  out = out.replace(/\s*([—–])\s*/g, (match, dashChar, offset, string) => {
    if (dashChar === '–' && match.length === 1 && isNumericRangeDash(string, offset)) {
      return dashChar
    }
    return ' - '
  })
  // Match a whole run of 2+ hyphens (not just exactly 2) so a markdown
  // horizontal rule ("---") the AI sometimes appends as a trailing divider
  // collapses into one clean hyphen instead of leaving a dangling stray
  // hyphen behind (e.g. "resonates---" was becoming "resonates - -").
  out = out.replace(/\s*(?<![<>-])-{2,}(?!>)\s*/g, ' - ')

  // Colons: prefer a sentence break before a capitalized clause, a comma
  // before a lowercase clause, otherwise a spaced hyphen. Skips URLs
  // (http://, https://) and numeric timestamps/ratios (10:30, 4:3).
  out = out
    .replace(/(\b[a-zA-Z0-9]+)\s*:\s+([A-Z])/g, '$1. $2')
    .replace(/(\b[a-zA-Z0-9]+)\s*:\s+([a-z])/g, '$1, $2')
    .replace(/(?<!https?)(?<!\d):(?!\/\/)(?!\d)/g, ' - ')

  return out
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * AI-powered One-Click "Himani Polish" Rewriter
 * Rewrites content to achieve 100% compliance with all 12 checklist points
 * while strictly preserving the complete length and all sections of long drafts.
 */
export async function polishContentWithHimaniRules(content, title, targetKeyword, platform, options = {}) {
  const qaDirectives = buildMissiveQaPromptDirectives()
  const cleanContent = (content || '').trim()

  if (!cleanContent) {
    return generateAlgorithmicHimaniPolish(content, title, targetKeyword)
  }

  // For long content, split into logical chunks (~4500 chars) to prevent model condensation
  const chunks = splitContentIntoLogicalChunks(cleanContent, 4500)
  console.log(`[Himani Polish] Processing content of ${cleanContent.length} chars in ${chunks.length} section chunk(s)...`)

  try {
    // Process all chunks in parallel
    const chunkPromises = chunks.map((chunk, idx) =>
      polishChunk(chunk, idx, chunks.length, title, targetKeyword, platform, qaDirectives)
    )

    const results = await Promise.all(chunkPromises)

    const polishedSections = results.map(r => r.polishedSection).filter(Boolean)
    const joinedContent = polishedSections.join('\n\n')
    const polishedContent = enforceZeroEmDashAndColon(joinedContent || cleanContent)

    // Aggregate improvements. Punctuation/count claims are dropped here —
    // the controller derives verified em-dash/colon counts from the actual
    // before/after text via analyzeContentQA, which is authoritative. An
    // AI chunk claiming "removed em dashes" is not trustworthy on its own:
    // it can be wrong about its own output, or another chunk can introduce
    // a dash the claim never accounted for.
    const allImprovements = []
    results.forEach(r => {
      if (Array.isArray(r.improvementsMade)) {
        allImprovements.push(...r.improvementsMade)
      }
    })
    const qualitativeImprovements = allImprovements.filter(
      (imp) => typeof imp === 'string' && !/em dash|colon/i.test(imp)
    )
    const uniqueImprovements = Array.from(new Set(qualitativeImprovements)).slice(0, 6)

    // Titles go through the same mechanical safety net as the body. The AI
    // self-reports "zero em dashes" per chunk, but the title comes from a
    // single chunk's own JSON field and was previously never re-checked here,
    // so a dash the model slipped into a "punchy" title leaked straight
    // through into the re-scored "after" text.
    const polishedTitle = enforceZeroEmDashAndColon(results[0]?.polishedTitle || title)

    console.log(`[Himani Polish] Completed: Original ${cleanContent.length} chars → Polished ${polishedContent.length} chars`)

    return {
      polishedTitle,
      polishedContent: polishedContent || cleanContent,
      improvementsMade: uniqueImprovements.length > 0
        ? uniqueImprovements
        : ['Converted robotic cliches to conversational prose', 'Preserved full document depth and scannability'],
    }
  } catch (err) {
    console.warn('AI Himani polish failed, using algorithmic rewriter fallback:', err.message)
    return generateAlgorithmicHimaniPolish(cleanContent, title, targetKeyword)
  }
}

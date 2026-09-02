/**
 * AI-powered Content QA Reviewer & Polisher
 * Based on Himani Kankaria's 12-Pillar Content QA Checklist
 */

import { callAIAndParseJSON, getConfiguredProviders } from '../utils/aiProvider.js'

const SYSTEM_PROMPT = `You are Himani Kankaria's AI Content QA Auditor. You evaluate content strictly against Himani Kankaria's 12-Pillar Content QA Checklist:

1. Tone, Style, and AI Check:
   - Is the tone human, crisp, and conversational?
   - No robotic phrases, no fluff, no clichés ("delve", "tapestry", "beacon", "game-changer", "testament").
   - Strictly ZERO em dashes ("—", "--").
   - Sentences clear, complete, not abrupt.

2. Read Aloud Test:
   - If read out loud, does it sound natural?
   - Does it hold attention, sound confident, and flow smoothly?
   - Can any line be shortened without losing meaning?

3. Audience Alignment:
   - Is this clearly written for ONE specific target audience?
   - Does it fulfill the purpose of searching & reading?
   - Would this make them pause and read (scroll-stopping hook)?

4. E-E-A-T Check:
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
  const excerpt = content.substring(0, 14000)

  return `Perform a comprehensive 12-Pillar QA Audit based on Himani Kankaria's Content QA Checklist.

## Content Details
Title: ${title || 'Not provided'}
Target Keyword: ${targetKeyword || 'Not provided'}
Target Platform: ${platform || 'Website'}
Target Audience / Voice: ${targetAudience || 'General / Professional'}

## Programmatic Pre-Check Findings
Word Count: ${programmaticData?.meta?.wordCount || 0}
Sentences: ${programmaticData?.meta?.sentenceCount || 0}
Flesch Score: ${programmaticData?.meta?.flesch || 0}
Em Dashes Found: ${programmaticData?.quickStats?.emDashesCount || 0}
AI Cliches Detected: ${programmaticData?.quickStats?.aiPhrasesCount || 0}
Programmatic Overall: ${programmaticData?.overall || 0}%

## Content to Audit
${excerpt}

---

Return a JSON object adhering to this schema:
{
  "overallScore": 0-100,
  "publicationReadiness": "Ready to Publish" | "Minor Polish Needed" | "Needs Revision" | "Major QA Overhaul Required",
  "summary": "2-3 sentence executive assessment summarizing overall tone, strengths, and primary weaknesses.",
  "topFixes": [
    "Most urgent fix #1 with specific guidance",
    "Most urgent fix #2 with specific guidance",
    "Most urgent fix #3 with specific guidance",
    "Most urgent fix #4 with specific guidance"
  ],
  "categories": {
    "tone_style_ai": {
      "score": 0-100,
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["specific issues with quotes from text"],
      "suggestions": ["actionable recommendations"]
    },
    "read_aloud": {
      "score": 0-100,
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["lines that sound awkward or wordy when spoken"],
      "suggestions": ["shortening suggestions"]
    },
    "audience_alignment": {
      "score": 0-100,
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["audience disconnects"],
      "suggestions": ["alignment tweaks"]
    },
    "eeat_check": {
      "score": 0-100,
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["lack of lived experience / generic claims"],
      "suggestions": ["where to inject proof or experience"]
    },
    "insight_first": {
      "score": 0-100,
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["throat-clearing or slow opening"],
      "suggestions": ["suggested opening hook"]
    },
    "meaning_crispness": {
      "score": 0-100,
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["filler sentences or fluff"],
      "suggestions": ["lines to delete or tighten"]
    },
    "zero_offensiveness": {
      "score": 0-100,
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["any questionable remarks"],
      "suggestions": ["respectful reframing"]
    },
    "brand_positioning": {
      "score": 0-100,
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["brand voice drift or salesy tone"],
      "suggestions": ["authority-building adjustments"]
    },
    "structure_check": {
      "score": 0-100,
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["flow gaps, past-tense overuse, weak headline"],
      "suggestions": ["headline / structural improvements"]
    },
    "no_direct_sales_pitches": {
      "score": 0-100,
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["milestone bragging or pushy CTAs"],
      "suggestions": ["subtle storytelling adjustments"]
    },
    "compliance_risk": {
      "score": 0-100,
      "status": "pass" | "warning" | "fail",
      "verdict": "One sentence summary for this pillar",
      "issues": ["compliance or risk triggers"],
      "suggestions": ["safe compliant wording"]
    },
    "visual_platform_fit": {
      "score": 0-100,
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
  const clamp = (v) => Math.min(100, Math.max(0, typeof v === 'number' ? v : 65))
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
      score: clamp(raw.score),
      status: validStatus(raw.status),
      verdict: typeof raw.verdict === 'string' ? raw.verdict : 'Audited for quality and alignment.',
      issues: toArray(raw.issues),
      suggestions: toArray(raw.suggestions),
    }
  }

  return {
    overallScore: clamp(report?.overallScore),
    publicationReadiness: report?.publicationReadiness || (report?.overallScore >= 80 ? 'Ready to Publish' : 'Minor Polish Needed'),
    summary: typeof report?.summary === 'string' ? report.summary : 'Analysis completed against Himani Kankaria\'s Content QA framework.',
    topFixes: toArray(report?.topFixes),
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
      temperature: 0.25,
      maxTokens: 5500,
      jsonMode: true,
      preferredProvider: options.preferredProvider,
    })

    console.log('✓ Himani AI content QA review complete — overall:', parsed?.overallScore)
    return validateReport(parsed)
  } catch (err) {
    console.error('AI content QA review failed:', err.message)
    return null
  }
}

/**
 * AI-powered One-Click "Himani Polish" Rewriter
 * Rewrites the content to achieve 100% compliance with all 12 checklist points
 */
export async function polishContentWithHimaniRules(content, title, targetKeyword, platform, options = {}) {
  const providers = getConfiguredProviders()
  if (providers.length === 0) {
    throw new Error('AI provider is not configured. Please check your API keys.')
  }

  const polishPrompt = `You are Himani Kankaria, master content strategist and editor.
Rewrite the following content so it achieves a 100% flawless score on your 12-Pillar Content QA Checklist.

CRITICAL RULES TO APPLY:
1. Tone, Style & AI: Make the tone crisp, human, conversational, with natural cadence. ELIMINATE all robotic cliches (no "delve", "tapestry", "game-changer", "testament").
2. Zero Em Dashes: STAMP OUT every single em dash ("—", "--"). Use commas, periods, or clean sentence structures instead.
3. Insight First: Rewrite the opening so it starts with an immediate counter-intuitive insight, punchy observation, or hook. CUT the throat-clearing backstory.
4. Read Aloud: Ensure every sentence rolls naturally off the tongue. Break sentences over 25 words.
5. Meaning & Crispness: Delete every filler sentence (e.g., "Needless to say", "In today's world"). Every single line must add distinct value.
6. E-E-A-T: Add real-world practitioner framing and explain the "why" and "how".
7. No Direct Sales Pitches: Eliminate tenure boasting ("10 years of experience") and pushy sales plugs. Let the depth speak for itself.
8. Scannability: Format with short 1-3 sentence paragraphs, punchy subheadings, and bullet lists.

Title: ${title || 'Not provided'}
Keyword: ${targetKeyword || 'Not provided'}
Platform: ${platform || 'Website'}

Content to Rewrite:
${content.substring(0, 10000)}

---

Return a JSON object:
{
  "polishedTitle": "Punchy, USP-driven title",
  "polishedContent": "The complete rewritten content in markdown",
  "improvementsMade": [
    "Summary of improvement 1 (e.g. Removed 4 em dashes and converted to crisp sentence breaks)",
    "Summary of improvement 2 (e.g. Cut 65 words of throat-clearing intro and led with the contrarian hook)",
    "Summary of improvement 3 (e.g. Replaced robotic buzzwords with conversational phrasing)",
    "Summary of improvement 4 (e.g. Structured into high-impact scannable bullet points)"
  ],
  "himaniScoreBefore": 65,
  "himaniScoreAfter": 98
}`

  try {
    const parsed = await callAIAndParseJSON([
      { role: 'system', content: 'You are Himani Kankaria. Output ONLY a valid JSON object matching the requested schema.' },
      { role: 'user', content: polishPrompt },
    ], {
      temperature: 0.35,
      maxTokens: 5000,
      jsonMode: true,
      preferredProvider: options.preferredProvider,
    })

    return {
      polishedTitle: parsed.polishedTitle || title,
      polishedContent: parsed.polishedContent || content,
      improvementsMade: Array.isArray(parsed.improvementsMade) ? parsed.improvementsMade : [],
      himaniScoreBefore: parsed.himaniScoreBefore || 60,
      himaniScoreAfter: parsed.himaniScoreAfter || 98,
    }
  } catch (err) {
    console.error('Himani content polish failed:', err.message)
    throw new Error(`Content polish failed: ${err.message}`)
  }
}

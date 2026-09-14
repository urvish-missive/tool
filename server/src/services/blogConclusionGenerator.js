import { callAIAndParseJSON } from '../utils/aiProvider.js'
import { TONE_PROFILES } from './blogTopicGenerator.js'
import { buildMissiveQaPromptDirectives } from '../utils/missiveQaRules.js'
import { validateFactSafety } from './factValidator.js'

/**
 * Removes any sentence containing an unverifiable factual claim (per
 * validateFactSafety) instead of patching just the number in place.
 * A word-level swap ("the top measurable improvements approach X") reads as
 * broken grammar and still ships a sentence built around a claim that no
 * longer makes sense once the number is gone. Dropping the whole sentence
 * costs at most one sentence of a paragraph, which is a far smaller problem
 * than a false or garbled claim reaching the reader.
 */
function stripUnsafeSentences(text) {
  if (!text) return text
  const paragraphs = text.split(/\n\s*\n/)
  const rebuilt = paragraphs.map((para) => {
    const sentences = para.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [para]
    const kept = sentences
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => validateFactSafety(s).safe)
    return kept.join(' ')
  })
  return rebuilt.filter(Boolean).join('\n\n').trim()
}

/**
 * Fact-safety pass applied to every AI-generated conclusion before it's
 * returned, as a backstop against the model inventing an unverifiable
 * claim (a statistic, a benchmark, a client result) the EVIDENCE SAFETY
 * RULE in the prompt already forbids.
 */
function applyFactSafety(hookClosure, body, ctaPrompt) {
  return {
    hookClosure: stripUnsafeSentences(hookClosure),
    body: stripUnsafeSentences(body),
    ctaPrompt: stripUnsafeSentences(ctaPrompt),
  }
}

/**
 * Funnel stage definitions and conversion intent for conclusions
 */
export const CONCLUSION_FUNNEL_STAGES = {
  tofu: {
    label: 'TOFU (Awareness)',
    intent: 'Big-picture takeaway, mental model shift, inspirational mindset, and low-friction next step (e.g., related read or newsletter).',
    frameworks: [
      'The Perspective Shift & Open Loop Closer',
      'The Big-Picture Horizon & Low-Friction Step',
      'The Contrarian Challenge & Next Thought',
      'The Habit & Practice Manifesto',
    ],
  },
  mofu: {
    label: 'MOFU (Consideration)',
    intent: 'Framework recap, decision criteria summary, operational checklist, and lead magnet / template CTA.',
    frameworks: [
      'The Execution Blueprint & Resource Download',
      'The Comparison Verdict & Practical Roadmap',
      'The Common Pitfall Warning & Action Step',
      'The Step-by-Step Implementation Summary',
    ],
  },
  bofu: {
    label: 'BOFU (Decision & Conversion)',
    intent: 'Definitive ROI verdict, cost of inaction, urgency trigger, and direct product trial / consultation CTA.',
    frameworks: [
      'The Definitive ROI Verdict & Free Trial',
      'The Cost of Inaction & Demo Booking',
      'The Fast-Track Implementation Pitch',
      'The Bottom-Line Executive Choice',
    ],
  },
}

// Default button copy intentionally avoids specifics the tool has no way
// to verify for an arbitrary caller (trial length, "no CC required",
// consultation duration, a named asset type). Those are commercial details
// only the user's own ctaCustomText can supply — see the EVIDENCE SAFETY
// RULE in the prompt below.
export const CTA_GOALS = {
  demo: { label: 'Book a Demo / Strategy Call', defaultButton: 'Book a Strategy Call →' },
  trial: { label: 'Start Free Trial / Sign Up', defaultButton: 'Start Your Free Trial →' },
  lead_magnet: { label: 'Download Checklist / Template / Guide', defaultButton: 'Get the Free Resource →' },
  internal_link: { label: 'Read Next Related Article', defaultButton: 'Read the Next Article →' },
  comment: { label: 'Leave a Comment / Join Community Discussion', defaultButton: 'Drop Your Thoughts in the Comments Below ↓' },
  custom: { label: 'Custom Call to Action', defaultButton: 'Take the Next Step Today →' },
}

/**
 * Main Blog Conclusion Generator
 *
 * No template fallback: every conclusion is generated fresh from the AI
 * based on the caller's actual topic, intro, audience, and CTA goal. If the
 * AI call fails, or returns fewer conclusions than requested, this throws
 * rather than substituting canned template text, so a caller never receives
 * generic output silently presented as personalized.
 */
export async function generateBlogConclusions({
  topic,
  intro = '',
  keyTakeaways = '',
  ctaGoal = 'demo',
  ctaCustomText = '',
  funnelStage = 'all',
  audience = 'business professionals',
  targetKeywords = [],
  tone = 'authoritative',
  numVariations = 6,
  preferredProvider = 'groq',
}) {
  if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
    throw new Error('A valid blog topic or title is required (minimum 3 characters).')
  }

  const activeTone = (tone || 'authoritative').toLowerCase().trim()
  const toneProfile = TONE_PROFILES[activeTone] || TONE_PROFILES.authoritative

  const cleanTopic = topic.trim()
  const cleanIntro = (intro || '').trim()
  const cleanTakeaways = (keyTakeaways || '').trim()
  const ctaInfo = CTA_GOALS[ctaGoal] || CTA_GOALS.demo
  const defaultCtaBtn = ctaCustomText.trim() || ctaInfo.defaultButton
  const count = Math.min(Math.max(Number(numVariations) || 6, 3), 9)

  // Stage distribution
  let stagePlan = []
  if (funnelStage === 'all') {
    if (count === 3) {
      stagePlan = ['tofu', 'mofu', 'bofu']
    } else if (count === 6) {
      stagePlan = ['tofu', 'tofu', 'mofu', 'mofu', 'bofu', 'bofu']
    } else {
      stagePlan = ['tofu', 'tofu', 'tofu', 'mofu', 'mofu', 'mofu', 'bofu', 'bofu', 'bofu']
    }
  } else {
    stagePlan = Array(count).fill(funnelStage)
  }

  // Deterministically assign one framework per variation, cycling through
  // that stage's defined list. This removes the AI's freedom to invent a
  // framework name or repeat one across consecutive same-stage items —
  // the AI is told exactly which name to copy into each item, and the
  // sanitization step below overrides whatever it actually returns with
  // this same assignment, so the field is correct even if the AI ignores
  // the instruction.
  const stageAssignCounters = { tofu: 0, mofu: 0, bofu: 0 }
  const assignedFrameworks = stagePlan.map((s) => {
    const stageMeta = CONCLUSION_FUNNEL_STAGES[s] || CONCLUSION_FUNNEL_STAGES.tofu
    const idx = stageAssignCounters[s] || 0
    stageAssignCounters[s] = idx + 1
    return stageMeta.frameworks[idx % stageMeta.frameworks.length]
  })

  const qaDirectives = buildMissiveQaPromptDirectives()

  const systemPrompt = `You are Missive Digital's Principal Content Strategist and Conversion Copywriter.
Your task is to generate exactly ${count} distinct, high-converting, search-optimized blog article conclusions.

CRITICAL MISSIVE QA DIRECTIVES (APPLIED TO EVERY PIECE OF GENERATED TEXT):
${qaDirectives}

CRITICAL RULES (NON-NEGOTIABLE):
1. **NEVER USE THE WORD "CONCLUSION" OR "FINAL THOUGHTS" OR "SUMMARY" OR "WRAPPING UP"**:
   - The H2 title must be a SPECIFIC, creative, punchy headline that hooks the reader and conveys momentum.
   - Examples of BAD titles: "Conclusion", "Final Words", "In Summary", "Wrapping Up".
   - Examples of GOOD titles: "How to Scale Without the Burnout", "Where Does Your Traffic Strategy Go From Here", "The Bottom Line on Modern Programmatic SEO", "Your Next Step Towards High-Converting Funnels".
2. **INTRO LOOP CLOSURE**:
   ${cleanIntro ? '- You MUST examine the provided Blog Introduction. Deliberately close the open loop, answer the core question, or resolve the tension established in that opening.' : '- Establish a satisfying closure to the core challenge posed by the article title.'}
3. **NO FLUFF OR BORING SUMMARIES**:
   - Do not simply list bullet points. Synthesize the big-picture insight into an authoritative, actionable ending.
4. **HIGH-CONVERTING CTA INTEGRATION**:
   - Seamlessly transition from the takeaway into the desired Call to Action (${ctaInfo.label}).
5. **TONE OF VOICE MANDATE (${toneProfile.label})**:
   - ${toneProfile.directive}
   - Ensure the specific H2 titles, loop closure, body arguments, and CTA transitions authentically embody this tone.
6. **FRAMEWORK ACCURACY**: The "framework" field for each item must be copied exactly, character for character, from the list of frameworks given for that item's own funnel stage in the variations below. Never invent a new framework name, and never repeat the same framework name across two items in the same stage.
7. **EVIDENCE SAFETY RULE (STRICT, NON-NEGOTIABLE)**:
   - The conclusion must be based exclusively on information contained in the Main Topic / Title, Existing Blog Introduction, Key Takeaways, Target Audience, and Primary CTA Goal supplied in the context below. Do not invent or introduce factual evidence to make the conclusion more persuasive.
   - Never generate unsupported: statistics, percentages, benchmarks, research findings, study results, client results, revenue figures, ROI, CAC improvements, conversion improvements, rankings, time-to-result claims, payback periods, implementation timelines, customer counts, or monetary values.
   - Never claim that "brands", "clients", "companies", "studies", "research", "data", or "industry reports" produced a particular result unless that evidence was explicitly supplied in the context below.
   - Do not invent commercial details such as: free trials, trial duration, free consultations, consultation duration, pricing, discounts, guarantees, dashboards, audits, programs, checklists, guides, templates, or downloadable assets. Preserve the CTA Goal and Default Button Copy given below exactly as framed, without adding invented commercial specifics to it.
   - If quantitative evidence is unavailable, use qualitative strategic language instead.
   - BAD: "Brands using this strategy increased organic revenue 35% in six months."
   - GOOD: "This approach can help build a stronger foundation for sustainable organic visibility."
   - If you catch yourself about to state an unsupported factual claim, rewrite the ENTIRE sentence around a qualitative statement. Never patch only the unsupported number or detail with generic filler text (such as "measurable improvement") while leaving the rest of the sentence built around it.
   - This rule applies with no exceptions regardless of topic, industry, or niche — it is not limited to any specific business type.

RETURN JSON STRICTLY IN THIS FORMAT (NO PREAMBLE, NO CODEBLOCKS):
{
  "conclusions": [
    {
      "id": "conclusion-1",
      "specificH2Title": "The Specific Creative H2 Headline (NO Conclusion Word)",
      "funnelStage": "tofu",
      "funnelLabel": "TOFU (Awareness)",
      "framework": "Copied exactly from the framework list given for this item's own stage below, never invented",
      "hookClosure": "1-2 punchy sentences resolving the open loop from the intro.",
      "body": "2 short, impactful paragraphs synthesizing value and momentum.",
      "ctaPrompt": "1-2 sentences persuasively framing the next action.",
      "ctaButtonText": "Action-oriented button text (e.g. Download the Audit Checklist →)",
      "whyItWorks": "Why this specific conclusion framework converts for this audience."
    }
  ]
}`

  const userPrompt = `ARTICLE CONTEXT:
- Main Topic / Title: "${cleanTopic}"
${cleanIntro ? `- Existing Blog Introduction:\n"""\n${cleanIntro.slice(0, 1500)}\n"""` : '- Existing Blog Introduction: (Infer open loops from the title).'}
${cleanTakeaways ? `- Key Takeaways Covered in Article:\n"""\n${cleanTakeaways.slice(0, 800)}\n"""` : ''}
- Target Audience: ${audience}
- Primary Keywords: ${targetKeywords.length ? targetKeywords.join(', ') : cleanTopic}
- Primary CTA Goal: ${ctaInfo.label} (Default Button Copy: "${defaultCtaBtn}")
- Desired Tone: ${toneProfile.label} (${toneProfile.directive})

VARIATIONS TO GENERATE:
Generate an array of exactly ${count} items corresponding to these funnel stages. Each variation is pre-assigned an exact "framework" value: copy it into that item's "framework" field verbatim, do not substitute a different one.
${stagePlan.map((s, idx) => `Variation ${idx + 1}: ${CONCLUSION_FUNNEL_STAGES[s].label} - Stage Intent: ${CONCLUSION_FUNNEL_STAGES[s].intent} - Assigned framework: "${assignedFrameworks[idx]}"`).join('\n')}`

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    const result = await callAIAndParseJSON(messages, {
      preferredProvider: preferredProvider || 'groq',
      temperature: 0.72,
      // Without a template fallback, a truncated response is now a hard
      // failure (see the length check below), so this budget has to be
      // generous rather than tight. Dropping fullConclusion/wordCount/
      // readingTimeSeconds from the requested schema (they were computed
      // locally and never read from the AI's response anyway) already cuts
      // a large redundant chunk of output; the raised ceiling is headroom
      // on top of that.
      maxTokens: Math.min(Math.max(count * 450, 2600), 6000),
      timeout: 14000,
    })

    if (result && Array.isArray(result.conclusions) && result.conclusions.length > 0) {
      // Clean and sanitize results
      const sanitized = result.conclusions.slice(0, count).map((item, index) => {
        const stageKey = stagePlan[index] || item.funnelStage || 'tofu'
        const stageMeta = CONCLUSION_FUNNEL_STAGES[stageKey] || CONCLUSION_FUNNEL_STAGES.tofu

        // Ensure specific H2 title does not have generic "Conclusion"
        let cleanH2 = (item.specificH2Title || '').trim()
        cleanH2 = cleanH2.replace(/^#+\s*/, '')
        if (!cleanH2 || /^(conclusion|final thoughts|in conclusion|summary|wrapping up)/i.test(cleanH2)) {
          cleanH2 = `The Next Step: Putting ${cleanTopic} Into Action`
        }

        // Fact-check before rebuilding fullMarkdown so an unverifiable claim
        // never survives into the concatenated output.
        const safe = applyFactSafety(
          (item.hookClosure || '').trim(),
          (item.body || '').trim(),
          (item.ctaPrompt || '').trim()
        )
        const { hookClosure, body, ctaPrompt } = safe
        const ctaButtonText = (item.ctaButtonText || defaultCtaBtn).trim()

        const fullMarkdown = `## ${cleanH2}\n\n${hookClosure ? `${hookClosure}\n\n` : ''}${body}\n\n**Next Step:** ${ctaPrompt}\n\n[${ctaButtonText}]`

        const words = fullMarkdown.split(/\s+/).filter(Boolean).length

        return {
          id: item.id || `conclusion-${index + 1}`,
          specificH2Title: cleanH2,
          funnelStage: stageKey,
          funnelLabel: stageMeta.label,
          // Never trust item.framework directly — the AI has been observed
          // inventing framework names that don't exist in any stage's list
          // (e.g. "Framework Recap & Operational Checklist") and repeating
          // the same one across consecutive items. assignedFrameworks is
          // the deterministic ground truth already computed above.
          framework:
            assignedFrameworks[index] || stageMeta.frameworks[index % stageMeta.frameworks.length],
          hookClosure,
          body,
          ctaPrompt,
          ctaButtonText,
          fullConclusion: fullMarkdown,
          wordCount: item.wordCount || words,
          readingTimeSeconds: Math.ceil((item.wordCount || words) / 3.5),
          whyItWorks:
            item.whyItWorks ||
            'Closes the open loop established in the introduction and transitions into high-converting action.',
        }
      })

      // No template top-up: if the AI returned fewer conclusions than
      // requested (e.g. a truncated response), fail loudly rather than
      // padding the gap with canned text.
      if (sanitized.length < count) {
        throw new Error(
          `AI only returned ${sanitized.length} of ${count} requested conclusions. Please try again.`
        )
      }

      return {
        success: true,
        topic: cleanTopic,
        funnelFilter: funnelStage,
        tone: activeTone,
        totalGenerated: sanitized.length,
        conclusions: sanitized,
      }
    }

    throw new Error('AI returned an unexpected response structure')
  } catch (err) {
    console.error('[BlogConclusionGenerator] Generation failed:', err.message)
    throw new Error(
      err.message?.startsWith('AI only returned') || err.message === 'AI returned an unexpected response structure'
        ? `${err.message} No fallback template is used, so please retry.`
        : `Failed to generate blog conclusions: ${err.message}. Please try again.`
    )
  }
}

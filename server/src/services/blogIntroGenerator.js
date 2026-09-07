import { callAIAndParseJSON } from '../utils/aiProvider.js'

/**
 * Funnel stage definitions and characteristics
 */
export const FUNNEL_STAGES = {
  tofu: {
    label: 'Top of Funnel (Awareness)',
    intent: 'Problem-unaware or discovering. High curiosity, broad learning, conceptual clarity.',
    hookFormulas: [
      'The Contrarian Myth-Buster',
      'The Startling Statistic Hook',
      'The Empathetic Pain-Point Question',
      'The Story / Relatable Anecdote',
    ],
  },
  mofu: {
    label: 'Middle of Funnel (Consideration)',
    intent: 'Problem-aware, actively evaluating solutions, methodologies, frameworks, and pros/cons.',
    hookFormulas: [
      'Problem-Agitate-Solve (PAS)',
      'Before-After-Bridge (BAB)',
      'The Framework / Blueprint Teaser',
      'The Cautionary Mistake Hook',
    ],
  },
  bofu: {
    label: 'Bottom of Funnel (Decision & Conversion)',
    intent: 'Solution-aware, decision-ready, high-intent. Evaluating execution steps, ROI, and direct comparisons.',
    hookFormulas: [
      'The Direct ROI & Bottom-Line Hook',
      'The Cut-The-Fluff Action Hook',
      'The Proof-Driven Winner Verdict',
      'The Strategic Buyer Checklist',
    ],
  },
}

/**
 * Fallback introductions in case AI call fails or is rate-limited
 */
function getFallbackIntroductions(topic, audience = 'readers', targetKeywords = []) {
  const kw = targetKeywords.length ? targetKeywords[0] : topic
  return [
    {
      id: 'fallback-tofu-1',
      funnelStage: 'tofu',
      funnelLabel: 'Top of Funnel (Awareness)',
      hookFormula: 'The Contrarian Myth-Buster',
      hookLine: `Most advice you hear about ${topic} is not just outdated—it is actively holding your results back.`,
      body: `Every week, thousands of ${audience} double down on traditional playbooks hoping for a breakthrough. Yet the data shows that the top 5% approach ${kw} with an entirely different mental model that cuts wasted effort in half.`,
      transition: `In this guide, we break down exactly what the top performers are doing differently, and how you can replicate their playbook step-by-step.`,
      fullIntro: `Most advice you hear about ${topic} is not just outdated—it is actively holding your results back.\n\nEvery week, thousands of ${audience} double down on traditional playbooks hoping for a breakthrough. Yet the data shows that the top 5% approach ${kw} with an entirely different mental model that cuts wasted effort in half.\n\nIn this guide, we break down exactly what the top performers are doing differently, and how you can replicate their playbook step-by-step.`,
      wordCount: 78,
      readingTimeSeconds: 22,
      emotionalTrigger: 'Curiosity & Pattern-Interrupt',
      whyItWorks: 'Challenges conventional wisdom right out of the gate, forcing the reader to stop scrolling and question their current assumptions.',
    },
    {
      id: 'fallback-tofu-2',
      funnelStage: 'tofu',
      funnelLabel: 'Top of Funnel (Awareness)',
      hookFormula: 'The Startling Statistic Hook',
      hookLine: `Did you know that over 70% of initiatives focused on ${topic} stall out before ever delivering tangible ROI?`,
      body: `It is not because the goals are unrealistic—it is because most teams lack a clear framework to bridge the gap between initial strategy and day-to-day execution. Understanding the core mechanics of ${kw} is the single fastest way to flip those odds in your favor.`,
      transition: `Let's dive into the foundational principles you need to know before taking your next step.`,
      fullIntro: `Did you know that over 70% of initiatives focused on ${topic} stall out before ever delivering tangible ROI?\n\nIt is not because the goals are unrealistic—it is because most teams lack a clear framework to bridge the gap between initial strategy and day-to-day execution. Understanding the core mechanics of ${kw} is the single fastest way to flip those odds in your favor.\n\nLet's dive into the foundational principles you need to know before taking your next step.`,
      wordCount: 77,
      readingTimeSeconds: 21,
      emotionalTrigger: 'Data-Driven Validation',
      whyItWorks: 'Uses hard numbers to ground the problem in reality, creating urgency while establishing immediate credibility.',
    },
    {
      id: 'fallback-mofu-1',
      funnelStage: 'mofu',
      funnelLabel: 'Middle of Funnel (Consideration)',
      hookFormula: 'Problem-Agitate-Solve (PAS)',
      hookLine: `You already know that mastering ${topic} is critical, but choosing the right approach feels like navigating a minefield.`,
      body: `With endless options, conflicting opinions, and shrinking timelines, picking the wrong strategy does not just cost money—it wastes months of momentum that you can never get back. You do not need more generic theories; you need an objective blueprint for evaluating your best options.`,
      transition: `Below, we compare the leading methodologies for ${kw} so you can confidently pick the right path forward.`,
      fullIntro: `You already know that mastering ${topic} is critical, but choosing the right approach feels like navigating a minefield.\n\nWith endless options, conflicting opinions, and shrinking timelines, picking the wrong strategy does not just cost money—it wastes months of momentum that you can never get back. You do not need more generic theories; you need an objective blueprint for evaluating your best options.\n\nBelow, we compare the leading methodologies for ${kw} so you can confidently pick the right path forward.`,
      wordCount: 84,
      readingTimeSeconds: 24,
      emotionalTrigger: 'Agitated Pain & Relief',
      whyItWorks: 'Validates the reader\'s decision fatigue and positions your article as the ultimate clarity tool.',
    },
    {
      id: 'fallback-mofu-2',
      funnelStage: 'mofu',
      funnelLabel: 'Middle of Funnel (Consideration)',
      hookFormula: 'Before-After-Bridge (BAB)',
      hookLine: `Right now, executing ${topic} probably feels fragmented, manual, and unpredictably slow.`,
      body: `Imagine having a streamlined, battle-tested system where every element of ${kw} works seamlessly, generating predictable results without firefighting. The bridge between where you are today and that outcome is not working harder—it is implementing the right operational framework.`,
      transition: `Here is our detailed walkthrough of how that transformation works in practice.`,
      fullIntro: `Right now, executing ${topic} probably feels fragmented, manual, and unpredictably slow.\n\nImagine having a streamlined, battle-tested system where every element of ${kw} works seamlessly, generating predictable results without firefighting. The bridge between where you are today and that outcome is not working harder—it is implementing the right operational framework.\n\nHere is our detailed walkthrough of how that transformation works in practice.`,
      wordCount: 74,
      readingTimeSeconds: 21,
      emotionalTrigger: 'Visionary Relief & Aspiration',
      whyItWorks: 'Paints a visceral contrast between the current chaotic state and the ideal future state, making your guide the logical bridge.',
    },
    {
      id: 'fallback-bofu-1',
      funnelStage: 'bofu',
      funnelLabel: 'Bottom of Funnel (Decision & Conversion)',
      hookFormula: 'The Direct ROI & Bottom-Line Hook',
      hookLine: `If you are evaluating how to implement ${topic} this quarter, you need clear ROI figures—not marketing fluff.`,
      body: `When budget, executive buy-in, and measurable revenue are on the line, every decision around ${kw} carries real weight. You need to know what delivers immediate payback, where hidden bottlenecks lurk, and which partner or tooling aligns with your specific goals.`,
      transition: `Here is the comprehensive breakdown to help you make an executive-ready decision today.`,
      fullIntro: `If you are evaluating how to implement ${topic} this quarter, you need clear ROI figures—not marketing fluff.\n\nWhen budget, executive buy-in, and measurable revenue are on the line, every decision around ${kw} carries real weight. You need to know what delivers immediate payback, where hidden bottlenecks lurk, and which partner or tooling aligns with your specific goals.\n\nHere is the comprehensive breakdown to help you make an executive-ready decision today.`,
      wordCount: 77,
      readingTimeSeconds: 22,
      emotionalTrigger: 'Executive Certainty & High Conviction',
      whyItWorks: 'Speaks directly to the decision-maker who has zero patience for fluff and wants hard evaluation criteria.',
    },
    {
      id: 'fallback-bofu-2',
      funnelStage: 'bofu',
      funnelLabel: 'Bottom of Funnel (Decision & Conversion)',
      hookFormula: 'The Cut-The-Fluff Action Hook',
      hookLine: `You have done the preliminary research on ${topic}, and now it is time to execute.`,
      body: `The problem is that most implementation plans overcomplicate the rollout and stall before launch. To get maximum velocity from ${kw}, you only need to focus on the top 20% of actions that drive 80% of the commercial results.`,
      transition: `Let's jump straight into the exact step-by-step checklist to launch without friction.`,
      fullIntro: `You have done the preliminary research on ${topic}, and now it is time to execute.\n\nThe problem is that most implementation plans overcomplicate the rollout and stall before launch. To get maximum velocity from ${kw}, you only need to focus on the top 20% of actions that drive 80% of the commercial results.\n\nLet's jump straight into the exact step-by-step checklist to launch without friction.`,
      wordCount: 73,
      readingTimeSeconds: 20,
      emotionalTrigger: 'Action-Oriented Urgency',
      whyItWorks: 'Directly validates that the reader is ready to build or buy, cutting straight to action.',
    },
  ]
}

/**
 * Generate multiple blog post introductions across TOFU, MOFU, and BOFU categories
 */
export async function generateBlogIntroductions({
  topic,
  targetKeywords = [],
  targetAudience = '',
  funnelStage = 'all',
  tone = 'conversational',
  count = 6,
  preferredProvider = 'gemini-3.5-flash-lite',
}) {
  const audience = targetAudience?.trim() || 'target readers, marketers, and decision-makers'
  const keywordsList = Array.isArray(targetKeywords)
    ? targetKeywords.filter(Boolean).join(', ')
    : typeof targetKeywords === 'string'
      ? targetKeywords
      : ''

  const requestedCount = Math.min(Math.max(parseInt(count) || 6, 3), 18)

  let stageGuidance = ''
  if (funnelStage === 'tofu') {
    stageGuidance = `All ${requestedCount} intros must be TOFU (Top of Funnel - Awareness).
Formulas to use: Contrarian Myth-Buster, Startling Statistic, Relatable Story, Empathetic Pain-Point.`
  } else if (funnelStage === 'mofu') {
    stageGuidance = `All ${requestedCount} intros must be MOFU (Middle of Funnel - Consideration).
Formulas to use: Problem-Agitate-Solve (PAS), Before-After-Bridge (BAB), Framework Teaser, Cautionary Mistake.`
  } else if (funnelStage === 'bofu') {
    stageGuidance = `All ${requestedCount} intros must be BOFU (Bottom of Funnel - Decision & Conversion).
Formulas to use: Direct ROI & Payback, Cut-The-Fluff Action, Proof-Driven Verdict, Executive Buyer Checklist.`
  } else {
    const basePerStage = Math.floor(requestedCount / 3)
    const remainder = requestedCount % 3
    const tofuCount = basePerStage + (remainder > 0 ? 1 : 0)
    const mofuCount = basePerStage + (remainder > 1 ? 1 : 0)
    const bofuCount = basePerStage

    stageGuidance = `MANDATORY: Generate across ALL 3 Funnel Stages so every stage is covered:
- Exactly ${tofuCount} TOFU (Top of Funnel - Awareness) intros
- Exactly ${mofuCount} MOFU (Middle of Funnel - Consideration) intros
- Exactly ${bofuCount} BOFU (Bottom of Funnel - Decision & Conversion) intros
Total must be ${requestedCount}.`
  }

  const systemPrompt = `You are Missive Digital's elite conversion copywriter.
Craft high-retention, scroll-stopping blog post introductions engineered to slash bounce rates and maximize time-on-page.

COPYWRITING RULES:
1. First Sentence Hook: Must be an arresting pattern-interrupt (contrarian fact, raw truth, or visceral tension). Zero preamble.
2. Narrative Arc: 2-3 body sentences building the core stakes.
3. Bridge Line: Exactly 1 smooth transition sentence pulling the reader directly into the first section.
4. Banned Clichés: Never use "In today's fast-paced world", "Look no further", "Delve into", "Tapestry", "Let's explore", "Whether you are a...".
5. Return strictly valid JSON only.`

  const userPrompt = `Generate exactly ${requestedCount} blog post introductions for:
TOPIC: "${topic}"
KEYWORDS: "${keywordsList || topic}"
AUDIENCE: "${audience}"
TONE: "${tone}"
FUNNEL DISTRIBUTION:
${stageGuidance}

OUTPUT FORMAT (strictly JSON):
{
  "recommendedHook": "1 crisp sentence advising which hook to test first for this topic",
  "intros": [
    {
      "stage": "tofu",
      "formula": "The Contrarian Myth-Buster",
      "hook": "Single punchy sentence opening hook.",
      "body": "2 to 3 sentences agitating the core challenge.",
      "transition": "1 sentence bridging into the post.",
      "trigger": "Curiosity & Pattern-Interrupt",
      "why": "Why this psychological angle hooks the target audience."
    }
  ]
}`

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    const result = await callAIAndParseJSON(messages, {
      preferredProvider: preferredProvider || 'gemini-3.5-flash-lite',
      temperature: 0.6,
      maxTokens: Math.min(requestedCount * 220, 1500),
      timeout: 8000,
    })

    const rawList = Array.isArray(result.intros)
      ? result.intros
      : Array.isArray(result.introductions)
        ? result.introductions
        : []

    if (rawList.length > 0) {
      // Clean and normalize results
      const sanitizedIntros = rawList.map((item, idx) => {
        const stageRaw = (item.stage || item.funnelStage || 'tofu').toLowerCase()
        const validStage = ['tofu', 'mofu', 'bofu'].includes(stageRaw) ? stageRaw : 'tofu'
        const stageInfo = FUNNEL_STAGES[validStage]

        const hookLine = (item.hook || item.hookLine || '').trim()
        const body = (item.body || '').trim()
        const transition = (item.transition || '').trim()
        const fullIntro = (item.fullIntro || `${hookLine}\n\n${body}\n\n${transition}`).trim()

        const wordCount = item.wordCount || fullIntro.split(/\s+/).filter(Boolean).length
        const readingTimeSeconds = item.readingTimeSeconds || Math.max(Math.round(wordCount / 3.5), 10)

        return {
          id: item.id || `intro-${idx + 1}`,
          funnelStage: validStage,
          funnelLabel: item.funnelLabel || stageInfo.label,
          hookFormula: item.formula || item.hookFormula || 'Strategic Hook',
          hookLine,
          body,
          transition,
          fullIntro,
          wordCount,
          readingTimeSeconds,
          emotionalTrigger: item.trigger || item.emotionalTrigger || 'High Engagement',
          whyItWorks: item.why || item.whyItWorks || 'Captures attention and establishes strong relevance.',
        }
      })

      // Calculate actual breakdown
      const counts = { tofu: 0, mofu: 0, bofu: 0 }
      sanitizedIntros.forEach((item) => {
        if (counts[item.funnelStage] !== undefined) {
          counts[item.funnelStage]++
        }
      })

      return {
        summary: {
          topic,
          totalGenerated: sanitizedIntros.length,
          funnelBreakdown: counts,
          targetAudience: audience,
          tone,
          recommendedHook: result.recommendedHook || result.summary?.recommendedHook || 'Test the TOFU Contrarian hook for organic search, and MOFU/BOFU hooks for email newsletters and LinkedIn promos.',
        },
        introductions: sanitizedIntros,
        generatedAt: new Date().toISOString(),
      }
    }

    throw new Error('AI returned empty introductions list')
  } catch (err) {
    console.warn(`[BlogIntroGenerator] AI call failed or returned invalid JSON (${err.message}). Using high-quality fallback intros.`)

    const fallbackIntros = getFallbackIntroductions(topic, audience, targetKeywords)
    const filtered = funnelStage === 'all'
      ? fallbackIntros
      : fallbackIntros.filter((i) => i.funnelStage === funnelStage)

    const finalIntros = (filtered.length ? filtered : fallbackIntros).slice(0, requestedCount)

    const counts = { tofu: 0, mofu: 0, bofu: 0 }
    finalIntros.forEach((item) => {
      if (counts[item.funnelStage] !== undefined) {
        counts[item.funnelStage]++
      }
    })

    return {
      summary: {
        topic,
        totalGenerated: finalIntros.length,
        funnelBreakdown: counts,
        targetAudience: audience,
        tone,
        recommendedHook: 'Test the TOFU Contrarian hook for organic traffic, and MOFU PAS hook for newsletter campaigns.',
      },
      introductions: finalIntros,
      generatedAt: new Date().toISOString(),
      isFallback: true,
    }
  }
}

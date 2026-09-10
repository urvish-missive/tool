import { callAIAndParseJSON, apiResultCache } from '../utils/aiProvider.js'
import { TONE_PROFILES } from './blogTopicGenerator.js'
import { buildMissiveQaPromptDirectives } from '../utils/missiveQaRules.js'

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
 * Fallback template definitions for TOFU, MOFU, and BOFU stages
 */
const FALLBACK_TEMPLATES = {
  tofu: [
    {
      formula: 'The Contrarian Myth-Buster',
      trigger: 'Curiosity & Pattern-Interrupt',
      why: 'Challenges conventional wisdom right out of the gate, forcing readers to question their current assumptions.',
      hook: (t, a, kw) => `Most advice you hear about ${t} is not just outdated—it is actively holding your results back.`,
      body: (t, a, kw) => `Every week, thousands of ${a} double down on traditional playbooks hoping for a breakthrough. Yet the data shows that the top 5% approach ${kw} with an entirely different mental model that cuts wasted effort in half.`,
      transition: (t, a, kw) => `In this guide, we break down exactly what top performers are doing differently, and how you can replicate their playbook step-by-step.`,
    },
    {
      formula: 'The Startling Statistic Hook',
      trigger: 'Data-Driven Validation',
      why: 'Uses hard numbers to ground the problem in reality, creating urgency while establishing immediate credibility.',
      hook: (t, a, kw) => `Over 70% of initiatives focused on ${t} stall out before ever delivering tangible ROI.`,
      body: (t, a, kw) => `It is not because the goals are unrealistic—it is because most teams lack a clear framework to bridge the gap between initial strategy and day-to-day execution. Understanding the core mechanics of ${kw} is the single fastest way to flip those odds in your favor.`,
      transition: (t, a, kw) => `Let's dive into the foundational principles you need to know before taking your next step.`,
    },
    {
      formula: 'The Empathetic Pain-Point Question',
      trigger: 'Empathetic Resonance',
      why: 'Validates shared frustration, building immediate rapport and trust with the reader.',
      hook: (t, a, kw) => `Have you ever spent weeks refining your strategy for ${t}, only to feel like you are running on a hamster wheel?`,
      body: (t, a, kw) => `You are not alone. Between conflicting advice, rapid algorithmic shifts, and rising expectations, mastering ${kw} has become one of the most frustrating bottlenecks for modern ${a}.`,
      transition: (t, a, kw) => `Here is the clear, zero-jargon roadmap to finally get predictable traction.`,
    },
    {
      formula: 'The Relatable Story / Anecdote',
      trigger: 'Narrative Immersion',
      why: "Uses storytelling to hook the brain's natural curiosity for resolution.",
      hook: (t, a, kw) => `Six months ago, a growth team told us they were ready to abandon ${t} entirely.`,
      body: (t, a, kw) => `They were burnt out, under budget pressure, and seeing zero momentum from their existing setup. But once they made one fundamental tweak to how they approached ${kw}, their metrics doubled in ninety days.`,
      transition: (t, a, kw) => `Here is the exact story—and the simple playbook you can borrow today.`,
    },
    {
      formula: 'The "What Everyone Gets Wrong" Angle',
      trigger: 'FOMO & Mistake Avoidance',
      why: 'Triggers the fear of making unseen mistakes that cost valuable time and capital.',
      hook: (t, a, kw) => `The single biggest mistake in ${t} happens before anyone writes a word or launches a single campaign.`,
      body: (t, a, kw) => `Most teams optimize for vanity numbers rather than the structural leverage points that actually drive sustainable results with ${kw}. By diagnosing this one blind spot early, you immediately leapfrog the competition.`,
      transition: (t, a, kw) => `Let's break down the underlying architecture you need to set up first.`,
    },
    {
      formula: 'The Industry Shift Awakening',
      trigger: 'Urgency & Future-Proofing',
      why: 'Appeals to progressive readers who want to stay ahead of industry disruptions.',
      hook: (t, a, kw) => `The rules of ${t} just changed, and legacy playbooks are quietly failing across the board.`,
      body: (t, a, kw) => `As AI, search shifts, and evolving buyer habits rewrite the game, clinging to outdated approaches for ${kw} is a recipe for irrelevance. Modern ${a} need an updated operational framework.`,
      transition: (t, a, kw) => `Here is what the modern landscape actually looks like and how to position yourself ahead of the curve.`,
    },
  ],
  mofu: [
    {
      formula: 'Problem-Agitate-Solve (PAS)',
      trigger: 'Agitated Pain & Relief',
      why: 'Validates decision fatigue and positions your article as the ultimate clarity tool.',
      hook: (t, a, kw) => `You already know that mastering ${t} is critical, but choosing the right approach feels like navigating a minefield.`,
      body: (t, a, kw) => `With endless options, conflicting opinions, and shrinking timelines, picking the wrong strategy does not just cost money—it wastes months of momentum that you can never get back. You do not need more generic theories; you need an objective blueprint for evaluating your best options.`,
      transition: (t, a, kw) => `Below, we compare the leading methodologies for ${kw} so you can confidently pick the right path forward.`,
    },
    {
      formula: 'Before-After-Bridge (BAB)',
      trigger: 'Visionary Relief & Aspiration',
      why: 'Paints a visceral contrast between the current chaotic state and the ideal future state, making your guide the logical bridge.',
      hook: (t, a, kw) => `Right now, executing ${t} probably feels fragmented, manual, and unpredictably slow.`,
      body: (t, a, kw) => `Imagine having a streamlined, battle-tested system where every element of ${kw} works seamlessly, generating predictable results without firefighting. The bridge between where you are today and that outcome is not working harder—it is implementing the right operational framework.`,
      transition: (t, a, kw) => `Here is our detailed walkthrough of how that transformation works in practice.`,
    },
    {
      formula: 'The Framework / Blueprint Teaser',
      trigger: 'Systematic Certainty',
      why: 'Appeals to analytical evaluators looking for structured methodologies.',
      hook: (t, a, kw) => `Most successful teams do not execute ${t} through sheer guesswork—they follow a repeatable 4-step framework.`,
      body: (t, a, kw) => `When you break down ${kw} into systematic stages, the complexity disappears. Instead of reinventing the wheel on every cycle, you gain a structured engine designed for continuous compounding.`,
      transition: (t, a, kw) => `Let's walk through each stage of the framework and how to deploy it in your workflow.`,
    },
    {
      formula: 'The Cautionary Mistake Hook',
      trigger: 'Risk Mitigation & Due Diligence',
      why: 'Captures consideration-stage readers seeking to de-risk their strategic decisions.',
      hook: (t, a, kw) => `Before you commit budget or resources to ${t}, there are three fatal traps you must actively avoid.`,
      body: (t, a, kw) => `Over 80% of evaluating teams trip over the exact same hidden pitfalls when scaling ${kw}. Identifying these traps early is the difference between an expensive setback and a runaway success.`,
      transition: (t, a, kw) => `Here is what to look out for and how to steer clear from day one.`,
    },
    {
      formula: 'The Solution Comparison Matrix',
      trigger: 'Comparative Objectivity',
      why: 'Provides immediate value to buyers actively weighing competing alternatives.',
      hook: (t, a, kw) => `Choosing the right way to tackle ${t} comes down to one question: are you building for quick wins or durable scale?`,
      body: (t, a, kw) => `Every tool, architecture, and vendor in the ${kw} space makes bold promises, but their trade-offs only become obvious once you are deep in production. You need an honest, side-by-side assessment of what actually works.`,
      transition: (t, a, kw) => `Here is our comprehensive comparison to help you evaluate your top contenders.`,
    },
    {
      formula: 'The Efficiency & Velocity Test',
      trigger: 'Time Savings & Operational Leverage',
      why: 'Focuses on operational leverage and eliminating wasted hours.',
      hook: (t, a, kw) => `How many hours is your team currently burning each week trying to manage ${t}?`,
      body: (t, a, kw) => `If you are like most ${a}, the answer is far too many. Modern workflows around ${kw} should accelerate your velocity, not bog you down in endless administrative friction.`,
      transition: (t, a, kw) => `Let's examine how top teams cut execution time by 60% with modern tooling.`,
    },
  ],
  bofu: [
    {
      formula: 'The Direct ROI & Bottom-Line Hook',
      trigger: 'Executive Certainty & High Conviction',
      why: 'Speaks directly to the decision-maker who has zero patience for fluff and wants hard evaluation criteria.',
      hook: (t, a, kw) => `If you are evaluating how to implement ${t} this quarter, you need clear ROI figures—not marketing fluff.`,
      body: (t, a, kw) => `When budget, executive buy-in, and measurable revenue are on the line, every decision around ${kw} carries real weight. You need to know what delivers immediate payback, where hidden bottlenecks lurk, and which partner or tooling aligns with your specific goals.`,
      transition: (t, a, kw) => `Here is the comprehensive breakdown to help you make an executive-ready decision today.`,
    },
    {
      formula: 'The Cut-The-Fluff Action Hook',
      trigger: 'Action-Oriented Urgency',
      why: 'Directly validates that the reader is ready to build or buy, cutting straight to action.',
      hook: (t, a, kw) => `You have done the preliminary research on ${t}, and now it is time to execute.`,
      body: (t, a, kw) => `The problem is that most implementation plans overcomplicate the rollout and stall before launch. To get maximum velocity from ${kw}, you only need to focus on the top 20% of actions that drive 80% of the commercial results.`,
      transition: (t, a, kw) => `Let's jump straight into the exact step-by-step checklist to launch without friction.`,
    },
    {
      formula: 'The Proof-Driven Winner Verdict',
      trigger: 'Authoritative Proof & Verification',
      why: 'Gives bottom-of-funnel buyers the third-party validation they need to finalize their choice.',
      hook: (t, a, kw) => `After testing the leading approaches to ${t} in production environments, the verdict is clear.`,
      body: (t, a, kw) => `Marketing claims only take you so far; real performance with ${kw} comes down to uptime, unit economics, and time-to-value. When the benchmarks were tallied, one specific strategy stood head and shoulders above the rest.`,
      transition: (t, a, kw) => `Here are the unfiltered results, benchmark data, and our direct recommendation.`,
    },
    {
      formula: 'The Strategic Buyer Checklist',
      trigger: 'Protective Due Diligence',
      why: 'Empowers decision-makers with a tangible rubric to justify their selection to stakeholders.',
      hook: (t, a, kw) => `Before signing an agreement or finalizing your tech stack for ${t}, run your candidate through this 5-point audit.`,
      body: (t, a, kw) => `A mistake in choosing your ${kw} solution can lock your team into technical debt and runaway licensing costs for years. Asking the right hard questions upfront saves thousands in future migrations.`,
      transition: (t, a, kw) => `Here are the non-negotiable criteria every serious buyer must demand.`,
    },
    {
      formula: 'The Implementation Fast-Track',
      trigger: 'Speed-to-Value & Onboarding',
      why: 'Appeals to high-intent leads who want results fast and fear protracted rollouts.',
      hook: (t, a, kw) => `You do not need six months and a massive consulting engagement to deploy ${t} successfully.`,
      body: (t, a, kw) => `With modern architectures and agile frameworks, savvy teams are going from zero to production-grade ${kw} in under fourteen days. The key is eliminating redundant onboarding hurdles and following a validated blueprint.`,
      transition: (t, a, kw) => `Here is the 14-day implementation timeline to get live with maximum velocity.`,
    },
    {
      formula: 'The Bottom-Line Decision Framework',
      trigger: 'Fiscal Responsibility & Payback',
      why: 'Provides bulletproof financial rationale for budget approval.',
      hook: (t, a, kw) => `At the end of the day, your choice for ${t} comes down to two numbers: total cost of ownership and expected pipeline yield.`,
      body: (t, a, kw) => `If the mathematics of your ${kw} investment do not clearly pencil out to at least a 3x return within 90 days, you are using the wrong model. Let's look at the financial realities behind each option.`,
      transition: (t, a, kw) => `Here is the financial scorecard and payback calculation to present to your CFO.`,
    },
  ],
}

/**
 * Helper to build an intro from fallback templates
 */
function getFallbackIntroForStage(stage, index, topic, audience = 'readers', targetKeywords = []) {
  const kw = targetKeywords.length ? targetKeywords[0] : topic
  const templates = FALLBACK_TEMPLATES[stage] || FALLBACK_TEMPLATES.tofu
  const tmpl = templates[index % templates.length]
  const stageInfo = FUNNEL_STAGES[stage] || FUNNEL_STAGES.tofu

  const hookLine = tmpl.hook(topic, audience, kw)
  const body = tmpl.body(topic, audience, kw)
  const transition = tmpl.transition(topic, audience, kw)
  const fullIntro = `${hookLine}\n\n${body}\n\n${transition}`

  const wordCount = fullIntro.split(/\s+/).filter(Boolean).length
  const readingTimeSeconds = Math.max(Math.round(wordCount / 3.5), 10)

  return {
    id: `intro-${stage}-${index + 1}`,
    funnelStage: stage,
    funnelLabel: stageInfo.label,
    hookFormula: tmpl.formula,
    hookLine,
    body,
    transition,
    fullIntro,
    wordCount,
    readingTimeSeconds,
    emotionalTrigger: tmpl.trigger,
    whyItWorks: tmpl.why,
  }
}

/**
 * Generate fallback introductions ensuring exact count and stage distribution
 */
function getFallbackIntroductions(topic, audience = 'readers', targetKeywords = [], count = 6, funnelStage = 'all') {
  const intros = []
  if (funnelStage === 'all') {
    const basePerStage = Math.floor(count / 3)
    const remainder = count % 3
    const targetCounts = {
      tofu: basePerStage + (remainder > 0 ? 1 : 0),
      mofu: basePerStage + (remainder > 1 ? 1 : 0),
      bofu: basePerStage,
    }

    for (const stage of ['tofu', 'mofu', 'bofu']) {
      for (let i = 0; i < targetCounts[stage]; i++) {
        intros.push(getFallbackIntroForStage(stage, i, topic, audience, targetKeywords))
      }
    }
  } else {
    for (let i = 0; i < count; i++) {
      intros.push(getFallbackIntroForStage(funnelStage, i, topic, audience, targetKeywords))
    }
  }
  return intros
}

/**
 * Helper to derive default target audiences when not specified by user
 */
function getDefaultAudiencesForTopic(topic = '', userAudience = '') {
  if (userAudience) {
    const split = userAudience.split(/[,&|/]+/).map((s) => s.trim()).filter(Boolean)
    if (split.length > 1) return split
  }

  const lower = topic.toLowerCase()
  if (lower.includes('seo') || lower.includes('traffic') || lower.includes('ranking') || lower.includes('google')) {
    return ['SEO Specialists', 'Content Strategists', 'Growth Marketers', 'Website Owners', 'B2B Marketing Directors']
  }
  if (lower.includes('saas') || lower.includes('b2b') || lower.includes('startup') || lower.includes('enterprise')) {
    return ['SaaS Founders', 'VP of Marketing', 'Demand Gen Leads', 'Product Marketing Managers', 'Growth Engineers']
  }
  if (lower.includes('tech') || lower.includes('code') || lower.includes('developer') || lower.includes('api') || lower.includes('software')) {
    return ['Software Engineers', 'Technical Founders', 'Engineering Leads', 'DevOps Practitioners', 'Product Developers']
  }
  if (lower.includes('finance') || lower.includes('invest') || lower.includes('money') || lower.includes('roi') || lower.includes('crypto')) {
    return ['Finance Directors', 'Business Owners', 'CFOs & Controllers', 'Investment Analysts', 'Individual Investors']
  }
  if (lower.includes('health') || lower.includes('wellness') || lower.includes('fitness') || lower.includes('medical')) {
    return ['Healthcare Practitioners', 'Wellness Coaches', 'Clinic Directors', 'Health-Conscious Professionals']
  }
  if (lower.includes('ecommerce') || lower.includes('retail') || lower.includes('store') || lower.includes('shop')) {
    return ['E-commerce Brand Owners', 'DTC Growth Managers', 'Shopify Merchants', 'Digital Merchandisers']
  }
  return [
    'Industry Practitioners',
    'Marketing & Growth Leads',
    'Founders & Executives',
    'Content & Creative Teams',
    'Strategic Decision-Makers',
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
  preferredProvider = 'groq',
}) {
  const activeTone = (tone || 'conversational').toLowerCase().trim()
  const toneProfile = TONE_PROFILES[activeTone] || TONE_PROFILES.conversational

  const cacheKey = apiResultCache.hashKey('blog-intros', {
    topic,
    targetKeywords,
    targetAudience,
    funnelStage,
    tone: activeTone,
    count,
    preferredProvider,
  })
  const cached = apiResultCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const userAudience = (targetAudience || '').trim()
  const effectiveAudience = userAudience || 'relevant industry readers, buyers, and practitioners'
  const parsedKeywords = Array.isArray(targetKeywords)
    ? targetKeywords.filter(Boolean)
    : typeof targetKeywords === 'string'
      ? targetKeywords.split(',').map((k) => k.trim()).filter(Boolean)
      : []
  const keywordsList = parsedKeywords.join(', ')

  const requestedCount = Math.min(Math.max(parseInt(count) || 6, 3), 18)

  let stageGuidance = ''
  let targetCounts = { tofu: 0, mofu: 0, bofu: 0 }

  if (funnelStage === 'tofu') {
    targetCounts.tofu = requestedCount
    stageGuidance = `All ${requestedCount} intros must be TOFU (Top of Funnel - Awareness).
Formulas to use: Contrarian Myth-Buster, Startling Statistic, Relatable Story, Empathetic Pain-Point, "What Everyone Gets Wrong" Angle, Industry Shift Awakening.`
  } else if (funnelStage === 'mofu') {
    targetCounts.mofu = requestedCount
    stageGuidance = `All ${requestedCount} intros must be MOFU (Middle of Funnel - Consideration).
Formulas to use: Problem-Agitate-Solve (PAS), Before-After-Bridge (BAB), Framework Teaser, Cautionary Mistake Hook, Solution Comparison Matrix, Efficiency Test.`
  } else if (funnelStage === 'bofu') {
    targetCounts.bofu = requestedCount
    stageGuidance = `All ${requestedCount} intros must be BOFU (Bottom of Funnel - Decision & Conversion).
Formulas to use: Direct ROI & Payback Hook, Cut-The-Fluff Action Hook, Proof-Driven Winner Verdict, Strategic Buyer Checklist, Implementation Fast-Track, Decision Framework.`
  } else {
    const basePerStage = Math.floor(requestedCount / 3)
    const remainder = requestedCount % 3
    targetCounts.tofu = basePerStage + (remainder > 0 ? 1 : 0)
    targetCounts.mofu = basePerStage + (remainder > 1 ? 1 : 0)
    targetCounts.bofu = basePerStage

    stageGuidance = `MANDATORY STAGE DISTRIBUTION:
You MUST generate intros across all 3 funnel stages in this exact count:
- Exactly ${targetCounts.tofu} items with "stage": "tofu"
- Exactly ${targetCounts.mofu} items with "stage": "mofu"
- Exactly ${targetCounts.bofu} items with "stage": "bofu"
Total must be exactly ${requestedCount} items.`
  }

  const qaDirectives = buildMissiveQaPromptDirectives()

  const systemPrompt = `You are Missive Digital's elite conversion copywriter.
Generate high-retention, scroll-stopping blog post introductions engineered to slash bounce rates and maximize time-on-page.

CRITICAL MISSIVE QA DIRECTIVES (APPLIED TO EVERY PIECE OF GENERATED TEXT):
${qaDirectives}

COPYWRITING RULES:
1. First Sentence Hook: Must be an arresting pattern-interrupt. Zero preamble or meta-commentary.
2. Tone & Voice Mandate (${toneProfile.label}): ${toneProfile.directive} Every hook, body sentence, and bridge line must strictly embody this tone.
3. Body: Exactly 2 tight sentences building the tension or stakes in this voice.
4. Bridge Line: Exactly 1 smooth transition sentence pulling the reader directly into the article.
5. Target Audiences: Accurately identify 4-5 key audience segments / personas for this topic.
6. Return strictly valid JSON only.`

  const userPrompt = `Generate exactly ${requestedCount} blog post introductions for:
TOPIC: "${topic}"
KEYWORDS: "${keywordsList || topic}"
AUDIENCE: "${userAudience ? userAudience : 'Identify the top 4-5 relevant target audience segments for this topic'}"
TONE OF VOICE: "${toneProfile.label}" — ${toneProfile.directive}

DISTRIBUTION REQUIREMENTS:
${stageGuidance}

OUTPUT FORMAT (strictly JSON):
{
  "targetAudiences": [
    "Target Audience Segment 1",
    "Target Audience Segment 2",
    "Target Audience Segment 3",
    "Target Audience Segment 4"
  ],
  "recommendedHook": "1 crisp sentence advising which hook to test first for this topic",
  "intros": [
    {
      "stage": "tofu",
      "formula": "The Contrarian Myth-Buster",
      "hook": "Single punchy sentence opening hook.",
      "body": "2 sentences agitating the core challenge.",
      "transition": "1 sentence bridging into the post.",
      "trigger": "Curiosity & Pattern-Interrupt",
      "why": "Why this psychological angle hooks the audience."
    }
  ]
}`

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    // Optimized token budget for fast response without truncation
    const tokenBudget = Math.max(requestedCount * 280, 2500)

    const result = await callAIAndParseJSON(messages, {
      preferredProvider: preferredProvider || 'groq',
      temperature: 0.65,
      maxTokens: tokenBudget,
      timeout: 14000,
    })

    const rawList = Array.isArray(result?.intros)
      ? result.intros
      : Array.isArray(result?.introductions)
        ? result.introductions
        : []

    // Extract target audiences list
    let targetAudiencesList = []
    if (Array.isArray(result?.targetAudiences) && result.targetAudiences.length > 0) {
      targetAudiencesList = result.targetAudiences.map((a) => String(a).trim()).filter(Boolean)
    } else if (Array.isArray(result?.summary?.targetAudiences) && result.summary.targetAudiences.length > 0) {
      targetAudiencesList = result.summary.targetAudiences.map((a) => String(a).trim()).filter(Boolean)
    }

    if (!targetAudiencesList.length) {
      targetAudiencesList = getDefaultAudiencesForTopic(topic, userAudience)
    }

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

      let finalIntros = []

      if (funnelStage === 'all') {
        // Group existing AI intros by stage
        const stageBuckets = { tofu: [], mofu: [], bofu: [] }
        sanitizedIntros.forEach((item) => {
          if (stageBuckets[item.funnelStage]) {
            stageBuckets[item.funnelStage].push(item)
          } else {
            stageBuckets.tofu.push(item)
          }
        })

        // Ensure each stage meets its exact target quota without any missing stage
        for (const stage of ['tofu', 'mofu', 'bofu']) {
          const target = targetCounts[stage]
          while (stageBuckets[stage].length < target) {
            const idx = stageBuckets[stage].length
            const fallbackItem = getFallbackIntroForStage(stage, idx, topic, effectiveAudience, parsedKeywords)
            stageBuckets[stage].push(fallbackItem)
          }
          finalIntros.push(...stageBuckets[stage].slice(0, target))
        }
      } else {
        const filtered = sanitizedIntros.filter((i) => i.funnelStage === funnelStage)
        const currentList = filtered.length ? filtered : sanitizedIntros.map((i) => ({ ...i, funnelStage }))
        while (currentList.length < requestedCount) {
          const idx = currentList.length
          const fallbackItem = getFallbackIntroForStage(funnelStage, idx, topic, effectiveAudience, parsedKeywords)
          currentList.push(fallbackItem)
        }
        finalIntros = currentList.slice(0, requestedCount)
      }

      // Calculate actual breakdown
      const counts = { tofu: 0, mofu: 0, bofu: 0 }
      finalIntros.forEach((item) => {
        if (counts[item.funnelStage] !== undefined) {
          counts[item.funnelStage]++
        }
      })

      const output = {
        summary: {
          topic,
          totalGenerated: finalIntros.length,
          funnelBreakdown: counts,
          targetAudience: userAudience,
          targetAudiences: targetAudiencesList,
          tone,
          recommendedHook:
            result?.recommendedHook ||
            result?.summary?.recommendedHook ||
            'Test the TOFU Contrarian hook for organic search, and MOFU/BOFU hooks for email newsletters and LinkedIn promos.',
        },
        targetAudiences: targetAudiencesList,
        introductions: finalIntros,
        generatedAt: new Date().toISOString(),
      }

      apiResultCache.set(cacheKey, output, 10 * 60 * 1000)
      return output
    }

    throw new Error('AI returned empty introductions list')
  } catch (err) {
    console.warn(
      `[BlogIntroGenerator] AI call failed or returned incomplete response (${err.message}). Generating complete variations.`
    )

    const fallbackIntros = getFallbackIntroductions(topic, effectiveAudience, parsedKeywords, requestedCount, funnelStage)
    const targetAudiencesList = getDefaultAudiencesForTopic(topic, userAudience)

    const counts = { tofu: 0, mofu: 0, bofu: 0 }
    fallbackIntros.forEach((item) => {
      if (counts[item.funnelStage] !== undefined) {
        counts[item.funnelStage]++
      }
    })

    return {
      summary: {
        topic,
        totalGenerated: fallbackIntros.length,
        funnelBreakdown: counts,
        targetAudience: userAudience,
        targetAudiences: targetAudiencesList,
        tone,
        recommendedHook:
          'Test the TOFU Contrarian hook for organic traffic, and MOFU PAS hook for newsletter campaigns.',
      },
      targetAudiences: targetAudiencesList,
      introductions: fallbackIntros,
      generatedAt: new Date().toISOString(),
      isFallback: true,
    }
  }
}

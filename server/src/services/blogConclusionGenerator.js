import { callAIAndParseJSON } from '../utils/aiProvider.js'

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

export const CTA_GOALS = {
  demo: { label: 'Book a Demo / Strategy Call', defaultButton: 'Book Your Free 30-Min Strategy Call →' },
  trial: { label: 'Start Free Trial / Sign Up', defaultButton: 'Start Your 14-Day Free Trial (No CC Required) →' },
  lead_magnet: { label: 'Download Checklist / Template / Guide', defaultButton: 'Download the Complete Implementation Checklist →' },
  internal_link: { label: 'Read Next Related Article', defaultButton: 'Read Next: The Advanced Implementation Guide →' },
  comment: { label: 'Leave a Comment / Join Community Discussion', defaultButton: 'Drop Your Thoughts in the Comments Below ↓' },
  custom: { label: 'Custom Call to Action', defaultButton: 'Take the Next Step Today →' },
}

/**
 * Fallback conclusions for guaranteed uptime
 */
function getFallbackConclusions(
  topic,
  intro = '',
  audience = 'professionals',
  targetKeywords = [],
  count = 6,
  stagePlan = ['tofu', 'tofu', 'mofu', 'mofu', 'bofu', 'bofu'],
  defaultCtaBtn = 'Get Started Today →'
) {
  const kw = targetKeywords.length ? targetKeywords[0] : topic
  const hasIntro = Boolean(intro && intro.trim().length > 15)

  const stageTemplates = {
    tofu: [
      {
        title: `The Verdict: Turning ${topic} Into Your Lasting Competitive Advantage`,
        framework: 'The Perspective Shift & Open Loop Closer',
        hookClosure: hasIntro
          ? `Remember the question we started with? Mastering ${topic} isn't about chasing every new tactic—it is about mastering the underlying fundamentals.`
          : `Mastering ${topic} isn't about chasing every new tactic—it is about mastering the core fundamentals that compound over time.`,
        body: `Throughout this guide, we explored how top-performing ${audience} build sustainable traction with ${kw}. By shifting your focus from short-term reactive fixes to deliberate, repeatable systems, you eliminate wasted effort and unlock compounding results.\n\nThe difference between teams that struggle and those that dominate isn't resources; it's consistency in execution.`,
        ctaPrompt: `Where will your team focus your efforts first? Choose one high-impact principle from this article and put it into practice this week.`,
        ctaButton: 'Explore More Growth Insights →',
        why: 'Synthesizes high-level value into an inspiring takeaway while strictly avoiding generic conclusion clichés.',
      },
      {
        title: `Where Does Your Strategy Go From Here? Beyond ${topic}`,
        framework: 'The Big-Picture Horizon & Low-Friction Step',
        hookClosure: hasIntro
          ? `The friction we highlighted in the opening isn't unique to your team—it's the natural inflection point every growing organization encounters.`
          : `Growth rarely comes from working harder at outdated playbooks. It comes from recognizing when the rules of ${kw} have changed.`,
        body: `As search algorithms and customer expectations evolve, having a clear mental model around ${topic} separates industry leaders from those playing catch-up.\n\nTake a step back, audit your baseline, and commit to one systemic upgrade this quarter.`,
        ctaPrompt: `Join our community of forward-thinking ${audience} receiving our weekly strategic breakdown.`,
        ctaButton: 'Subscribe to Weekly Strategy Memo →',
        why: 'Opens a forward-looking horizon and invites low-friction ongoing engagement.',
      },
      {
        title: `The Unspoken Reality of ${topic} in Today's Market`,
        framework: 'The Contrarian Challenge & Next Thought',
        hookClosure: `The conventional playbook for ${kw} is broken, but that creates an unprecedented window of opportunity for teams willing to adapt.`,
        body: `Most competitors will continue relying on superficial shortcuts. By investing in depth, authoritative execution, and customer-first value, your brand creates an unassailable moat.\n\nTrue market leadership belongs to those who build before the trend becomes mandatory.`,
        ctaPrompt: `Read our companion deep-dive on advanced content architecture next.`,
        ctaButton: 'Read Next: Advanced Architecture Guide →',
        why: 'Uses pattern-interrupt psychology to challenge standard industry assumptions.',
      },
    ],
    mofu: [
      {
        title: `Your Implementation Blueprint: Putting ${topic} to Work`,
        framework: 'The Execution Blueprint & Resource Download',
        hookClosure: `The concepts we broke down aren't theoretical—they represent the exact playbook needed to execute ${kw} with confidence.`,
        body: `As you evaluate your next steps, remember that speed of implementation matters just as much as strategy. The teams seeing 3x improvements are those that audit their current bottlenecks, align their tools, and measure iterative benchmarks.\n\nDon't let analysis paralysis stall your momentum. Start with a structured audit of your highest-priority workflow before scaling across the organization.`,
        ctaPrompt: `To make execution effortless, download our step-by-step checklist containing all frameworks, formulas, and benchmarks covered in this guide.`,
        ctaButton: 'Download the Complete Implementation Checklist →',
        why: 'Provides a clear transition from understanding to execution, creating high desire for an actionable download.',
      },
      {
        title: `The 3-Part Decision Framework for Scaling ${topic}`,
        framework: 'The Comparison Verdict & Practical Roadmap',
        hookClosure: `Choosing how to execute ${kw} comes down to balancing internal bandwidth against time-to-value.`,
        body: `You don't need to overhaul everything overnight. Prioritize your roadmap into quick wins (Week 1–2), architectural stabilization (Month 1), and automated scale (Month 2+).\n\nMeasuring the right leading indicators keeps your stakeholders aligned and guarantees positive compounding.`,
        ctaPrompt: `Use our free Decision Matrix template to score your team's readiness across each stage.`,
        ctaButton: 'Get the Free Decision Matrix Template →',
        why: 'Helps consideration-stage buyers evaluate trade-offs and structure their rollout plan.',
      },
      {
        title: `The Most Expensive Trap in ${topic} (And How to Avoid It)`,
        framework: 'The Common Pitfall Warning & Action Step',
        hookClosure: `The biggest risk isn't trying something new with ${kw}—it is repeating invisible mistakes that silently drain budget.`,
        body: `Too many teams invest months into execution only to realize their foundation lacked indexation guards or semantic cohesion. By benchmarking your process against industry standards early, you bypass costly course corrections.\n\nProtect your investment with verified guardrails.`,
        ctaPrompt: `Download our pre-flight QA checklist to verify your setup before going live.`,
        ctaButton: 'Download the Pre-Flight QA Checklist →',
        why: 'Capitalizes on loss-aversion by highlighting preventable mistakes.',
      },
    ],
    bofu: [
      {
        title: `The Bottom Line: Don't Let Inaction Delay Your ${topic} Results`,
        framework: 'The Definitive ROI Verdict & Free Trial',
        hookClosure: `Every month your team delays modernizing your approach to ${topic}, the compounding cost of inaction quietly increases.`,
        body: `You now have the exact methodology required to eliminate operational drag, outpace competitors, and unlock measurable ROI from ${kw}. The only remaining decision is whether to spend months piecing together disjointed manual processes or leverage proven infrastructure from day one.\n\nTop performers choose momentum. With the right platform supporting your workflow, you can begin seeing validated impact in as little as 14 days.`,
        ctaPrompt: `Ready to see how much faster your team can execute? Test drive our platform today and unlock full access with zero commitments.`,
        ctaButton: defaultCtaBtn || 'Start Your 14-Day Free Trial (No CC Required) →',
        why: 'Builds sharp urgency around the cost of delay and positions the CTA as the logical, frictionless next step.',
      },
      {
        title: `The Cost of Inaction: Why Now Is the Time to Modernize ${topic}`,
        framework: 'The Cost of Inaction & Demo Booking',
        hookClosure: `While competitors scramble to respond to shifting market dynamics, you have a direct path to capture disproportionate share.`,
        body: `Manual execution does not scale. To achieve predictable pipeline growth without inflating headcount, high-growth teams invest in purpose-built tooling designed specifically for ${kw}.\n\nThe ROI is quantifiable, and the implementation curve is measured in days, not quarters.`,
        ctaPrompt: `Book a 1-on-1 strategy session with our senior engineers to map out your tailored solution.`,
        ctaButton: 'Book Your Custom Strategy Call →',
        why: 'Directly addresses executive decision-makers with bottom-line economic arguments.',
      },
      {
        title: `Your Next Move: Accelerate Your ${topic} Results Today`,
        framework: 'The Fast-Track Implementation Pitch',
        hookClosure: `The roadmap is clear, the benchmarks are proven, and the infrastructure is ready when you are.`,
        body: `Stop letting operational bottlenecks dictate your team's growth ceiling. Join hundreds of industry leaders who have streamlined ${kw} into an automated competitive advantage.\n\nStart small, validate fast, and scale with total confidence.`,
        ctaPrompt: `Get started in under two minutes with full access to all enterprise features.`,
        ctaButton: 'Claim Your Free Account & Launch →',
        why: 'Focuses on immediate speed-to-value and eliminates friction for direct conversions.',
      },
    ],
  }

  const stageCounters = { tofu: 0, mofu: 0, bofu: 0 }

  return stagePlan.slice(0, count).map((stageKey, idx) => {
    const list = stageTemplates[stageKey] || stageTemplates.tofu
    const templateIndex = stageCounters[stageKey] % list.length
    stageCounters[stageKey]++
    const tmpl = list[templateIndex]

    const fullMarkdown = `## ${tmpl.title}\n\n${tmpl.hookClosure ? `${tmpl.hookClosure}\n\n` : ''}${tmpl.body}\n\n**Next Action:** ${tmpl.ctaPrompt}\n\n[${tmpl.ctaButton}]`
    const words = fullMarkdown.split(/\s+/).filter(Boolean).length

    return {
      id: `conclusion-fallback-${idx + 1}`,
      specificH2Title: tmpl.title,
      funnelStage: stageKey,
      funnelLabel: CONCLUSION_FUNNEL_STAGES[stageKey]?.label || stageKey.toUpperCase(),
      framework: tmpl.framework,
      hookClosure: tmpl.hookClosure,
      body: tmpl.body,
      ctaPrompt: tmpl.ctaPrompt,
      ctaButtonText: tmpl.ctaButton,
      fullConclusion: fullMarkdown,
      wordCount: words,
      readingTimeSeconds: Math.ceil(words / 3.5),
      whyItWorks: tmpl.why,
    }
  })
}

/**
 * Main Blog Conclusion Generator
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
  preferredProvider = 'gemini-3.5-flash-lite',
}) {
  if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
    throw new Error('A valid blog topic or title is required (minimum 3 characters).')
  }

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

  const systemPrompt = `You are Missive Digital's Principal Content Strategist and Conversion Copywriter.
Your task is to generate exactly ${count} distinct, high-converting, search-optimized blog article conclusions.

CRITICAL RULES (NON-NEGOTIABLE):
1. **NEVER USE THE WORD "CONCLUSION" OR "FINAL THOUGHTS" OR "SUMMARY" OR "WRAPPING UP"**:
   - The H2 title must be a SPECIFIC, creative, punchy headline that hooks the reader and conveys momentum.
   - Examples of BAD titles: "Conclusion", "Final Words", "In Summary", "Wrapping Up".
   - Examples of GOOD titles: "The Final Verdict: How to Scale Without the Burnout", "Where Does Your Traffic Strategy Go From Here?", "The Bottom Line on Modern Programmatic SEO", "Your Next Step Towards High-Converting Funnels".
2. **INTRO LOOP CLOSURE**:
   ${cleanIntro ? '- You MUST examine the provided Blog Introduction. Deliberately close the open loop, answer the core question, or resolve the tension established in that opening.' : '- Establish a satisfying closure to the core challenge posed by the article title.'}
3. **NO FLUFF OR BORING SUMMARIES**:
   - Do not simply list bullet points. Synthesize the big-picture insight into an authoritative, actionable ending.
4. **HIGH-CONVERTING CTA INTEGRATION**:
   - Seamlessly transition from the takeaway into the desired Call to Action (${ctaInfo.label}).

RETURN JSON STRICTLY IN THIS FORMAT (NO PREAMBLE, NO CODEBLOCKS):
{
  "conclusions": [
    {
      "id": "conclusion-1",
      "specificH2Title": "The Specific Creative H2 Headline (NO Conclusion Word)",
      "funnelStage": "tofu",
      "funnelLabel": "TOFU (Awareness)",
      "framework": "The Perspective Shift & Open Loop Closer",
      "hookClosure": "1-2 punchy sentences resolving the open loop from the intro.",
      "body": "2 short, impactful paragraphs synthesizing value and momentum.",
      "ctaPrompt": "1-2 sentences persuasively framing the next action.",
      "ctaButtonText": "Action-oriented button text (e.g. Download the Audit Checklist →)",
      "fullConclusion": "Full Markdown with ## [specificH2Title], body paragraphs, and bold CTA.",
      "wordCount": 120,
      "readingTimeSeconds": 32,
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
- Desired Tone: ${tone}

VARIATIONS TO GENERATE:
Generate an array of exactly ${count} items corresponding to these funnel stages:
${stagePlan.map((s, idx) => `Variation ${idx + 1}: ${CONCLUSION_FUNNEL_STAGES[s].label} - Stage Intent: ${CONCLUSION_FUNNEL_STAGES[s].intent}`).join('\n')}`

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    const result = await callAIAndParseJSON(messages, {
      preferredProvider: preferredProvider || 'gemini-3.5-flash-lite',
      temperature: 0.72,
      maxTokens: Math.max(count * 450, 3200),
      timeout: 16000,
    })

    if (result && Array.isArray(result.conclusions) && result.conclusions.length > 0) {
      // Clean and sanitize results
      const sanitized = result.conclusions.slice(0, count).map((item, index) => {
        const stageKey = stagePlan[index] || item.funnelStage || 'tofu'
        const stageMeta = CONCLUSION_FUNNEL_STAGES[stageKey] || CONCLUSION_FUNNEL_STAGES.tofu

        // Guarantee specific H2 title does not have generic "Conclusion"
        let cleanH2 = (item.specificH2Title || '').trim()
        cleanH2 = cleanH2.replace(/^#+\s*/, '')
        if (!cleanH2 || /^(conclusion|final thoughts|in conclusion|summary|wrapping up)/i.test(cleanH2)) {
          cleanH2 = `The Next Step: Putting ${cleanTopic} Into Action`
        }

        const body = (item.body || '').trim()
        const hookClosure = (item.hookClosure || '').trim()
        const ctaPrompt = (item.ctaPrompt || '').trim()
        const ctaButtonText = (item.ctaButtonText || defaultCtaBtn).trim()

        const fullMarkdown =
          item.fullConclusion && !item.fullConclusion.toLowerCase().includes('## conclusion')
            ? item.fullConclusion.trim()
            : `## ${cleanH2}\n\n${hookClosure ? `${hookClosure}\n\n` : ''}${body}\n\n**Next Step:** ${ctaPrompt}\n\n[${ctaButtonText}]`

        const words = fullMarkdown.split(/\s+/).filter(Boolean).length

        return {
          id: item.id || `conclusion-${index + 1}`,
          specificH2Title: cleanH2,
          funnelStage: stageKey,
          funnelLabel: stageMeta.label,
          framework: item.framework || stageMeta.frameworks[index % stageMeta.frameworks.length],
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

      // Top up to exact count if AI returned fewer items
      if (sanitized.length < count) {
        const fallbacks = getFallbackConclusions(
          cleanTopic,
          cleanIntro,
          audience,
          targetKeywords,
          count,
          stagePlan,
          defaultCtaBtn
        )
        const existingTitles = new Set(sanitized.map((s) => s.specificH2Title.toLowerCase()))
        for (const fb of fallbacks) {
          if (sanitized.length >= count) break
          if (!existingTitles.has(fb.specificH2Title.toLowerCase())) {
            sanitized.push({
              ...fb,
              id: `conclusion-${sanitized.length + 1}`,
            })
            existingTitles.add(fb.specificH2Title.toLowerCase())
          }
        }
      }

      return {
        success: true,
        topic: cleanTopic,
        funnelFilter: funnelStage,
        totalGenerated: sanitized.length,
        conclusions: sanitized,
      }
    }

    throw new Error('AI returned an unexpected response structure')
  } catch (err) {
    console.warn('[BlogConclusionGenerator] Primary AI failed, falling back to heuristic engine:', err.message)
    const fallbacks = getFallbackConclusions(
      cleanTopic,
      cleanIntro,
      audience,
      targetKeywords,
      count,
      stagePlan,
      defaultCtaBtn
    )
    return {
      success: true,
      topic: cleanTopic,
      funnelFilter: funnelStage,
      totalGenerated: fallbacks.length,
      conclusions: fallbacks,
      isFallback: true,
    }
  }
}

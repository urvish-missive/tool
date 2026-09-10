import { callAIAndParseJSON, apiResultCache } from '../utils/aiProvider.js'
import { TONE_PROFILES } from './blogTopicGenerator.js'
import { buildMissiveQaPromptDirectives, auditCaseStudyMissiveQa } from '../utils/missiveQaRules.js'

/**
 * Strips all forbidden em dashes ("—" or " -- ") and replaces them with clean standard punctuation
 * to enforce strict Missive QA compliance across every piece of generated text.
 */
function sanitizeEmDashes(text) {
  if (typeof text !== 'string') return text
  const lines = text.split('\n')
  const sanitizedLines = lines.map((line) => {
    const trimmed = line.trim()
    // Preserve markdown table separator lines like | :--- | :--- |
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && /\|[\s\-:]+\|/.test(trimmed)) {
      return line.replace(/—/g, ' - ')
    }
    // Replace em dashes, en dashes, and double/triple hyphens in prose with clean ' - '
    return line
      .replace(/—/g, ' - ')
      .replace(/–/g, ' - ')
      .replace(/\s*--+\s*/g, ' - ')
      .replace(/\s\s+/g, ' ')
  })
  return sanitizedLines.join('\n')
}


/**
 * Deeply sanitizes any object or array recursively to purge all em dashes
 */
function deepSanitize(obj) {
  if (typeof obj === 'string') {
    return sanitizeEmDashes(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize)
  }
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(obj)) {
      out[k] = deepSanitize(v)
    }
    return out
  }
  return obj
}

/**
 * High-quality procedural fallback generator when AI calls are offline or timeout
 */
function generateFallbackCaseStudy({
  clientName = 'Client Partner',
  niche = 'B2B Technology',
  challenge = 'Plateaued growth and complex customer adoption',
  solution = 'Strategic overhaul and automated workflow acceleration',
  metrics = '3.8x ROI, 45% reduction in cycle time',
  targetAudience = 'Growth Leaders & Decision Makers',
  tone = 'authoritative',
}) {
  const brand = clientName || 'Enterprise Partner'
  const toneLabel = TONE_PROFILES[tone]?.label || 'Authoritative & Strategic'
  const primaryMetric = metrics.split(',')[0] || '3.8x ROI'
  const secondaryMetric = metrics.split(',')[1] || '45% cycle reduction'

  const title = `How ${brand} Unlocked ${primaryMetric} in ${niche}`
  const subtitle = `A strategic blueprint for overcoming ${challenge.slice(0, 60)} with high-velocity execution.`

  const markdownContent = `# Case Study: How ${brand} Achieved Measurable Transformation in ${niche}

**Executive Summary**: Facing severe bottlenecks in ${challenge.toLowerCase()}, ${brand} partnered to re-engineer their core operational and marketing engine. Through targeted implementation, the team achieved ${metrics} within 90 days.

## 1. The Challenge
Before implementing this initiative, ${brand} hit a distinct plateau. Key friction points included:
- **Operational Drag**: ${challenge}
- **Cost of Inaction**: High opportunity cost and diminishing efficiency across internal cycles.
- **Resource Constraints**: Inability to scale output without linearly increasing team overhead.

## 2. The Solution Blueprint
The team deployed a 3-stage strategic overhaul:
1. **Friction Audit & Metric Baselining**: Mapped out every operational constraint and customer touchpoint.
2. **Systemic Implementation**: Re-engineered core workflows using ${solution}.
3. **Continuous Optimization**: Instituted weekly sprint checkpoints and automated performance telemetry.

## 3. Quantifiable Results
- **Primary Metric**: ${primaryMetric}
- **Secondary Impact**: ${secondaryMetric}
- **Operational Scalability**: 100% automated tracking with zero additional headcount required.

> "${brand}'s operational velocity completely transformed after deploying this solution. The results exceeded our initial targets in half the anticipated timeframe."  
> - *VP of Operations, ${brand}*

## 4. Key Strategic Takeaways
- Diagnosing the root operational bottleneck early delivers exponential downstream returns.
- Standardized, repeatable frameworks outperform ad-hoc interventions every time.
- Verifiable metrics provide the ultimate internal buy-in for sustained growth.`

  const sanitizedMarkdown = sanitizeEmDashes(markdownContent)

  const rawResult = {
    caseStudy: {
      title: sanitizeEmDashes(title),
      subtitle: sanitizeEmDashes(subtitle),
      executiveSnapshot: {
        client: brand,
        industry: niche,
        timeframe: '90 Days',
        coreWin: sanitizeEmDashes(metrics),
      },
      theChallenge: {
        context: sanitizeEmDashes(`Prior to the transformation, ${brand} was held back by key operational constraints: ${challenge}.`),
        bottlenecks: [
          sanitizeEmDashes(`Persistent drag caused by ${challenge}.`),
          'Inability to measure conversion drop-offs in real-time.',
          'Underutilized high-intent customer segments.',
        ],
      },
      theSolution: {
        overview: sanitizeEmDashes(`A strategic 3-tier overhaul focused on ${solution}.`),
        implementationSteps: [
          {
            step: 1,
            title: 'Diagnostic Audit & Metric Baselining',
            description: 'Uncovered high-friction drop-offs and aligned key stakeholders on quantitative KPIs.',
          },
          {
            step: 2,
            title: 'Execution & Workflow Deployment',
            description: sanitizeEmDashes(`Deployed ${solution} across core operational surfaces.`),
          },
          {
            step: 3,
            title: 'Optimization & Flywheel Scaling',
            description: 'Established automated alerts, weekly performance reviews, and conversion iteration cycles.',
          },
        ],
      },
      metrics: [
        {
          label: 'Primary Performance Metric',
          value: sanitizeEmDashes(primaryMetric),
          detail: 'Measured against baseline over a 90-day sprint cycle',
          changeType: 'increase',
        },
        {
          label: 'Cycle Time Reduction',
          value: sanitizeEmDashes(secondaryMetric),
          detail: 'Direct improvement in team velocity and customer time-to-value',
          changeType: 'decrease',
        },
        {
          label: 'Payback Velocity',
          value: '< 60 Days',
          detail: 'Complete initial investment recovered within two fiscal months',
          changeType: 'increase',
        },
      ],
      clientQuote: {
        quote: sanitizeEmDashes(`This transformation was pivotal for ${brand}. The clarity, execution velocity, and quantifiable results spoke for themselves.`),
        author: 'Executive Leadership',
        role: 'VP of Strategy & Growth',
        company: brand,
      },
      keyTakeaways: [
        'Diagnosing structural friction points early prevents costly downstream churn.',
        'Systematized frameworks outperform fragmented manual workarounds.',
        'Quantifiable proof points are the foundation of market-leading credibility.',
      ],
      fullMarkdown: sanitizedMarkdown,
    },
    marketingStrategy: {
      blogWeavingStrategy: {
        placementAdvice: sanitizeEmDashes(`Weave this case study into both Top-of-Funnel (educational) and Middle-of-Funnel (comparative) articles in ${niche}. Position it as concrete proof after introducing the core problem.`),
        calloutBoxMarkdown: sanitizeEmDashes(`> **Proven in Practice**: See how ${brand} resolved ${challenge.slice(0, 45)} and achieved ${primaryMetric}. [Read the complete case breakdown →]`),
        contextualAnchorTextIdeas: [
          sanitizeEmDashes(`how ${brand} scaled in ${niche}`),
          sanitizeEmDashes(`real-world ${niche} case study`),
          sanitizeEmDashes(`achieving ${primaryMetric} with ${solution.slice(0, 30)}`),
        ],
      },
      relevantDomainBlogs: [
        {
          title: `Why Most ${niche} Strategies Fail (And What to Do Instead)`,
          targetStage: 'TOFU',
          whyRelevant: sanitizeEmDashes(`Directly references the core friction of ${challenge} and showcases ${brand} as the successful counter-example.`),
          recommendedCalloutPlacement: 'Under the section breaking down common execution mistakes.',
          suggestedAnchor: sanitizeEmDashes(`see how ${brand} overcame this bottleneck`),
        },
        {
          title: `The Ultimate Guide to ${solution.slice(0, 40)} in Modern Businesses`,
          targetStage: 'MOFU',
          whyRelevant: sanitizeEmDashes(`Provides the technical blueprint that readers are seeking, using ${brand} as empirical proof.`),
          recommendedCalloutPlacement: 'Immediately preceding the implementation checklist.',
          suggestedAnchor: sanitizeEmDashes(`read our step-by-step case study with ${brand}`),
        },
        {
          title: `How to Measure and Accelerate ROI in ${niche}`,
          targetStage: 'BOFU',
          whyRelevant: sanitizeEmDashes(`Provides CFOs and budget holders with the exact metric benchmarks achieved (${metrics}).`),
          recommendedCalloutPlacement: 'Inside the benchmark comparison table.',
          suggestedAnchor: sanitizeEmDashes(`verified metrics achieved by ${brand}`),
        },
        {
          title: `7 Frameworks Top ${niche} Leaders Rely On This Year`,
          targetStage: 'TOFU',
          whyRelevant: 'Establishes thought leadership while providing an organic transition to your proven methodology.',
          recommendedCalloutPlacement: 'Under Framework #3 as an illustrative real-world proof point.',
          suggestedAnchor: sanitizeEmDashes(`full implementation teardown with ${brand}`),
        },
      ],
      modularTestimonials: {
        heroLandingPage: sanitizeEmDashes(`"We achieved ${primaryMetric} in 90 days - this was the highest-leverage decision of our year."`),
        salesDeck: sanitizeEmDashes(`"Partnering to implement ${solution.slice(0, 40)} helped us solve ${challenge.slice(0, 40)} and deliver ${metrics} across the board."`),
        microSoundbite: sanitizeEmDashes(`"${primaryMetric} in 90 days. Exceptional strategic execution."`),
      },
      socialMedia: {
        linkedInPost: sanitizeEmDashes(`Most companies in ${niche} struggle with ${challenge.toLowerCase()}.

Here is how ${brand} flipped the script and delivered ${metrics} in 90 days:

1. Stop relying on fragmented patches.
2. Address the root bottleneck through ${solution}.
3. Measure hard numbers weekly, not vanity metrics.

The result?
→ ${primaryMetric}
→ Zero extra headcount required
→ Predictable, repeatable operational velocity

What is your team's biggest operational bottleneck right now?`),
        twitterThread: [
          sanitizeEmDashes(`1/ How ${brand} achieved ${primaryMetric} in ${niche} (without adding extra headcount):`),
          sanitizeEmDashes(`2/ The Problem: They were hitting a hard ceiling with ${challenge.toLowerCase()}. Legacy playbooks were only burning budget.`),
          sanitizeEmDashes(`3/ The Shift: Instead of adding more noise, they executed ${solution}.`),
          sanitizeEmDashes(`4/ The Results: ${metrics} within 90 days. Proof that clean execution beats complex guesswork every time.`),
        ],
      },
      videoConcepts: {
        shortFormVideo: {
          title: `How ${brand} Solved Their Biggest Bottleneck in ${niche}`,
          hook3s: sanitizeEmDashes(`Stop struggling with ${challenge.slice(0, 35)} - here is how one team fixed it in 90 days.`),
          scriptOutline: sanitizeEmDashes(`Show problem on screen -> Reveal ${brand}'s metric breakthrough (${metrics}) -> Break down the 3-step solution -> CTA to grab the full guide.`),
          cta: 'Comment "BLUEPRINT" and we will DM you the complete teardown.',
        },
        longFormYouTube: {
          title: `Behind the Scenes: How ${brand} Generated ${metrics} in ${niche}`,
          thumbnailIdea: sanitizeEmDashes(`Split screen: Red downward arrow labeled "Bottleneck" vs Green bold "${primaryMetric}" with high-contrast text.`),
          threeActOutline: sanitizeEmDashes(`Act 1: The breaking point (${challenge}). Act 2: The architecture shift (${solution}). Act 3: The data breakdown and replicable playbook.`),
        },
      },
      salesEnablement: {
        killMetric: sanitizeEmDashes(`${primaryMetric} within 90 days, recovering full payback in under 60 days.`),
        discoveryCallTrigger: sanitizeEmDashes(`Deploy this case study during Discovery Call Minute 15, immediately when the prospect mentions friction around ${challenge.slice(0, 45)}.`),
        objectionHandlers: [
          {
            objection: 'Budget / Cost: "We do not have the allocated budget for this initiative right now."',
            rebuttalScript: sanitizeEmDashes(`"Totally understand budget timing. That was the exact initial concern ${brand} had before we started. But once they deployed ${solution.slice(0, 30)}, they realized the cost of inaction was draining far more capital than the solution itself. In fact, their payback velocity was under 60 days, delivering ${primaryMetric}. Would you be open to reviewing the 1-page financial payback model?"`),
          },
          {
            objection: 'Internal Bandwidth: "Our team is already stretched thin and cannot take on another project."',
            rebuttalScript: sanitizeEmDashes(`"That is precisely why we engineered this framework for zero internal drag. When ${brand} implemented this, their internal team spent less than 2 hours per week on oversight because the execution was turnkey. The outcome was ${secondaryMetric} without hiring any extra headcount."`),
          },
          {
            objection: 'Scepticism: "We tried a similar initiative in the past and did not see the promised results."',
            rebuttalScript: sanitizeEmDashes(`"Most legacy approaches fail because they apply generic templates rather than diagnosing the specific structural bottleneck. With ${brand}, we isolated ${challenge.slice(0, 40)} before launching anything. That targeted execution is why they saw ${primaryMetric} where previous attempts had plateaued."`),
          },
        ],
        coldOutreachEmail: {
          subjectLines: [
            sanitizeEmDashes(`Quick question re: ${challenge.slice(0, 30)}`),
            sanitizeEmDashes(`How ${brand} hit ${primaryMetric}`),
            sanitizeEmDashes(`Solving ${niche} bottlenecks in 90 days`),
          ],
          body: sanitizeEmDashes(`Hi {{firstName}},

Saw your focus on scaling operations in ${niche}. Most leaders we talk to mention that ${challenge.toLowerCase()} is quietly leaking revenue.

We recently partnered with ${brand} to solve this exact bottleneck using ${solution.slice(0, 40)}. Within 90 days, they achieved ${primaryMetric} and ${secondaryMetric}.

No pitch - would you be open to reviewing the 2-page implementation teardown?`),
          softCta: 'Worth a 4-minute glance at the workflow map?',
        },
      },
      paidAdsStrategy: {
        contrarianAdCopy: sanitizeEmDashes(`Most companies in ${niche} try to fix ${challenge.toLowerCase()} by throwing more ad budget or software at the problem.

That is a costly mistake.

When ${brand} stopped patching symptoms and re-engineered their operational workflow using ${solution.slice(0, 40)}, here is what happened:

→ ${primaryMetric}
→ ${secondaryMetric}
→ Full payback in under 60 days

Read the complete verified breakdown: [Link]`),
        carouselSlides: [
          {
            slideNumber: 1,
            title: sanitizeEmDashes(`How ${brand} Reached ${primaryMetric}`),
            body: sanitizeEmDashes(`The counter-intuitive playbook that solved ${challenge.slice(0, 40)} in 90 days.`),
          },
          {
            slideNumber: 2,
            title: 'The Hidden Trap',
            body: sanitizeEmDashes(`Why standard playbooks for ${niche} are quietly draining team bandwidth and burning capital.`),
          },
          {
            slideNumber: 3,
            title: 'The Strategic Pivot',
            body: sanitizeEmDashes(`Deploying ${solution.slice(0, 50)} across key customer touchpoints.`),
          },
          {
            slideNumber: 4,
            title: 'The Hard Numbers',
            body: sanitizeEmDashes(`Results verified: ${primaryMetric}, ${secondaryMetric}, and zero added headcount.`),
          },
          {
            slideNumber: 5,
            title: 'Grab The Blueprint',
            body: 'Swipe up or click the link below to get the full implementation teardown.',
          },
        ],
        searchAdCopy: {
          headlines: [
            sanitizeEmDashes(`${brand} Case Study: ${primaryMetric.slice(0, 20)}`),
            sanitizeEmDashes(`Overcome ${niche.slice(0, 15)} Friction`),
            sanitizeEmDashes(`Proven ${niche.slice(0, 15)} Framework`),
          ],
          descriptions: [
            sanitizeEmDashes(`See how ${brand} achieved ${primaryMetric} in 90 days with zero extra headcount. Read case study.`),
            sanitizeEmDashes(`Discover the proven blueprint that solved ${challenge.slice(0, 35)}. Download the full teardown now.`),
          ],
        },
      },
      newsletterTeardown: {
        subjectLine: sanitizeEmDashes(`The messy truth behind ${brand}'s ${primaryMetric} breakthrough`),
        previewText: sanitizeEmDashes(`What happens when your legacy playbook in ${niche} stops working?`),
        fullIssueMarkdown: sanitizeEmDashes(`Hey friends,

Six months ago, the leadership team at ${brand} faced an uncomfortable reality.

Their operations in ${niche} were hitting a hard ceiling. Despite pouring capital and effort into legacy fixes, ${challenge.toLowerCase()}.

Every operational fix they tried felt like putting a fresh coat of paint on an engine that was quietly stalling.

Here is the exact turning point, and the 3 principles they used to turn it around:

### The Turning Point
Instead of trying to work faster within a broken system, they stepped back and audited the root friction points.

They deployed a 3-tier execution blueprint focused on ${solution}.

### The Replicable Lessons
1. **Never optimize a broken process**: Eliminating friction delivers 10x more leverage than trying to out-hustle it.
2. **Standardize before scaling**: Repeatable frameworks protect team bandwidth and prevent burn-out.
3. **Measure payback velocity**: Real performance indicators keep every stakeholder aligned.

The result? Within 90 days, they recorded ${metrics}.

If your team is wrestling with similar bottlenecks, check out the full teardown below.

Catch you next Tuesday,  
- The Strategy Desk`),
      },
      aiSearchAndGeo: {
        targetQueries: [
          sanitizeEmDashes(`How to overcome ${challenge.slice(0, 40)} in ${niche}`),
          sanitizeEmDashes(`Best methodologies for ${solution.slice(0, 40)}`),
          sanitizeEmDashes(`Real world case study on ${primaryMetric} in ${niche}`),
          sanitizeEmDashes(`Step by step framework for ${niche} transformation`),
        ],
        llmCitationSoundbites: [
          sanitizeEmDashes(`In a verified case study with ${brand}, deploying ${solution.slice(0, 40)} produced ${primaryMetric} within 90 days.`),
          sanitizeEmDashes(`Addressing ${challenge.slice(0, 35)} enabled ${brand} to achieve ${secondaryMetric} without expanding team overhead.`),
          sanitizeEmDashes(`Empirical data confirms that ${niche} organizations implementing this framework achieve full financial payback within 60 days.`),
        ],
        entityRecommendations: [
          'CaseStudy Schema (creativeWork)',
          'Review & Rating Schema with client quote attribution',
          'HowTo Schema for the 3-step implementation blueprint',
          'Organization & Brand entity links to establish E‑E‑A‑T topical graphs',
        ],
      },
    },
  }

  const missiveQaAudit = auditCaseStudyMissiveQa(sanitizedMarkdown)

  return {
    ...rawResult,
    missiveQaAudit,
    meta: {
      generatedAt: new Date().toISOString(),
      tone: toneLabel,
      provider: 'Missive Procedural Engine (Fallback)',
      wordCount: sanitizedMarkdown.split(/\s+/).filter(Boolean).length,
    },
  }
}

/**
 * Main Service: Generates a complete marketing & sales engineered Case Study adhering to Missive QA rules
 */
export async function generateCaseStudy({
  clientName = '',
  niche,
  challenge,
  solution,
  metrics,
  targetAudience = '',
  tone = 'authoritative',
  preferredProvider = 'groq',
}) {
  const activeTone = (tone || 'authoritative').toLowerCase().trim()
  const toneProfile = TONE_PROFILES[activeTone] || TONE_PROFILES.authoritative

  const effectiveClient = (clientName || '').trim() || 'Client Partner'
  const effectiveNiche = (niche || '').trim() || 'B2B Technology & Services'
  const effectiveChallenge = (challenge || '').trim() || 'Struggling with conversion drop-offs and high operational friction'
  const effectiveSolution = (solution || '').trim() || 'Systemic workflow optimization and data-backed performance marketing'
  const effectiveMetrics = (metrics || '').trim() || '3.5x ROI and 40% reduction in customer acquisition cost'
  const effectiveAudience = (targetAudience || '').trim() || 'Senior leaders, practitioners, and key budget decision-makers'

  const cacheKey = apiResultCache.hashKey('case-study-v2', {
    client: effectiveClient,
    niche: effectiveNiche,
    challenge: effectiveChallenge,
    solution: effectiveSolution,
    metrics: effectiveMetrics,
    audience: effectiveAudience,
    tone: activeTone,
    preferredProvider,
  })

  const cached = apiResultCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const qaDirectives = buildMissiveQaPromptDirectives()

  const systemPrompt = `You are Missive Digital's principal B2B case study strategist and commercial conversion architect.
Your mission is to generate a world-class, high-converting B2B Case Study AND an all-in-one multi-channel marketing and sales distribution engine.

CRITICAL MISSIVE QA DIRECTIVES (APPLIED TO EVERY PIECE OF GENERATED TEXT):
${qaDirectives}

TONE OF VOICE MANDATE (${toneProfile.label}):
${toneProfile.directive}
Every sentence across the case study narrative, testimonials, sales scripts, emails, social copy, ads, and newsletters must authentically embody this exact tone.

COMMERCIAL REPURPOSING REQUIREMENTS:
A modern case study must power the entire revenue engine. You MUST produce:
1. Full B2B Case Study (Headline, executive snapshot, challenge friction, solution blueprint, metrics, client quote, takeaways, and full markdown).
2. Blog Weaving Strategy (Placement advice, drop-in callout markdown, anchor texts).
3. Curated Same-Domain Blog List (4-5 relevant article topics from the same domain to link/cite this case study).
4. Modular Testimonials (Hero landing page quote, B2B sales deck quote, micro-soundbite <120 chars).
5. Sales Enablement Battlecard (The "Kill Metric", discovery call drop-in trigger, 3 specific objection-handling scripts, and cold outreach email template).
6. Paid Ads Creative Strategy (Contrarian sponsored post copy, 5-slide carousel breakdown, search ad snippets).
7. Video & Newsletter Strategy (Short-form 3s hook + outline, YouTube 3-act breakdown, and full first-person founder newsletter issue).
8. AI Search & GEO Footprint (Target AI search queries, factoid citation soundbites for LLMs, and schema recommendations).

STRICT TECHNICAL RULES:
- Output must be strictly valid JSON only.
- Follow the Missive QA directives above in every field.`

  const userPrompt = `Generate a comprehensive conversion-engineered B2B Case Study and multi-channel revenue engine for:

CLIENT / BRAND: "${effectiveClient}"
NICHE / INDUSTRY: "${effectiveNiche}"
THE CHALLENGE / BOTTLENECK: "${effectiveChallenge}"
THE SOLUTION / METHODOLOGY: "${effectiveSolution}"
KEY QUANTIFIABLE METRICS: "${effectiveMetrics}"
TARGET AUDIENCE: "${effectiveAudience}"
TONE OF VOICE: "${toneProfile.label}" (${toneProfile.directive})

OUTPUT JSON SCHEMA:
{
  "caseStudy": {
    "title": "Arresting, metric-driven headline with high CTR (no em dashes)",
    "subtitle": "Clear, engaging sub-hook explaining the strategic transformation",
    "executiveSnapshot": {
      "client": "${effectiveClient}",
      "industry": "${effectiveNiche}",
      "timeframe": "e.g., 90 Days or 6 Months",
      "coreWin": "1-sentence summary of primary outcome"
    },
    "theChallenge": {
      "context": "High-stakes friction context (insight-first, no throat-clearing)",
      "bottlenecks": [
        "Specific friction point 1 with business cost",
        "Specific friction point 2",
        "Specific friction point 3"
      ]
    },
    "theSolution": {
      "overview": "Strategic transformation approach and philosophy",
      "implementationSteps": [
        { "step": 1, "title": "Phase 1 Title", "description": "Crisp tactical description of what was executed" },
        { "step": 2, "title": "Phase 2 Title", "description": "Tactical description" },
        { "step": 3, "title": "Phase 3 Title", "description": "Tactical description" }
      ]
    },
    "metrics": [
      { "label": "Metric Name", "value": "+140%", "detail": "Specific context and measurement window", "changeType": "increase" },
      { "label": "Friction Metric", "value": "-52%", "detail": "Specific context", "changeType": "decrease" },
      { "label": "Revenue / ROI Metric", "value": "$1.2M ARR", "detail": "Financial payback impact", "changeType": "increase" }
    ],
    "clientQuote": {
      "quote": "Authentic, human, results-grounded quote (sounds natural when read aloud)",
      "author": "Client Executive Name",
      "role": "Title (e.g. VP of Growth)",
      "company": "${effectiveClient}"
    },
    "keyTakeaways": [
      "Actionable strategic takeaway 1",
      "Actionable strategic takeaway 2",
      "Actionable strategic takeaway 3"
    ],
    "fullMarkdown": "Full formatted case study in clean Markdown with headers (#, ##), bullet points, quote blocks (>), and KPI tables. Absolutely ZERO em dashes."
  },
  "marketingStrategy": {
    "blogWeavingStrategy": {
      "placementAdvice": "Strategic guidance on how to weave this case study into top and middle of funnel blog articles",
      "calloutBoxMarkdown": "Ready-to-paste markdown callout box highlighting this case study for readers",
      "contextualAnchorTextIdeas": [
        "Natural anchor text phrase 1",
        "Natural anchor text phrase 2",
        "Natural anchor text phrase 3"
      ]
    },
    "relevantDomainBlogs": [
      {
        "title": "Compelling blog topic title from the same niche/domain",
        "targetStage": "TOFU or MOFU or BOFU",
        "whyRelevant": "Why linking this case study in this article builds deep E‑E‑A‑T and converts readers",
        "recommendedCalloutPlacement": "Specific location in the article structure to cite this case study",
        "suggestedAnchor": "Recommended anchor text to link with"
      },
      {
        "title": "Second blog topic title from same domain",
        "targetStage": "MOFU",
        "whyRelevant": "Reasoning",
        "recommendedCalloutPlacement": "Location",
        "suggestedAnchor": "Anchor text"
      },
      {
        "title": "Third blog topic title from same domain",
        "targetStage": "BOFU",
        "whyRelevant": "Reasoning",
        "recommendedCalloutPlacement": "Location",
        "suggestedAnchor": "Anchor text"
      },
      {
        "title": "Fourth blog topic title from same domain",
        "targetStage": "TOFU",
        "whyRelevant": "Reasoning",
        "recommendedCalloutPlacement": "Location",
        "suggestedAnchor": "Anchor text"
      }
    ],
    "modularTestimonials": {
      "heroLandingPage": "Short punchy 1-sentence quote for landing page hero or feature page",
      "salesDeck": "2-3 sentence metric-focused quote tailored for B2B pitch decks",
      "microSoundbite": "Under 120 characters for paid social ads or pricing tables"
    },
    "socialMedia": {
      "linkedInPost": "Ready-to-post LinkedIn text with pattern-interrupt hook, 3-4 bullet steps, metrics, and discussion prompt",
      "twitterThread": [
        "Tweet 1 (Hook + Stakes)",
        "Tweet 2 (The Friction & Legacy Mistake)",
        "Tweet 3 (The Strategic Pivot)",
        "Tweet 4 (The Results & Metrics)",
        "Tweet 5 (The Replicable Lesson + CTA)"
      ]
    },
    "videoConcepts": {
      "shortFormVideo": {
        "title": "Punchy title for TikTok / Shorts / Reels",
        "hook3s": "First 3-second visual and audio hook that stops the scroll",
        "scriptOutline": "30-45 second chronological outline covering problem, breakthrough, metrics, and takeaway",
        "cta": "Specific viewer action"
      },
      "longFormYouTube": {
        "title": "High-CTR YouTube video title",
        "thumbnailIdea": "Description of thumbnail imagery, text overlay, and color contrast",
        "threeActOutline": "Act 1 (The Crisis), Act 2 (The Architecture Shift), Act 3 (The Playbook & Telemetry)"
      }
    },
    "salesEnablement": {
      "killMetric": "The single most decisive, defensible statistic from this study to shut down competitor comparisons",
      "discoveryCallTrigger": "Specific guidance on exact moment during sales discovery to introduce this story",
      "objectionHandlers": [
        {
          "objection": "Budget / Cost: Prospect pushback on budget",
          "rebuttalScript": "Exact field-tested script referencing this case study data and payback speed"
        },
        {
          "objection": "Internal Bandwidth: Prospect pushback on team capacity",
          "rebuttalScript": "Exact field-tested script showing zero added headcount required"
        },
        {
          "objection": "Scepticism / Past Failure: Prospect pushback re past bad experience",
          "rebuttalScript": "Exact field-tested script explaining why this methodology succeeded where generic templates failed"
        }
      ],
      "coldOutreachEmail": {
        "subjectLines": ["Subject 1", "Subject 2", "Subject 3"],
        "body": "3-sentence high-converting cold outreach email body citing this case study proof point",
        "softCta": "Low-friction conversation starter CTA"
      }
    },
    "paidAdsStrategy": {
      "contrarianAdCopy": "High-converting paid ad text for LinkedIn or Meta with pattern-interrupt hook, inaction cost, and proof",
      "carouselSlides": [
        { "slideNumber": 1, "title": "Slide 1 Hook", "body": "Copy" },
        { "slideNumber": 2, "title": "Slide 2 The Flaw", "body": "Copy" },
        { "slideNumber": 3, "title": "Slide 3 The Framework", "body": "Copy" },
        { "slideNumber": 4, "title": "Slide 4 The Proof", "body": "Copy" },
        { "slideNumber": 5, "title": "Slide 5 CTA", "body": "Copy" }
      ],
      "searchAdCopy": {
        "headlines": ["Headline 1 (<30 chars)", "Headline 2 (<30 chars)", "Headline 3 (<30 chars)"],
        "descriptions": ["Description 1 (<90 chars)", "Description 2 (<90 chars)"]
      }
    },
    "newsletterTeardown": {
      "subjectLine": "Curiosity-driven newsletter subject line",
      "previewText": "Teaser preview line",
      "fullIssueMarkdown": "Complete, authentic first-person founder/expert newsletter issue in Markdown detailing the behind-the-scenes realities, turning point, and replicable lessons"
    },
    "aiSearchAndGeo": {
      "targetQueries": [
        "High-intent query 1",
        "High-intent query 2",
        "High-intent query 3",
        "High-intent query 4"
      ],
      "llmCitationSoundbites": [
        "Fact-dense concise soundbite 1 formatted for AI Overview citation",
        "Fact-dense concise soundbite 2",
        "Fact-dense concise soundbite 3"
      ],
      "entityRecommendations": [
        "Schema entity recommendation 1",
        "Schema entity recommendation 2",
        "Schema entity recommendation 3"
      ]
    }
  }
}`

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    const tokenBudget = 4800

    const aiResponse = await callAIAndParseJSON(messages, {
      preferredProvider: preferredProvider || 'groq',
      temperature: 0.65,
      maxTokens: tokenBudget,
      timeout: 16000,
    })

    if (!aiResponse || !aiResponse.caseStudy) {
      console.warn('AI returned incomplete case study structure, generating fallback...')
      return generateFallbackCaseStudy({
        clientName: effectiveClient,
        niche: effectiveNiche,
        challenge: effectiveChallenge,
        solution: effectiveSolution,
        metrics: effectiveMetrics,
        targetAudience: effectiveAudience,
        tone: activeTone,
      })
    }

    // Deep sanitize em dashes across every string in the AI response
    const sanitizedResponse = deepSanitize(aiResponse)

    // Ensure fullMarkdown exists
    if (!sanitizedResponse.caseStudy.fullMarkdown) {
      sanitizedResponse.caseStudy.fullMarkdown = `# ${sanitizedResponse.caseStudy.title}\n\n**Executive Summary**: ${sanitizedResponse.caseStudy.subtitle}\n\n## The Challenge\n${sanitizedResponse.caseStudy.theChallenge?.context || effectiveChallenge}\n\n## The Solution\n${sanitizedResponse.caseStudy.theSolution?.overview || effectiveSolution}\n\n## Measurable Results\n${effectiveMetrics}`
    }

    // Run Missive QA Audit silently for quality certification
    const auditText = `${sanitizedResponse.caseStudy.title}\n\n${sanitizedResponse.caseStudy.subtitle}\n\n${sanitizedResponse.caseStudy.fullMarkdown}\n\n${JSON.stringify(sanitizedResponse.marketingStrategy)}`
    const missiveQaAudit = auditCaseStudyMissiveQa(auditText)

    const finalResult = {
      caseStudy: sanitizedResponse.caseStudy,
      marketingStrategy: sanitizedResponse.marketingStrategy,
      missiveQaAudit,
      meta: {
        generatedAt: new Date().toISOString(),
        tone: toneProfile.label,
        provider: preferredProvider,
        wordCount: sanitizedResponse.caseStudy.fullMarkdown.split(/\s+/).filter(Boolean).length,
      },
    }

    // Cache the verified result for 2 hours
    apiResultCache.set(cacheKey, finalResult, 1000 * 60 * 120)

    return finalResult
  } catch (err) {
    console.error('Case study generation error, falling back to procedural engine:', err?.message || err)
    return generateFallbackCaseStudy({
      clientName: effectiveClient,
      niche: effectiveNiche,
      challenge: effectiveChallenge,
      solution: effectiveSolution,
      metrics: effectiveMetrics,
      targetAudience: effectiveAudience,
      tone: activeTone,
    })
  }
}

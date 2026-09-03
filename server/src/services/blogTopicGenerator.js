import { callAIAndParseJSON } from '../utils/aiProvider.js'

/**
 * AI-powered Blog Topic & Content Cluster Generator
 */
export async function generateBlogTopics({
  niche,
  targetKeywords = [],
  audience = '',
  contentGoal = 'educational',
  preferredProvider,
  count = 10,
  contentType = 'blog post',
}) {
  const targetCount = Math.min(Math.max(parseInt(count, 10) || 10, 1), 20)
  const kwList = Array.isArray(targetKeywords)
    ? targetKeywords
    : (typeof targetKeywords === 'string'
        ? targetKeywords.split(',').map(s => s.trim()).filter(Boolean)
        : [])
  const keywordText = kwList.length > 0
    ? kwList.join(', ')
    : 'None specified — extrapolate high-intent terms for the niche'

  const systemPrompt = `You are a world-class SEO content architect and editorial strategist.
Your job is to generate highly differentiated, clickable, and search-optimized blog topics arranged in a clean Pillar-and-Cluster topical authority structure.

Rules:
1. Titles must be specific, magnetic, and strictly adhere to modern SERP CTR best practices (avoid generic phrases like "A Guide to X").
2. Vary content angles (Tactical How-To, Contrarian / Myth-Busting, Data Benchmark, Direct Comparison, Deep Dive, Case Study).
3. Include concise structured outlines (3 to 4 sections with H2: and H3: prefixes) offering high Information Gain.
4. Group topics into logical topical clusters.
5. CRITICAL COUNT REQUIREMENT: You MUST generate EXACTLY ${targetCount} topic objects in the "topics" array. Do not generate fewer.
6. Return ONLY valid JSON, no markdown code blocks outside JSON.`

  const userPrompt = `Generate EXACTLY ${targetCount} SEO-optimized blog topics for:
- Niche: ${niche}
- Target Keywords: ${keywordText}
- Target Audience: ${audience || 'Professionals, practitioners and buyers in the ' + niche + ' space'}
- Content Goal: ${contentGoal}
- Preferred Content Type: ${contentType}

CRITICAL: The "topics" array MUST contain EXACTLY ${targetCount} topic items.
Keep each outline to 3-4 clear points so the entire response stays within token limits.

Return a JSON object with this EXACT structure:
{
  "pillarTopic": {
    "title": "The Ultimate Cornerstone Pillar Title for this niche",
    "primaryKeyword": "main seed keyword",
    "summary": "1-2 sentence description of how the pillar establishes topical authority"
  },
  "clusters": [
    {
      "name": "Core Foundations",
      "description": "Fundamental concepts, beginner setups, and introductory workflows"
    },
    {
      "name": "Tools & Technology",
      "description": "Software reviews, tool evaluations, and tech stack choices"
    },
    {
      "name": "Advanced Execution",
      "description": "Tactical workflows, automation, and scaling strategies"
    },
    {
      "name": "Performance & ROI",
      "description": "Data benchmarks, business impact, and conversion optimization"
    }
  ],
  "topics": [
    // EXACTLY ${targetCount} topic objects here
    {
      "title": "Compelling headline under 65 characters",
      "targetKeyword": "primary keyword targeted",
      "searchIntent": "informational",
      "contentType": "guide",
      "contentAngle": "Tactical Step-by-Step",
      "hook": "1-sentence opening hook or psychological angle that stops the scroll",
      "difficulty": "medium",
      "estimatedWordCount": 1800,
      "clusterName": "Core Foundations",
      "outline": [
        "H2: Section 1 Title",
        "H3: Sub-section Detail",
        "H2: Section 2 Title",
        "H2: Key Takeaways & Action Plan"
      ],
      "whyItWorks": "Why this angle captures search intent and organic engagement",
      "relatedKeywords": ["long tail kw 1", "long tail kw 2"]
    }
  ],
  "strategy": "Strategic recommendation for publishing cadence, hub-and-spoke internal linking, and conversion pathways."
}`

  try {
    const result = await callAIAndParseJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      preferredProvider,
      temperature: 0.6,
      maxTokens: 8000,
      jsonMode: true,
    })

    let validatedTopics = (result.topics || []).map((topic, index) => ({
      id: `topic-${index + 1}`,
      title: topic.title || `Mastering ${niche} Strategy #${index + 1}`,
      targetKeyword: topic.targetKeyword || kwList[0] || niche.toLowerCase(),
      searchIntent: topic.searchIntent || 'informational',
      contentType: topic.contentType || 'guide',
      contentAngle: topic.contentAngle || 'Tactical Step-by-Step',
      hook: topic.hook || 'Learn how to solve this critical problem with actionable steps.',
      difficulty: topic.difficulty || 'medium',
      estimatedWordCount: topic.estimatedWordCount || 1800,
      clusterName: topic.clusterName || 'Core Foundations',
      outline: Array.isArray(topic.outline) && topic.outline.length > 0
        ? topic.outline
        : ['H2: Overview & Context', 'H2: Core Implementation Framework', 'H2: Step-by-Step Action Plan', 'H2: Key Takeaways & Next Steps'],
      whyItWorks: topic.whyItWorks || 'Addresses core search intent and captures long-tail search traffic.',
      relatedKeywords: Array.isArray(topic.relatedKeywords) ? topic.relatedKeywords : [],
    }))

    // If AI returned fewer than targetCount topics, complement with fallback topics up to targetCount
    if (validatedTopics.length < targetCount) {
      console.log(`AI returned ${validatedTopics.length} topics, padding to requested target (${targetCount})...`)
      const fallbackSet = generateFallbackTopics({ niche, targetKeywords: kwList, audience, count: targetCount, contentType })
      const existingTitles = new Set(validatedTopics.map(t => t.title.toLowerCase().trim()))
      for (const padTopic of fallbackSet.topics) {
        if (validatedTopics.length >= targetCount) break
        if (!existingTitles.has(padTopic.title.toLowerCase().trim())) {
          validatedTopics.push({
            ...padTopic,
            id: `topic-${validatedTopics.length + 1}`,
          })
          existingTitles.add(padTopic.title.toLowerCase().trim())
        }
      }
    }

    // Ensure exact count
    validatedTopics = validatedTopics.slice(0, targetCount)

    return {
      niche,
      targetKeywords: kwList,
      audience,
      pillarTopic: result.pillarTopic || {
        title: `The Comprehensive Authority Guide to ${niche} (2025 Edition)`,
        primaryKeyword: kwList[0] || niche,
        summary: `The definitive cornerstone pillar resource establishing complete topical authority for ${niche}.`,
      },
      clusters: Array.isArray(result.clusters) && result.clusters.length > 0
        ? result.clusters
        : [
            { name: 'Core Foundations', description: 'Fundamental concepts, beginner setups, and introductory workflows' },
            { name: 'Tools & Technology', description: 'Software reviews, tool evaluations, and tech stack choices' },
            { name: 'Advanced Execution', description: 'Tactical workflows, automation, and scaling strategies' },
            { name: 'Performance & ROI', description: 'Data benchmarks, business impact, and conversion optimization' },
          ],
      topics: validatedTopics,
      strategy: result.strategy || 'Publish the main cornerstone pillar guide first, then publish supporting cluster articles linked back using exact semantic anchors.',
    }
  } catch (error) {
    console.error('Blog topic generator error (using 20-topic procedural engine):', error.message)
    return generateFallbackTopics({ niche, targetKeywords: kwList, audience, count: targetCount, contentType })
  }
}

/**
 * Procedural Fallback Engine containing 20 unique, rich SEO topic archetypes
 */
export function generateFallbackTopics({ niche, targetKeywords, audience, count = 10, contentType }) {
  const seed = (targetKeywords && targetKeywords[0]) || niche || 'SEO Content'
  const secondary = (targetKeywords && targetKeywords[1]) || `${seed} Strategy`
  const targetCount = Math.min(Math.max(parseInt(count, 10) || 10, 1), 20)

  const archetypes = [
    {
      title: `How to Master ${seed}: The Complete Step-by-Step Playbook`,
      targetKeyword: `${seed} playbook`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Tactical Step-by-Step',
      hook: 'Most advice in this niche focuses on theoretical fluff—here is the exact operational framework to see measurable results in 30 days.',
      difficulty: 'medium',
      estimatedWordCount: 2400,
      clusterName: 'Core Foundations',
      outline: [
        `H2: What is ${seed} and Why It Defines Competitive Advantage`,
        `H2: 4 Core Pillars of a Winning ${seed} Framework`,
        `H3: Phase 1: Baseline Audit & Setup`,
        `H3: Phase 2: Tactical Execution & Workflow Automation`,
        `H2: Common Pitfalls and How to Sidestep Them`,
        `H2: Key Performance Indicators to Track Growth`,
      ],
      whyItWorks: 'Comprehensive cornerstone guides capture high-intent searchers, rank for long-tail variations, and earn authoritative editorial backlinks.',
      relatedKeywords: [`${seed} for beginners`, `${seed} strategy 2025`, `how to do ${seed}`],
    },
    {
      title: `5 Costly ${seed} Mistakes (And What to Do Instead)`,
      targetKeyword: `${seed} mistakes`,
      searchIntent: 'informational',
      contentType: 'listicle',
      contentAngle: 'Contrarian / Myth-Busting',
      hook: 'Are you unknowingly hurting your efficiency? Avoid these 5 common traps that cost teams hours and thousands in wasted budget.',
      difficulty: 'easy',
      estimatedWordCount: 1700,
      clusterName: 'Core Foundations',
      outline: [
        `H2: The Hidden Cost of Outdated Practices in ${niche}`,
        `H2: Mistake #1: Skipping the Diagnostic Baseline Audit`,
        `H2: Mistake #2: Over-indexing on Short-term Hacks`,
        `H2: Mistake #3: Neglecting Audience Feedback Loops`,
        `H2: How to Audit Your Current Workflow in Under 60 Minutes`,
      ],
      whyItWorks: 'Negative psychological hooks ("Mistakes to avoid") consistently yield 28%+ higher CTR across Google search and social feeds.',
      relatedKeywords: [`common ${seed} errors`, `${seed} best practices`, `what not to do in ${seed}`],
    },
    {
      title: `Top 10 ${secondary} Tools Compared (Pros, Cons & Pricing)`,
      targetKeyword: `best ${seed} tools`,
      searchIntent: 'commercial',
      contentType: 'comparison',
      contentAngle: 'Buyer Comparison',
      hook: 'We rigorously stress-tested the leading software platforms in the market so you don’t waste budget on the wrong fit.',
      difficulty: 'hard',
      estimatedWordCount: 2800,
      clusterName: 'Tools & Technology',
      outline: [
        `H2: Evaluation Methodology & Benchmark Criteria`,
        `H2: At-a-Glance Software Comparison Matrix`,
        `H2: Tool 1: Best Overall for Growing Teams`,
        `H2: Tool 2: Best Value for Bootstrapped Budgets`,
        `H2: Final Recommendation & Buyer Verdict`,
      ],
      whyItWorks: 'Commercial comparison queries capture high-intent buyers right before purchase, delivering strong conversion rates.',
      relatedKeywords: [`${seed} software review`, `${seed} tool comparison`, `top rated ${seed} apps`],
    },
    {
      title: `${seed} ROI Breakdown: How to Measure Tangible Business Impact`,
      targetKeyword: `${seed} ROI`,
      searchIntent: 'commercial',
      contentType: 'data-breakdown',
      contentAngle: 'Data & Benchmarks',
      hook: 'How to prove the financial return of your initiatives to executive leadership and board stakeholders with hard numbers.',
      difficulty: 'medium',
      estimatedWordCount: 1900,
      clusterName: 'Performance & ROI',
      outline: [
        `H2: The Financial Formula for Calculating Return on Investment`,
        `H2: 3 Leading Metrics That Direct-Map to Bottom-line Revenue`,
        `H2: Real-World Case Example: 90-Day Compounding Gains`,
        `H2: Executive Reporting Template & Dashboard Blueprint`,
      ],
      whyItWorks: 'Attracts high-value decision-makers and C-suite searchers looking for quantifiable validation and business cases.',
      relatedKeywords: [`calculate ${seed} return`, `${seed} business value`, `${seed} metrics`],
    },
    {
      title: `The Beginner’s Blueprint: Setting Up Your First ${seed} Workflow`,
      targetKeyword: `${seed} for beginners`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Tactical Step-by-Step',
      hook: 'New to ${niche}? Here is the zero-overwhelm primer that walks you through step one to launch without technical friction.',
      difficulty: 'easy',
      estimatedWordCount: 1800,
      clusterName: 'Core Foundations',
      outline: [
        `H2: Prerequisites You Actually Need Before Getting Started`,
        `H2: Step 1: Defining Your Core Goals & Success Metrics`,
        `H2: Step 2: Assembling Your Lightweight Starter Stack`,
        `H2: Step 3: Launching Your First Cycle in 7 Days`,
      ],
      whyItWorks: 'Captures top-of-funnel informational traffic from newcomers who eventually mature into high-LTV customers.',
      relatedKeywords: [`getting started with ${seed}`, `${seed} 101`, `beginner guide ${seed}`],
    },
    {
      title: `10 Advanced ${seed} Tactics Industry Leaders Keep Secret`,
      targetKeyword: `advanced ${seed} tactics`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Tactical Step-by-Step',
      hook: 'Once you have the basics down, these 10 sophisticated optimizations separate top-tier performers from average players.',
      difficulty: 'hard',
      estimatedWordCount: 2600,
      clusterName: 'Advanced Execution',
      outline: [
        `H2: Why Fundamental Tactics Plateau at Scale`,
        `H2: Advanced Strategy #1: Predictive Workflow Optimization`,
        `H2: Advanced Strategy #2: Automated Quality Feedback Loops`,
        `H2: Advanced Strategy #3: Enterprise Integration Patterns`,
        `H2: Measuring the Marginal Lift of Advanced Tweaks`,
      ],
      whyItWorks: 'Earns high social shares and bookmarks from senior practitioners looking to squeeze out competitive edges.',
      relatedKeywords: [`expert ${seed} tips`, `scaling ${seed}`, `advanced ${seed} framework`],
    },
    {
      title: `The Essential 25-Point ${seed} Audit Checklist (2025 Edition)`,
      targetKeyword: `${seed} checklist`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Tactical Step-by-Step',
      hook: 'Don’t push live until you run through this interactive quality-assurance checklist designed to catch silent errors.',
      difficulty: 'easy',
      estimatedWordCount: 1600,
      clusterName: 'Core Foundations',
      outline: [
        `H2: Phase 1: Technical Health & Infrastructure Check (Items 1–8)`,
        `H2: Phase 2: Quality & Content Relevance (Items 9–16)`,
        `H2: Phase 3: Conversion & UX Optimization (Items 17–25)`,
        `H2: Downloadable PDF / Spreadsheet Checklist Version`,
      ],
      whyItWorks: 'Checklists have viral utility and generate immense lead-magnet conversion rates when paired with downloadable PDFs.',
      relatedKeywords: [`${seed} audit`, `${seed} QA checklist`, `${seed} inspection`],
    },
    {
      title: `${seed} Pricing & Cost Teardown: What You Should Actually Pay`,
      targetKeyword: `${seed} cost`,
      searchIntent: 'commercial',
      contentType: 'data-breakdown',
      contentAngle: 'Buyer Comparison',
      hook: 'Demystifying the murky pricing tiers across vendors: what is fair market value vs where teams get quietly overcharged.',
      difficulty: 'medium',
      estimatedWordCount: 2000,
      clusterName: 'Tools & Technology',
      outline: [
        `H2: Average Industry Price Ranges & Fee Models`,
        `H2: Hidden Costs: Implementation, Training & Overage Fees`,
        `H2: In-House vs Outsourced Agency: Full Cost Comparison`,
        `H2: How to Negotiate Vendor Contracts with Confidence`,
      ],
      whyItWorks: 'Directly captures commercial query intent right at the budget-approval stage of the buyer journey.',
      relatedKeywords: [`how much does ${seed} cost`, `${seed} pricing guide`, `${seed} budget calculator`],
    },
    {
      title: `${seed} vs Traditional Approaches: A Head-to-Head Showdown`,
      targetKeyword: `${seed} vs traditional`,
      searchIntent: 'commercial',
      contentType: 'comparison',
      contentAngle: 'Buyer Comparison',
      hook: 'Should you modernize your stack or stick with tried-and-true legacy processes? We ran a controlled head-to-head experiment.',
      difficulty: 'medium',
      estimatedWordCount: 2100,
      clusterName: 'Performance & ROI',
      outline: [
        `H2: The Evolution of ${niche}: Legacy vs Modern Paradigms`,
        `H2: Direct Comparison: Speed, Accuracy & Scalability`,
        `H2: Total Cost of Ownership Across 12 Months`,
        `H2: The Verdict: When to Switch and When to Hold Off`,
      ],
      whyItWorks: 'Vs comparison content captures high-converting searchers seeking definitive comparative validation.',
      relatedKeywords: [`${seed} alternatives`, `legacy vs modern ${seed}`, `is ${seed} worth it`],
    },
    {
      title: `How We Scaled Our ${seed} to 10x Velocity (Case Study)`,
      targetKeyword: `${seed} case study`,
      searchIntent: 'informational',
      contentType: 'case-study',
      contentAngle: 'Data & Benchmarks',
      hook: 'A transparent behind-the-scenes teardown of the exact milestones, failures, and inflection points that delivered 10x growth.',
      difficulty: 'medium',
      estimatedWordCount: 2300,
      clusterName: 'Performance & ROI',
      outline: [
        `H2: The Starting Point: Constraints & Bottle-necks`,
        `H2: The Core Intervention: Restructuring the Core Engine`,
        `H2: Month-by-Month Progress & Key Inflection Moments`,
        `H2: 3 Key Takeaways You Can Replicate This Quarter`,
      ],
      whyItWorks: 'Case studies demonstrate real-world E-E-A-T credibility that search algorithms and prospective clients crave.',
      relatedKeywords: [`${seed} success story`, `scaling ${seed} case study`, `${seed} real results`],
    },
    {
      title: `The Future of ${seed}: 7 Market Trends Reshaping the Landscape`,
      targetKeyword: `${seed} trends 2025`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Data & Benchmarks',
      hook: 'AI, automation, and shifting consumer behavior are rapidly transforming this industry—here is what to expect next.',
      difficulty: 'medium',
      estimatedWordCount: 2100,
      clusterName: 'Advanced Execution',
      outline: [
        `H2: Trend #1: AI Integration & Autonomous Workflows`,
        `H2: Trend #2: The Shift Toward Hyper-Personalization`,
        `H2: Trend #3: Regulatory & Privacy Considerations`,
        `H2: How Forward-Thinking Teams Are Future-Proofing Today`,
      ],
      whyItWorks: 'Trend pieces capture recurring annual search volume spikes and establish thought leadership authority.',
      relatedKeywords: [`future of ${seed}`, `${seed} predictions`, `${seed} industry trends`],
    },
    {
      title: `Zero-to-Hero: A 30-Day Implementation Roadmap for ${seed}`,
      targetKeyword: `${seed} roadmap`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Tactical Step-by-Step',
      hook: 'Tackle implementation with daily, bite-sized tasks structured across 4 clear weekly sprint milestones.',
      difficulty: 'medium',
      estimatedWordCount: 2500,
      clusterName: 'Core Foundations',
      outline: [
        `H2: Week 1: Audit, Alignment & Baseline Preparation`,
        `H2: Week 2: Core Asset Creation & Infrastructure Setup`,
        `H2: Week 3: Testing, Quality Assurance & Soft Launch`,
        `H2: Week 4: Optimization, Iteration & Scale`,
      ],
      whyItWorks: 'Time-bound roadmaps remove execution paralysis and provide immediate, bookmarkable utility.',
      relatedKeywords: [`30 day ${seed} plan`, `${seed} implementation timeline`, `${seed} sprint plan`],
    },
    {
      title: `Why Most ${seed} Strategies Fail in Month 3 (And How to Fix It)`,
      targetKeyword: `why ${seed} fails`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Contrarian / Myth-Busting',
      hook: 'Initial momentum often dies at the 90-day mark. Understand the psychological and operational plateau—and how to break through.',
      difficulty: 'easy',
      estimatedWordCount: 1750,
      clusterName: 'Advanced Execution',
      outline: [
        `H2: The Infamous 90-Day Chasm in ${niche}`,
        `H2: Diagnostic: Identifying the Root Cause of the Stagnation`,
        `H2: Re-energizing Your Feedback Loops and Workflow`,
        `H2: 3 Systems to Ensure Long-term Compounding Consistency`,
      ],
      whyItWorks: 'Resonates deeply with teams currently experiencing slowdowns, offering targeted solutions that build trust.',
      relatedKeywords: [`fix ${seed} problems`, `troubleshoot ${seed}`, `${seed} plateau`],
    },
    {
      title: `Copy-and-Paste ${seed} Templates & Swipe Files (Save 10 Hours/Week)`,
      targetKeyword: `${seed} templates`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Tactical Step-by-Step',
      hook: 'Stop staring at a blank screen. Steal our internal templates, prompts, and outlines proven across hundreds of implementations.',
      difficulty: 'easy',
      estimatedWordCount: 1650,
      clusterName: 'Tools & Technology',
      outline: [
        `H2: Template #1: The Core Strategy Brief Template`,
        `H2: Template #2: The Weekly Execution & Review Dashboard`,
        `H2: Template #3: The Stakeholder Update Email Format`,
        `H2: How to Customize These Frameworks for Your Unique Stack`,
      ],
      whyItWorks: 'Template search terms carry extremely high user search intent and generate massive bookmarking velocity.',
      relatedKeywords: [`free ${seed} templates`, `${seed} prompts`, `${seed} swipe file`],
    },
    {
      title: `How to Build a High-Performing ${seed} Team or Hire the Right Partner`,
      targetKeyword: `hire ${seed} specialist`,
      searchIntent: 'commercial',
      contentType: 'guide',
      contentAngle: 'Buyer Comparison',
      hook: 'Looking to staff up or bring in an external partner? Here are the interview scorecards and red flags you must look for.',
      difficulty: 'medium',
      estimatedWordCount: 2000,
      clusterName: 'Performance & ROI',
      outline: [
        `H2: Required Skill Sets vs Nice-to-Haves`,
        `H2: 5 Practical Interview Questions That Weed Out Theorists`,
        `H2: In-House Employee vs Specialized Agency: Decision Tree`,
        `H2: How to Set Up 30-60-90 Day Expectations for Immediate Impact`,
      ],
      whyItWorks: 'Captures business leaders preparing to invest significant capital into talent or consulting partnerships.',
      relatedKeywords: [`${seed} agency vs in-house`, `${seed} job description`, `how to hire ${seed}`],
    },
    {
      title: `The Ultimate Guide to ${seed} Automation and Workflow Streamlining`,
      targetKeyword: `${seed} automation`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Tactical Step-by-Step',
      hook: 'Automate repetitive tasks and free up mental bandwidth using modern webhook triggers and AI agents.',
      difficulty: 'hard',
      estimatedWordCount: 2700,
      clusterName: 'Tools & Technology',
      outline: [
        `H2: Identifying High-Frequency, Low-Leverage Tasks to Automate`,
        `H2: Recommended No-Code & API Integrations for Seamless Sync`,
        `H2: Building Your First Automated Trigger-Action Pipeline`,
        `H2: Human-in-the-Loop Quality Control Safeguards`,
      ],
      whyItWorks: 'Automation queries attract high-tech power users who champion modern tools inside their organizations.',
      relatedKeywords: [`automate ${seed}`, `${seed} workflow integration`, `${seed} Zapier API`],
    },
    {
      title: `Key Performance Indicators: 6 Vital Metrics to Monitor ${seed} Health`,
      targetKeyword: `${seed} KPIs`,
      searchIntent: 'informational',
      contentType: 'data-breakdown',
      contentAngle: 'Data & Benchmarks',
      hook: 'Stop drowning in vanity metrics. Focus strictly on the 6 numbers that actually correlate to commercial success.',
      difficulty: 'medium',
      estimatedWordCount: 1850,
      clusterName: 'Performance & ROI',
      outline: [
        `H2: Why Vanity Metrics Mislead Even Smart Operators`,
        `H2: Metric 1: Velocity & Throughput Efficiency`,
        `H2: Metric 2: Engagement Depth & Retention Rate`,
        `H2: Metric 3: Cost per Acquisition & Pipeline Influence`,
        `H2: Building an Automated One-Page Executive Dashboard`,
      ],
      whyItWorks: 'KPI guides serve as authoritative benchmarks quoted across industry presentations and internal pitch decks.',
      relatedKeywords: [`${seed} benchmarks`, `how to measure ${seed}`, `${seed} dashboard`],
    },
    {
      title: `Enterprise vs Small Business ${seed}: Key Tactical Differences`,
      targetKeyword: `enterprise ${seed}`,
      searchIntent: 'commercial',
      contentType: 'comparison',
      contentAngle: 'Buyer Comparison',
      hook: 'What works for a 10-person startup will break inside a Fortune 500 company. Understand scale-specific adaptations.',
      difficulty: 'hard',
      estimatedWordCount: 2200,
      clusterName: 'Advanced Execution',
      outline: [
        `H2: Governance, Compliance & Security Nuances at Enterprise Scale`,
        `H2: Managing Multi-Stakeholder Approval Cycles`,
        `H2: Tech Stack Scalability & Data Privacy Requirements`,
        `H2: How Startups Can Adopt Enterprise Discipline Early`,
      ],
      whyItWorks: 'Captures enterprise decision-makers and procurement managers shopping for enterprise-grade solutions.',
      relatedKeywords: [`enterprise ${seed} architecture`, `corporate ${seed}`, `${seed} compliance`],
    },
    {
      title: `Common ${seed} Questions Answered by Senior Specialists`,
      targetKeyword: `${seed} FAQ`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Contrarian / Myth-Busting',
      hook: 'We compiled the 15 most frequent, challenging questions submitted by practitioners and answered them with blunt honesty.',
      difficulty: 'easy',
      estimatedWordCount: 2100,
      clusterName: 'Core Foundations',
      outline: [
        `H2: Foundational Questions & Conceptual Misconceptions`,
        `H2: Budget, Pricing & Resource Allocation Inquiries`,
        `H2: Technical Execution & Integration Troubleshooting`,
        `H2: Long-Term Strategy & Market Predictions`,
      ],
      whyItWorks: 'Directly mirrors Google "People Also Ask" questions and captures high-volume featured snippet real estate.',
      relatedKeywords: [`${seed} questions`, `${seed} explained`, `${seed} guide for managers`],
    },
    {
      title: `The 15-Minute Daily Routine for Consistent ${seed} Growth`,
      targetKeyword: `daily ${seed} routine`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Tactical Step-by-Step',
      hook: 'Consistency beats sporadic sprints. Build a lightweight daily habit that compounds into massive unfair advantage over 12 months.',
      difficulty: 'easy',
      estimatedWordCount: 1600,
      clusterName: 'Core Foundations',
      outline: [
        `H2: The Science of Compounding Micro-Efforts in ${niche}`,
        `H2: The 5-Minute Morning Scan: Signal vs Noise`,
        `H2: The 7-Minute Core Sprint: High-Impact Execution`,
        `H2: The 3-Minute Evening Reflection & Backlog Grooming`,
      ],
      whyItWorks: 'Action-oriented daily frameworks trigger immense engagement, social sharing, and high readership retention.',
      relatedKeywords: [`daily ${seed} checklist`, `${seed} habits`, `consistent ${seed} growth`],
    },
  ]

  const selectedTopics = archetypes.slice(0, targetCount).map((item, idx) => ({
    id: `topic-${idx + 1}`,
    ...item,
  }))

  return {
    niche,
    targetKeywords: targetKeywords || [seed],
    audience,
    pillarTopic: {
      title: `The Master Blueprint to ${seed}: Modern Strategies, Workflows & Implementation`,
      primaryKeyword: seed,
      summary: `The cornerstone topic pillar establishing comprehensive authority across all sub-themes in the ${niche} landscape.`,
    },
    clusters: [
      { name: 'Core Foundations', description: 'Fundamental strategies, beginner playbooks, and introductory workflows' },
      { name: 'Tools & Technology', description: 'Software reviews, comparisons, and tool evaluations' },
      { name: 'Advanced Execution', description: 'Scaling frameworks, automation, and advanced tactics' },
      { name: 'Performance & ROI', description: 'Data benchmarks, business impact, and conversion optimization' },
    ],
    topics: selectedTopics,
    strategy: `Publish the cornerstone guide first (${seed}), then roll out supporting cluster posts linked back using exact semantic anchors to solidify topical authority.`,
  }
}

/**
 * Generate topic clusters specifically
 */
export async function generateTopicClusters({
  niche,
  mainKeyword,
  audience = '',
  preferredProvider,
  clusterCount = 4,
  topicsPerCluster = 4,
}) {
  const result = await generateBlogTopics({
    niche,
    targetKeywords: [mainKeyword],
    audience,
    preferredProvider,
    count: clusterCount * topicsPerCluster,
  })

  return {
    pillarPage: result.pillarTopic,
    clusters: result.clusters.map((c, i) => ({
      name: c.name,
      description: c.description,
      topics: result.topics.filter(t => t.clusterName === c.name || i === 0).slice(0, topicsPerCluster),
    })),
    interlinkingStrategy: result.strategy,
  }
}

/**
 * Generate content calendar schedule
 */
export function generateContentCalendar({ topics, postsPerWeek = 2, startDate = new Date() }) {
  const calendar = []
  let currentDate = new Date(startDate)

  topics.forEach((topic, index) => {
    const dayOffset = Math.floor(index * (7 / postsPerWeek))
    const publishDate = new Date(currentDate)
    publishDate.setDate(publishDate.getDate() + dayOffset)

    calendar.push({
      date: publishDate.toISOString().split('T')[0],
      topic: topic.title,
      targetKeyword: topic.targetKeyword,
      cluster: topic.clusterName,
      status: 'Planned',
    })
  })

  return calendar
}
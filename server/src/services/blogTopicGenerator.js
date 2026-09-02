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
  const kwList = Array.isArray(targetKeywords) ? targetKeywords : (typeof targetKeywords === 'string' ? targetKeywords.split(',').map(s => s.trim()).filter(Boolean) : [])
  const keywordText = kwList.length > 0 ? kwList.join(', ') : 'None specified — extrapolate high-intent terms for the niche'

  const systemPrompt = `You are a world-class SEO content architect and editorial strategist.
Your job is to generate highly differentiated, clickable, and search-optimized blog topics arranged in a clean Pillar-and-Cluster topical authority structure.

Rules:
1. Titles must be specific, magnetic, and strictly adhere to modern SERP CTR best practices (avoid generic phrases like "A Guide to X").
2. Vary content angles (Tactical How-To, Contrarian / Myth-Busting, Data Benchmark, Direct Comparison, Deep Dive).
3. Include structured outlines (with H2: and H3: prefixes) that offer high Information Gain.
4. Group topics into logical topical clusters.
5. Return ONLY valid JSON, no markdown code blocks outside JSON.`

  const userPrompt = `Generate ${count} SEO-optimized blog topics for:
- Niche: ${niche}
- Target Keywords: ${keywordText}
- Target Audience: ${audience || 'Professionals and buyers in the ' + niche + ' space'}
- Content Goal: ${contentGoal}
- Preferred Content Type: ${contentType}

Return a JSON object with this EXACT structure:
{
  "pillarTopic": {
    "title": "The Ultimate Definitive Pillar Title for this niche",
    "primaryKeyword": "main seed keyword",
    "summary": "1-2 sentence description of how the pillar establishes topical authority"
  },
  "clusters": [
    {
      "name": "Cluster Category Name (e.g. Tactical Guides & Workflows)",
      "description": "Short explanation of this cluster's role in the silo"
    }
  ],
  "topics": [
    {
      "title": "Compelling, magnetic headline under 65 characters",
      "targetKeyword": "primary keyword targeted",
      "searchIntent": "informational|commercial|transactional",
      "contentType": "how-to|guide|listicle|case-study|comparison|data-breakdown",
      "contentAngle": "Tactical Step-by-Step|Contrarian / Myth-Busting|Data & Benchmarks|Buyer Comparison",
      "hook": "1-sentence opening hook or psychological angle that stops the scroll",
      "difficulty": "easy|medium|hard",
      "estimatedWordCount": 1800,
      "clusterName": "Cluster Category Name this belongs to",
      "outline": [
        "H2: Section 1 Title",
        "H3: Sub-section Detail",
        "H2: Section 2 Title",
        "H2: Section 3 Title",
        "H2: FAQ & Key Takeaways"
      ],
      "whyItWorks": "Why this specific angle captures search volume and user engagement",
      "relatedKeywords": ["long tail kw 1", "long tail kw 2", "long tail kw 3"]
    }
  ],
  "strategy": "Strategic recommendation for publishing frequency, internal linking, and conversion routing."
}`

  try {
    const result = await callAIAndParseJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      preferredProvider,
      temperature: 0.6,
      maxTokens: 6000,
      jsonMode: true,
    })

    const validatedTopics = (result.topics || []).map((topic, index) => ({
      id: `topic-${index + 1}`,
      title: topic.title || `Mastering ${niche} Strategy #${index + 1}`,
      targetKeyword: topic.targetKeyword || kwList[0] || niche.toLowerCase(),
      searchIntent: topic.searchIntent || 'informational',
      contentType: topic.contentType || 'guide',
      contentAngle: topic.contentAngle || 'Tactical Step-by-Step',
      hook: topic.hook || 'Learn how to solve this critical problem with actionable steps.',
      difficulty: topic.difficulty || 'medium',
      estimatedWordCount: topic.estimatedWordCount || 1800,
      clusterName: topic.clusterName || 'Core Content',
      outline: Array.isArray(topic.outline) ? topic.outline : ['H2: Overview', 'H2: Core Strategy', 'H2: Action Plan'],
      whyItWorks: topic.whyItWorks || 'Addresses core search intent and captures long-tail search traffic.',
      relatedKeywords: Array.isArray(topic.relatedKeywords) ? topic.relatedKeywords : [],
    }))

    return {
      niche,
      targetKeywords: kwList,
      audience,
      pillarTopic: result.pillarTopic || {
        title: `The Comprehensive Guide to ${niche} (2025)`,
        primaryKeyword: kwList[0] || niche,
        summary: `The central pillar resource establishing complete topical authority for ${niche}.`,
      },
      clusters: Array.isArray(result.clusters) ? result.clusters : [
        { name: 'Core Foundations', description: 'Foundational concepts and setup' },
        { name: 'Advanced Execution', description: 'Scaling and tactical workflows' },
      ],
      topics: validatedTopics,
      strategy: result.strategy || 'Publish the main pillar page first, followed by supporting cluster articles linked back using exact semantic anchors.',
    }
  } catch (error) {
    console.error('Blog topic generator error:', error.message)
    return generateFallbackTopics({ niche, targetKeywords: kwList, audience, count, contentType })
  }
}

function generateFallbackTopics({ niche, targetKeywords, audience, count, contentType }) {
  const seed = targetKeywords[0] || niche
  const secondary = targetKeywords[1] || `${seed} tips`

  const fallbackList = [
    {
      id: 'topic-1',
      title: `How to Master ${seed}: The Complete Step-by-Step Playbook`,
      targetKeyword: `${seed} playbook`,
      searchIntent: 'informational',
      contentType: 'guide',
      contentAngle: 'Tactical Step-by-Step',
      hook: 'Most advice in this niche focuses on theory—here is the exact operational framework to get results in 30 days.',
      difficulty: 'medium',
      estimatedWordCount: 2200,
      clusterName: 'Core Foundations',
      outline: [
        `H2: What is ${seed} and Why It Matters Now`,
        `H2: 4 Core Pillars of an Effective Strategy`,
        `H3: Phase 1: Baseline Audit & Setup`,
        `H3: Phase 2: Execution & Workflow Optimization`,
        `H2: Common Pitfalls and How to Avoid Them`,
        `H2: Key Metrics to Track Success`,
      ],
      whyItWorks: 'Comprehensive ultimate guides capture high-intent searchers and earn high-authority backlinks.',
      relatedKeywords: [`${seed} for beginners`, `${seed} strategy 2025`, `how to do ${seed}`],
    },
    {
      id: 'topic-2',
      title: `5 Costly ${seed} Mistakes (And What to Do Instead)`,
      targetKeyword: `${seed} mistakes`,
      searchIntent: 'informational',
      contentType: 'listicle',
      contentAngle: 'Contrarian / Myth-Busting',
      hook: 'Are you unknowingly hurting your results? Avoid these 5 common traps that cost teams hours each week.',
      difficulty: 'easy',
      estimatedWordCount: 1600,
      clusterName: 'Core Foundations',
      outline: [
        `H2: The Real Cost of Outdated Practices`,
        `H2: Mistake #1: Skipping the Diagnostic Audit`,
        `H2: Mistake #2: Ignoring Structured Workflows`,
        `H2: Mistake #3: Overcomplicating Early Milestones`,
        `H2: How to Audit Your Current Workflow Today`,
      ],
      whyItWorks: 'Negative hooks ("Mistakes to avoid") have 30%+ higher CTR on Google search and social feeds.',
      relatedKeywords: [`common ${seed} errors`, `${seed} best practices`, `what not to do in ${seed}`],
    },
    {
      id: 'topic-3',
      title: `Top 10 ${secondary} Tools Compared (Pros, Cons & Pricing)`,
      targetKeyword: `best ${seed} tools`,
      searchIntent: 'commercial',
      contentType: 'comparison',
      contentAngle: 'Buyer Comparison',
      hook: 'We tested the leading software options so you don’t have to waste budget on the wrong fit.',
      difficulty: 'hard',
      estimatedWordCount: 2500,
      clusterName: 'Tools & Evaluation',
      outline: [
        `H2: Evaluation Methodology & Benchmark Criteria`,
        `H2: Quick Comparison Matrix`,
        `H2: Tool 1: Best Overall for Teams`,
        `H2: Tool 2: Best Value for Budget`,
        `H2: Final Recommendation & Buyer Verdict`,
      ],
      whyItWorks: 'Commercial comparison queries capture users right before purchase, generating high affiliate/lead conversions.',
      relatedKeywords: [`${seed} software review`, `${seed} tool comparison`, `top rated ${seed} apps`],
    },
    {
      id: 'topic-4',
      title: `${seed} ROI Breakdown: How to Measure Business Impact`,
      targetKeyword: `${seed} ROI`,
      searchIntent: 'commercial',
      contentType: 'data-breakdown',
      contentAngle: 'Data & Benchmarks',
      hook: 'How to prove the financial value of your initiatives to leadership and stakeholders.',
      difficulty: 'medium',
      estimatedWordCount: 1800,
      clusterName: 'Advanced Execution',
      outline: [
        `H2: The Financial Formula for Estimating Return`,
        `H2: 3 Key Metrics That Direct-Map to Revenue`,
        `H2: Case Example: 90-Day Compounding Gains`,
        `H2: Executive Reporting Template`,
      ],
      whyItWorks: 'Attracts high-value decision-makers and C-suite searchers looking for quantifiable validation.',
      relatedKeywords: [`calculate ${seed} return`, `${seed} business value`, `${seed} metrics`],
    },
  ]

  return {
    niche,
    targetKeywords,
    audience,
    pillarTopic: {
      title: `The Master Guide to ${seed}: Modern Strategies & Implementation`,
      primaryKeyword: seed,
      summary: `The cornerstone topic pillar for establishing topical authority across the entire ${niche} vertical.`,
    },
    clusters: [
      { name: 'Core Foundations', description: 'Fundamental strategies and introductory guides' },
      { name: 'Tools & Evaluation', description: 'Software reviews and commercial comparisons' },
      { name: 'Advanced Execution', description: 'Scaling, data analysis, and advanced frameworks' },
    ],
    topics: fallbackList.slice(0, count),
    strategy: `Build topical authority by publishing the core pillar guide first, then supporting it with tactical cluster posts linked back with descriptive anchor text.`,
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
    // Increment days
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
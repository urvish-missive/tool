/**
 * AI-powered blog topic generator service
 * Generates SEO-friendly blog topics based on user input
 */

import { callAIAndParseJSON } from '../utils/aiProvider.js'

/**
 * Generate blog topics using AI
 * @param {Object} params - Input parameters
 * @param {string} params.niche - Main niche/industry (e.g., "digital marketing", "SaaS", "health & wellness")
 * @param {string[]} params.targetKeywords - Target keywords to base topics on
 * @param {string} params.audience - Target audience description
 * @param {string} params.contentGoal - Goal of the content (educational, commercial, lead generation, brand awareness)
 * @param {string} params.preferredProvider - AI provider to use
 * @param {number} params.count - Number of topics to generate (default: 10)
 * @param {string} params.contentType - Type of content (blog post, guide, case study, listicle, how-to)
 * @returns {Promise<Object>} Generated topics with metadata
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
  
  const systemPrompt = `You are an expert SEO content strategist and blog topic generator. Your job is to generate high-quality, SEO-friendly blog topics that:
1. Target specific keywords naturally
2. Match search intent for the given audience
3. Are specific and actionable (not generic)
4. Have clear value propositions
5. Follow SEO best practices for headlines

Return a JSON object with this exact structure:
{
  "topics": [
    {
      "title": "Compelling blog post title (60 chars or less recommended)",
      "targetKeyword": "primary keyword this topic targets",
      "searchIntent": "informational|commercial|transactional|navigational",
      "contentType": "how-to|guide|listicle|case-study|comparison|opinion|news",
      "difficulty": "easy|medium|hard",
      "estimatedWordCount": 1500,
      "outline": ["H2: Section 1", "H2: Section 2", "H2: Section 3"],
      "whyItWorks": "Brief explanation of why this topic will perform well",
      "relatedKeywords": ["related kw 1", "related kw 2"]
    }
  ],
  "strategy": "Overall content strategy recommendation for this niche"
`

  const userPrompt = `Generate ${count} SEO-optimized blog topics for the following:

**Niche/Industry:** ${niche}
**Target Keywords:** ${targetKeywords.join(', ') || 'None specified - generate based on niche'}
**Target Audience:** ${audience || 'General audience interested in ' + niche}
**Content Goal:** ${contentGoal}
**Preferred Content Type:** ${contentType}

Requirements:
- Topics should be specific, not generic (e.g., not "What is SEO" but "How to Do Technical SEO Audits for Enterprise Sites in 2024")
- Each topic should target at least one keyword from the list or a closely related long-tail keyword
- Vary the content types (how-to, guide, listicle, case study, comparison)
- Include estimated word counts appropriate for the topic depth
- Provide a brief 3-5 point outline for each topic
- Explain why each topic will work for SEO
- Include 2-3 related/long-tail keywords per topic
- Return ONLY valid JSON`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  const result = await callAIAndParseJSON(messages, {
    preferredProvider,
    temperature: 0.7,
    maxTokens: 6000,
    jsonMode: true,
  })

  // Validate and sanitize the response
  if (!result.topics || !Array.isArray(result.topics)) {
    throw new Error('Invalid AI response: missing topics array')
  }

  // Ensure each topic has required fields
  const validatedTopics = result.topics.map((topic, index) => ({
    title: topic.title || `Topic ${index + 1}`,
    targetKeyword: topic.targetKeyword || targetKeywords[0] || niche.toLowerCase(),
    searchIntent: topic.searchIntent || 'informational',
    contentType: topic.contentType || 'blog post',
    difficulty: topic.difficulty || 'medium',
    estimatedWordCount: topic.estimatedWordCount || 1500,
    outline: Array.isArray(topic.outline) ? topic.outline.slice(0, 7) : [],
    whyItWorks: topic.whyItWorks || 'This topic addresses a common search query in your niche.',
    relatedKeywords: Array.isArray(topic.relatedKeywords) ? topic.relatedKeywords.slice(0, 5) : [],
  }))

  return {
    topics: validatedTopics,
    strategy: result.strategy || `Focus on creating comprehensive, keyword-optimized content for the ${niche} niche.`,
    generatedAt: new Date().toISOString(),
    inputParams: { niche, targetKeywords, audience, contentGoal, contentType, count },
  }
}

/**
 * Generate topic clusters for pillar content strategy
 * @param {Object} params - Input parameters
 * @returns {Promise<Object>} Topic clusters
 */
export async function generateTopicClusters({
  niche,
  mainKeyword,
  audience = '',
  preferredProvider,
  clusterCount = 5,
  topicsPerCluster = 4,
}) {
  const systemPrompt = `You are an expert SEO content strategist specializing in topic cluster / pillar page strategy. Generate a topic cluster structure for a pillar page.

Return JSON with this structure:
{
  "pillarPage": {
    "title": "Pillar page title targeting the main keyword",
    "mainKeyword": "primary keyword",
    "estimatedWordCount": 3000,
    "outline": ["H2: Chapter 1", "H2: Chapter 2", ...]
  },
  "clusters": [
    {
      "clusterName": "Cluster topic name",
      "focusKeyword": "cluster focus keyword",
      "searchIntent": "informational",
      "articles": [
        {
          "title": "Article title",
          "targetKeyword": "article keyword",
          "contentType": "how-to|guide|listicle|case-study",
          "estimatedWordCount": 1500,
          "outline": ["H2: Section 1", "H2: Section 2"],
          "whyItWorks": "Explanation"
        }
      ]
    }
  ],
  "interlinkingStrategy": "How to interlink pillar and cluster content"
`

  const userPrompt = `Create a topic cluster strategy for:

**Niche:** ${niche}
**Main Keyword (Pillar):** ${mainKeyword}
**Target Audience:** ${audience || 'General'}
**Number of Clusters:** ${clusterCount}
**Articles per Cluster:** ${topicsPerCluster}

Generate a comprehensive pillar page + ${clusterCount} topic clusters with ${topicsPerCluster} articles each. Focus on SEO-friendly structure with clear keyword targeting and interlinking opportunities.`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  return callAIAndParseJSON(messages, {
    preferredProvider,
    temperature: 0.6,
    maxTokens: 8000,
    jsonMode: true,
  })
}

/**
 * Generate content calendar from topics
 * @param {Object} params - Input parameters
 * @param {Array} params.topics - Array of topic objects from generateBlogTopics
 * @param {number} params.postsPerWeek - How many posts per week
 * @param {string} params.startDate - Start date (ISO string)
 * @returns {Object} Content calendar
 */
export function generateContentCalendar(topics, postsPerWeek = 2, startDate = new Date().toISOString()) {
  const start = new Date(startDate)
  const calendar = []

  topics.forEach((topic, index) => {
    const weekOffset = Math.floor(index / postsPerWeek)
    const dayOffset = (index % postsPerWeek) * 3 // Space posts 3 days apart
    const publishDate = new Date(start)
    publishDate.setDate(start.getDate() + weekOffset * 7 + dayOffset)

    calendar.push({
      ...topic,
      scheduledDate: publishDate.toISOString().split('T')[0],
      weekNumber: weekOffset + 1,
      status: 'planned',
    })
  })

  return {
    calendar,
    summary: {
      totalTopics: topics.length,
      weeksToComplete: Math.ceil(topics.length / postsPerWeek),
      postsPerWeek,
      startDate: start.toISOString().split('T')[0],
    },
  }
}
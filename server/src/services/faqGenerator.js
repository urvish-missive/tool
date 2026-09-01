import { callAIAndParseJSON } from '../utils/aiProvider.js'

/**
 * Generate FAQ questions and answers for a given topic
 */
export async function generateFAQs({ topic, targetKeywords, count = 8, preferredProvider }) {
  const keywordText = targetKeywords ? `Target keywords: ${targetKeywords}` : ''

  const systemMessage = 'You are an SEO expert specializing in creating FAQ content that ranks in featured snippets.'
  const userMessage = `Generate ${count} frequently asked questions (FAQs) about: "${topic}"
${keywordText}

Requirements:
- Questions should be common search queries people actually ask
- Include a mix of: what, how, why, when, where, which questions
- Questions should be specific enough to target featured snippets
- Each answer should be 40-80 words
- Answers should be informative, accurate, and helpful
- Use natural, conversational language
- Include the target keyword naturally in relevant answers

Return ONLY valid JSON:
{
  "faqs": [
    {
      "question": "What is [topic]?",
      "answer": "Clear, concise answer in 40-80 words...",
      "type": "what|how|why|when|where|which"
    }
  ]
}`

  try {
    const parsed = await callAIAndParseJSON([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ], { preferredProvider })

    return {
      success: true,
      topic,
      keywords: targetKeywords,
      faqs: parsed.faqs || [],
    }
  } catch (error) {
    console.error('FAQ generation error:', error.message)
    return generateFallbackFAQs(topic, targetKeywords, count)
  }
}

function generateFallbackFAQs(topic, keywords, count) {
  const keywordList = keywords
    ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [topic]

  const primaryKeyword = keywordList[0]
  const secondaryKeyword = keywordList[1] || ''

  const baseFAQs = [
    {
      question: `What is ${primaryKeyword}?`,
      answer: `${primaryKeyword} is a comprehensive solution that helps businesses and individuals achieve better results. It combines best practices with modern technology to deliver measurable outcomes.`,
      type: 'what',
    },
    {
      question: `How does ${primaryKeyword} work?`,
      answer: `${primaryKeyword} works by analyzing your specific needs and providing tailored solutions. The process involves understanding your goals, implementing strategies, and continuously optimizing for better results over time.`,
      type: 'how',
    },
    {
      question: `Why should I use ${primaryKeyword}?`,
      answer: `Using ${primaryKeyword} can significantly improve your efficiency and results. It saves time, reduces costs, and provides data-driven insights that help you make better decisions.`,
      type: 'why',
    },
    {
      question: `What are the main benefits of ${primaryKeyword}?`,
      answer: `The main benefits include increased productivity, cost savings, improved accuracy, and better decision-making capabilities. ${secondaryKeyword ? `It also helps with ${secondaryKeyword} by streamlining processes.` : ''}`,
      type: 'what',
    },
    {
      question: `How long does it take to see results from ${primaryKeyword}?`,
      answer: `Results from ${primaryKeyword} vary depending on your implementation. Most users see initial improvements within 2-4 weeks, with significant results appearing within 2-3 months of consistent use.`,
      type: 'how',
    },
    {
      question: `Is ${primaryKeyword} suitable for beginners?`,
      answer: `Yes, ${primaryKeyword} is designed to be user-friendly for beginners while still offering advanced features for experienced users. Comprehensive guidance is provided to help newcomers get started.`,
      type: 'what',
    },
    {
      question: `What industries benefit most from ${primaryKeyword}?`,
      answer: `${primaryKeyword} benefits a wide range of industries including technology, healthcare, finance, education, and e-commerce. Any business looking to improve efficiency can leverage its capabilities.`,
      type: 'which',
    },
    {
      question: `How do I get started with ${primaryKeyword}?`,
      answer: `To get started with ${primaryKeyword}, identify your specific goals and needs. Research best practices, gather necessary resources, and implement gradually. Consider consulting experts for personalized guidance.`,
      type: 'how',
    },
  ]

  return {
    success: true,
    topic,
    keywords: keywords,
    faqs: baseFAQs.slice(0, count),
  }
}

import { callAIAndParseJSON } from '../utils/aiProvider.js'

/**
 * Generate SEO-optimized FAQ questions and answers with Schema.org JSON-LD
 */
export async function generateFAQs({ topic, targetKeywords, count = 8, preferredProvider }) {
  const keywordText = targetKeywords ? `Target keywords: ${targetKeywords}` : ''

  const systemMessage = `You are a world-class SEO content specialist and Featured Snippet optimization expert.
Your job is to generate authoritative, search-intent matched FAQs structured to win Google Featured Snippets, People Also Ask (PAA) boxes, and AI Overview citations.

Rules:
1. Answers must be clear, direct, and fact-focused (40-75 words).
2. Start each answer with a direct answer or definition before expanding.
3. Categorize by search intent and question type accurately.
4. If a question is process-oriented, provide step-by-step or bulleted breakdown in bulletPoints.
5. Provide a valid Schema.org FAQPage JSON-LD object.
6. Return ONLY valid JSON, no markdown code blocks outside JSON.`

  const userMessage = `Generate ${count} highly optimized FAQs for the topic: "${topic}"
${keywordText}

Return a JSON object with this EXACT structure:
{
  "summary": "1-2 sentence recommendation on where to place these FAQs for maximum SEO impact",
  "faqs": [
    {
      "question": "Clear search-query style question?",
      "answer": "Direct, authoritative answer in 40-75 words without filler.",
      "type": "what|how|why|when|where|which|comparison|pricing|troubleshooting",
      "targetKeyword": "keyword mapped to this FAQ",
      "searchIntent": "informational|commercial|transactional",
      "snippetFormat": "paragraph|bullet_list|numbered_steps",
      "bulletPoints": ["Step or key point 1", "Step or key point 2", "Step or key point 3"]
    }
  ],
  "peopleAlsoAsk": [
    "Related PAA query 1",
    "Related PAA query 2",
    "Related PAA query 3"
  ]
}`

  try {
    const parsed = await callAIAndParseJSON([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ], { preferredProvider, temperature: 0.5, maxTokens: 4000 })

    const faqs = (parsed.faqs || []).map((faq, idx) => ({
      id: `faq-${idx + 1}`,
      question: faq.question || `Question about ${topic}`,
      answer: faq.answer || '',
      type: faq.type || 'what',
      targetKeyword: faq.targetKeyword || (targetKeywords ? targetKeywords.split(',')[0].trim() : topic),
      searchIntent: faq.searchIntent || 'informational',
      snippetFormat: faq.snippetFormat || 'paragraph',
      bulletPoints: Array.isArray(faq.bulletPoints) ? faq.bulletPoints : [],
    }))

    const schema = buildFaqSchema(topic, faqs)

    return {
      success: true,
      topic,
      keywords: targetKeywords,
      summary: parsed.summary || `Add these FAQs near the bottom of your ${topic} page or above the CTA to target featured snippets and resolve user objections.`,
      faqs,
      peopleAlsoAsk: Array.isArray(parsed.peopleAlsoAsk) ? parsed.peopleAlsoAsk : [],
      schema,
    }
  } catch (error) {
    console.error('FAQ generation error:', error.message)
    return generateFallbackFAQs(topic, targetKeywords, count)
  }
}

function buildFaqSchema(topic, faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer + (faq.bulletPoints?.length ? ` <ul>${faq.bulletPoints.map(b => `<li>${b}</li>`).join('')}</ul>` : ''),
      },
    })),
  }
}

function generateFallbackFAQs(topic, keywords, count) {
  const keywordList = keywords
    ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [topic]

  const primaryKeyword = keywordList[0] || topic
  const secondaryKeyword = keywordList[1] || `${primaryKeyword} best practices`

  const baseFAQs = [
    {
      id: 'faq-1',
      question: `What is ${primaryKeyword} and why does it matter?`,
      answer: `${primaryKeyword} refers to the systematic approach and strategic methodology used to achieve measurable results in your niche. It matters because it optimizes efficiency, reduces operational errors, and establishes long-term sustainable growth.`,
      type: 'what',
      targetKeyword: primaryKeyword,
      searchIntent: 'informational',
      snippetFormat: 'paragraph',
      bulletPoints: ['Improves workflow speed', 'Standardizes best practices', 'Delivers measurable ROI'],
    },
    {
      id: 'faq-2',
      question: `How does ${primaryKeyword} work step-by-step?`,
      answer: `${primaryKeyword} works by auditing current baseline performance, diagnosing friction points, implementing targeted solutions, and monitoring ongoing metrics for continuous improvement.`,
      type: 'how',
      targetKeyword: primaryKeyword,
      searchIntent: 'informational',
      snippetFormat: 'numbered_steps',
      bulletPoints: ['Step 1: Baseline Audit & Assessment', 'Step 2: Strategy Definition & Goal Setting', 'Step 3: Implementation & Execution', 'Step 4: Monitoring & Ongoing Optimization'],
    },
    {
      id: 'faq-3',
      question: `Why should businesses prioritize ${primaryKeyword}?`,
      answer: `Prioritizing ${primaryKeyword} enables organizations to outpace competitors, improve conversion rates, and build repeatable authority. It directly eliminates wasted spend and drives organic customer acquisition.`,
      type: 'why',
      targetKeyword: primaryKeyword,
      searchIntent: 'commercial',
      snippetFormat: 'paragraph',
      bulletPoints: ['Lowers cost per acquisition', 'Builds brand authority', 'Increases customer lifetime value'],
    },
    {
      id: 'faq-4',
      question: `What are the key benefits of using ${primaryKeyword}?`,
      answer: `The primary benefits include enhanced operational visibility, accelerated turnaround times, scalable consistency, and data-backed decision making across all related workflows.`,
      type: 'what',
      targetKeyword: secondaryKeyword,
      searchIntent: 'commercial',
      snippetFormat: 'bullet_list',
      bulletPoints: ['Measurable time savings', 'Higher conversion accuracy', 'Predictable scalability'],
    },
    {
      id: 'faq-5',
      question: `How long does it take to see tangible results from ${primaryKeyword}?`,
      answer: `Most implementations show initial indicator improvements within 14 to 30 days. Compounding organic gains and significant ROI typically materialize within 60 to 90 days of consistent execution.`,
      type: 'when',
      targetKeyword: primaryKeyword,
      searchIntent: 'informational',
      snippetFormat: 'paragraph',
      bulletPoints: ['Days 1-14: Initial setup & baseline', 'Days 15-30: Early metric improvements', 'Days 60-90: Full compounding ROI'],
    },
    {
      id: 'faq-6',
      question: `Which tools and methods work best with ${primaryKeyword}?`,
      answer: `The most effective methods combine automated analytics, structured checklists, and regular iterative reviews to ensure quality and prevent regression over time.`,
      type: 'which',
      targetKeyword: secondaryKeyword,
      searchIntent: 'commercial',
      snippetFormat: 'paragraph',
      bulletPoints: [],
    },
    {
      id: 'faq-7',
      question: `How much does implementing ${primaryKeyword} typically cost?`,
      answer: `Costs vary depending on scale and complexity. For small to mid-sized implementations, solutions range from self-serve automated platforms to specialized consultation packages tailored to organizational needs.`,
      type: 'pricing',
      targetKeyword: primaryKeyword,
      searchIntent: 'transactional',
      snippetFormat: 'paragraph',
      bulletPoints: [],
    },
    {
      id: 'faq-8',
      question: `How do I troubleshoot common mistakes in ${primaryKeyword}?`,
      answer: `Common issues usually stem from skipped audit phases or inconsistent execution. Resolve them by verifying data inputs, validating structured requirements, and maintaining standardized documentation.`,
      type: 'troubleshooting',
      targetKeyword: primaryKeyword,
      searchIntent: 'informational',
      snippetFormat: 'numbered_steps',
      bulletPoints: ['Audit input parameters', 'Re-check structured formatting', 'Monitor performance metrics'],
    },
  ]

  const faqs = baseFAQs.slice(0, count)
  return {
    success: true,
    topic,
    keywords,
    summary: `Incorporate these FAQs into your ${topic} content to capture Featured Snippets and resolve searcher questions before they bounce.`,
    faqs,
    peopleAlsoAsk: [
      `What is the best way to start with ${primaryKeyword}?`,
      `How does ${primaryKeyword} compare to alternatives?`,
      `Is ${primaryKeyword} worth the investment?`,
    ],
    schema: buildFaqSchema(topic, faqs),
  }
}

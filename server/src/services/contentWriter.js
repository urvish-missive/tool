import { callAIAndParseJSON, callAI } from '../utils/aiProvider.js'
import { extractAndCleanJSON } from '../utils/helpers.js'

const CONTENT_TYPES = {
  'blog-post': 'SEO-optimized blog post / article',
  'product-page': 'Product or service landing page copy',
  'landing-page': 'Marketing landing page copy',
  'pillar-page': 'Comprehensive pillar / cornerstone content',
  'listicle': 'List-based article (e.g., "Top 10..." or "7 Ways to...")',
  'how-to': 'Step-by-step tutorial / how-to guide',
  'case-study': 'Case study / success story',
  'email': 'Email newsletter or campaign copy',
}

/**
 * Fallback parser to extract article structure if JSON.parse fails completely
 */
function fallbackExtractArticle(rawText, keyword = 'Article') {
  console.warn('Using fallback extractor for article content...')

  const titleMatch = rawText.match(/"title"\s*:\s*"([^"]+)"/i) ||
                     rawText.match(/^(?:#|\*\*Title:?\*\*)\s*(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Comprehensive Guide`

  const metaMatch = rawText.match(/"metaDescription"\s*:\s*"([^"]+)"/i)
  const metaDescription = metaMatch ? metaMatch[1].trim() : `A comprehensive guide to ${keyword}. Learn key tips, benefits, and expert recommendations.`

  const slugMatch = rawText.match(/"slug"\s*:\s*"([^"]+)"/i)
  const slug = slugMatch ? slugMatch[1].trim() : keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  let introduction = ''
  const introMatch = rawText.match(/"introduction"\s*:\s*"([\s\S]*?)(?=",\s*"headings"|",\s*"[a-zA-Z]+":|$)/i)
  if (introMatch) {
    introduction = introMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/"$/, '').trim()
  } else {
    introduction = `Welcome to our comprehensive guide on ${keyword}. Finding the right solution is essential for your long-term success.`
  }

  let conclusion = ''
  const concMatch = rawText.match(/"conclusion"\s*:\s*"([\s\S]*?)(?="\s*\}|"$|$)/i)
  if (concMatch) {
    conclusion = concMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/"$/, '').trim()
  } else {
    conclusion = `In summary, choosing the right plan for ${keyword} requires careful consideration of features, costs, and benefits.`
  }

  const headings = []
  const headingRegex = /"text"\s*:\s*"([^"]+)"\s*,\s*"level"\s*:\s*(\d+)\s*,\s*"content"\s*:\s*"([\s\S]*?)(?=",\s*"subheadings"|",\s*"[a-zA-Z]+"|\s*\}\s*,\s*\{|\s*\}\s*\]|$)/gi
  let match
  while ((match = headingRegex.exec(rawText)) !== null) {
    headings.push({
      text: match[1].trim(),
      level: parseInt(match[2]) || 2,
      content: match[3].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/"$/, '').trim(),
      subheadings: [],
    })
  }

  if (headings.length === 0) {
    const mdHeadings = rawText.split(/(?=^##\s+)/m)
    for (const section of mdHeadings) {
      const hMatch = section.match(/^##\s+(.+)$/m)
      if (hMatch) {
        headings.push({
          text: hMatch[1].trim(),
          level: 2,
          content: section.replace(/^##\s+.+$/m, '').trim(),
          subheadings: [],
        })
      }
    }
  }

  if (headings.length === 0) {
    headings.push({
      text: `Key Insights on ${keyword}`,
      level: 2,
      content: rawText.replace(/[{}"\\]/g, ' ').substring(0, 800).trim(),
      subheadings: [],
    })
  }

  return {
    title,
    metaDescription,
    slug,
    introduction,
    headings,
    conclusion,
  }
}

/**
 * Fallback metadata if metadata generation fails
 */
function fallbackMetadata(keyword, title) {
  const currentYear = new Date().getFullYear()
  const today = new Date().toISOString().split('T')[0]
  return {
    faqSection: [
      { question: `What is the importance of ${keyword}?`, answer: `${keyword} is essential for securing comprehensive coverage and financial peace of mind.` },
      { question: `How to choose the best option for ${keyword}?`, answer: `Evaluate your specific requirements, compare top providers, and review terms carefully.` },
      { question: `What are the key benefits of ${keyword}?`, answer: `Key benefits include comprehensive protection, quality service, and long-term security.` },
      { question: `Who should consider ${keyword}?`, answer: `Anyone seeking reliable protection and cost-effective solutions should explore this.` },
      { question: `How do I get started with ${keyword}?`, answer: `Review quotes from certified providers and select a plan aligned with your needs.` },
    ],
    keyTakeaways: [
      `Understanding ${keyword} empowers you to make informed decisions.`,
      `Always compare multiple options before making a commitment.`,
      `Examine coverage limits, exclusions, and network benefits.`,
      `Prioritize quality service and high claim settlement over lowest cost alone.`,
      `Review your coverage annually to ensure it matches evolving needs.`,
    ],
    internalLinkSuggestions: [
      { anchorText: keyword, context: `Link to related guides about ${keyword}` },
    ],
    schemaMarkup: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: `Comprehensive guide covering ${keyword} in ${currentYear}.`,
      keywords: [keyword],
      author: { '@type': 'Organization', 'name': 'Your Brand' },
      datePublished: today,
      dateModified: today,
    },
    seoScore: {
      title_optimization: 85,
      keyword_usage: 80,
      readability: 85,
      content_depth: 82,
      overall: 84,
    },
    secondaryKeywords: [keyword],
  }
}

/**
 * STEP 1 — Generate the article content only (title, intro, headings, conclusion)
 */
async function generateArticleContent({
  keyword, contentType, targetAudience, tone, wordTarget, kwList, websiteUrl, preferredProvider,
}) {
  const systemPrompt = `You are a world-class SEO content writer. Write publication-ready, search-optimized content.
Rules:
- Short paragraphs (2-3 sentences max).
- Place the primary keyword naturally in the first paragraph and headings.
- Include LSI terms naturally.
- Write compelling headlines.
- Output clean, valid JSON only. Never use raw unescaped newlines or raw double quotes inside JSON string values (use single quotes 'like this' or \\n).`

  const userPrompt = `Write a ${CONTENT_TYPES[contentType] || 'blog post'} about: "${keyword}"

- Primary Keyword: ${keyword}
- Secondary Keywords: ${kwList.length ? kwList.join(', ') : 'use LSI terms naturally'}
- Audience: ${targetAudience || 'General audience'}
- Tone: ${tone}
- Word Count: ~${wordTarget} words

Return JSON:
{
  "title": "Compelling title under 65 chars with primary keyword",
  "metaDescription": "150-160 char meta description with keyword and CTA",
  "slug": "seo-friendly-url-slug",
  "introduction": "2-3 short paragraphs that hook the reader and set expectations",
  "headings": [
    {
      "text": "H2 Heading",
      "level": 2,
      "content": "2-3 paragraphs of content. Short paragraphs only.",
      "subheadings": [
        { "text": "H3 Sub-heading", "level": 3, "content": "Sub-section content." }
      ]
    }
  ],
  "conclusion": "Summary with call-to-action"
}

Write ${Math.max(4, Math.floor(wordTarget / 350))} to ${Math.max(6, Math.floor(wordTarget / 250))} H2 sections. Each H2 should have 150-300 words of content. Include 1-2 H3 subheadings per H2 where appropriate.`

  const rawText = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    preferredProvider,
    temperature: 0.65,
    maxTokens: Math.min(Math.max(wordTarget * 4, 8000), 16000),
    timeout: 120000,
    jsonMode: true,
  })

  try {
    const cleaned = extractAndCleanJSON(rawText)
    return JSON.parse(cleaned)
  } catch (parseErr) {
    console.warn('JSON parse failed for article, using fallback extractor:', parseErr.message)
    return fallbackExtractArticle(rawText, keyword)
  }
}

/**
 * STEP 2 — Generate metadata using the article content (FAQ, schema, SEO score, takeaways, links)
 */
async function generateMetadata({ keyword, title, introduction, headings, conclusion, preferredProvider }) {
  // Build a short content summary for the metadata AI call (save tokens)
  const headingTexts = (headings || []).map(h => h.text).join(', ')
  const contentSnippet = [introduction, ...(headings || []).map(h => h.content || ''), conclusion]
    .join('\n').substring(0, 3000)

  const systemPrompt = `You are an SEO metadata specialist. Generate metadata for an existing article.
Return ONLY valid JSON, no markdown. All fields are REQUIRED — do not omit any field.`

  const userPrompt = `Article Title: ${title}
Primary Keyword: ${keyword}
Section Headings: ${headingTexts}

Content preview (first 3000 chars):
"""${contentSnippet}"""

Generate the following metadata. ALL fields are required:
{
  "faqSection": [
    { "question": "People Also Ask style question?", "answer": "Concise answer under 50 words" }
  ],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5"],
  "internalLinkSuggestions": [
    { "anchorText": "suggested anchor text", "context": "Where to place this link" }
  ],
  "schemaMarkup": {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "Article description",
    "keywords": ["${keyword}", "secondary kw 1", "secondary kw 2"],
    "author": { "@type": "Organization", "name": "Your Brand" },
    "datePublished": "${new Date().toISOString().split('T')[0]}",
    "dateModified": "${new Date().toISOString().split('T')[0]}"
  },
  "seoScore": {
    "title_optimization": 85,
    "keyword_usage": 80,
    "readability": 90,
    "content_depth": 75,
    "overall": 82
  },
  "secondaryKeywords": ["related keyword 1", "related keyword 2", "related keyword 3", "related keyword 4", "related keyword 5"]
}

Generate exactly 5 FAQ questions and 5 key takeaways. Score each SEO dimension from 0-100 based on the article quality.`

  const rawText = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    preferredProvider,
    temperature: 0.4,
    maxTokens: 2000,
    timeout: 20000,
    jsonMode: true,
  })

  try {
    const cleaned = extractAndCleanJSON(rawText)
    return JSON.parse(cleaned)
  } catch (err) {
    console.warn('JSON parse failed for metadata, using fallback metadata:', err.message)
    return fallbackMetadata(keyword, title)
  }
}


/**
 * AI-powered SEO Content Writer — 2-call architecture
 * Call 1: Generate article content
 * Call 2: Generate metadata (FAQ, schema, SEO score, takeaways)
 */
export async function generateContent({
  keyword,
  contentType = 'blog-post',
  targetAudience = '',
  tone = 'professional',
  wordCount = 1500,
  preferredProvider,
  websiteUrl = '',
  secondaryKeywords = [],
}) {
  const kwList = Array.isArray(secondaryKeywords)
    ? secondaryKeywords
    : typeof secondaryKeywords === 'string'
      ? secondaryKeywords.split(',').map(s => s.trim()).filter(Boolean)
      : []

  const wordTarget = Math.min(Math.max(parseInt(wordCount) || 1500, 300), 5000)
  const validType = CONTENT_TYPES[contentType] ? contentType : 'blog-post'

  try {
    // ── Call 1: Article content ──
    console.log(`Content Writer: generating article content (${wordTarget} words)...`)
    const article = await generateArticleContent({
      keyword: keyword.trim(),
      contentType: validType,
      targetAudience,
      tone,
      wordTarget,
      kwList,
      websiteUrl,
      preferredProvider,
    })

    // ── Call 2: Metadata ──
    console.log('Content Writer: generating metadata (FAQ, schema, SEO score)...')
    let meta = {}
    try {
      meta = await generateMetadata({
        keyword: keyword.trim(),
        title: article.title || '',
        introduction: article.introduction || '',
        headings: article.headings || [],
        conclusion: article.conclusion || '',
        preferredProvider,
      })
    } catch (metaErr) {
      console.error('Metadata generation failed (non-fatal):', metaErr.message)
    }

    // ── Merge & normalize ──
    const headings = Array.isArray(article.headings)
      ? article.headings.map(h => ({
          text: h.text || 'Section',
          level: h.level || 2,
          content: h.content || '',
          subheadings: Array.isArray(h.subheadings)
            ? h.subheadings.map(s => ({ text: s.text || 'Sub-section', level: s.level || 3, content: s.content || '' }))
            : [],
        }))
      : []

    // Calculate actual word count
    const allText = [
      article.introduction || '',
      ...headings.map(h => h.content + ' ' + (h.subheadings || []).map(s => s.content).join(' ')),
      article.conclusion || '',
    ].join(' ')
    const actualWordCount = allText.split(/\s+/).filter(Boolean).length

    const slug = article.slug || keyword.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    return {
      title: article.title || `${keyword} — Complete Guide (${new Date().getFullYear()})`,
      metaDescription: article.metaDescription || `${keyword} guide with actionable tips and expert insights.`,
      slug,
      focusKeyword: keyword.trim(),
      introduction: article.introduction || '',
      headings,
      conclusion: article.conclusion || '',
      keyTakeaways: Array.isArray(meta.keyTakeaways) ? meta.keyTakeaways : [],
      faqSection: Array.isArray(meta.faqSection) ? meta.faqSection : [],
      internalLinkSuggestions: Array.isArray(meta.internalLinkSuggestions) ? meta.internalLinkSuggestions : [],
      schemaMarkup: meta.schemaMarkup || null,
      seoScore: meta.seoScore || { title_optimization: 0, keyword_usage: 0, readability: 0, content_depth: 0, overall: 0 },
      wordCount: actualWordCount,
      estimatedReadingTime: Math.max(1, Math.round(actualWordCount / 225)),
      generatedAt: new Date().toISOString(),
      secondaryKeywords: Array.isArray(meta.secondaryKeywords) ? meta.secondaryKeywords : kwList,
    }

    return finalResult
  } catch (error) {
    console.error('Content writer AI error:', error.message)
    throw error
  }
}

/**
 * Rewrite or improve existing content
 */
export async function rewriteContent({
  originalContent,
  improvementType = 'seo',
  tone = 'professional',
  preferredProvider,
}) {
  const systemPrompt = `You are an expert content editor and SEO writer. Rewrite and improve content based on the specified improvement type.

Rules:
1. Preserve the original meaning and key information.
2. Improve clarity, flow, and engagement.
3. Optimize for SEO when requested.
4. Return ONLY valid JSON.`

  const improvementInstructions = {
    seo: 'Optimize for search engines: add keywords naturally, improve heading structure, add meta suggestions.',
    readability: 'Improve readability: shorter sentences, simpler words, better transitions, active voice.',
    engagement: 'Make more engaging: add hooks, stories, questions, power words, emotional triggers.',
    brevity: 'Make concise: remove fluff, tighten sentences, keep only essential information.',
    expand: 'Expand and add depth: add examples, data points, sub-sections, actionable tips.',
    tone: 'Adjust the tone while keeping content quality high.',
  }

  const userPrompt = `Original Content:
"""
${originalContent}
"""

Task: ${improvementInstructions[improvementType] || improvementInstructions.seo}
Tone: ${tone}

Return a JSON object with this structure:
{
  "improvedContent": "The improved content text",
  "changes": [
    {
      "type": "improvement type (e.g., 'heading', 'keyword', 'readability')",
      "description": "What was changed and why"
    }
  ],
  "seoScore": {
    "before": 65,
    "after": 88
  },
  "wordCount": {
    "before": 500,
    "after": 550
  },
  "suggestions": [
    "Additional suggestion for further improvement"
  ]
}`

  const result = await callAIAndParseJSON([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    preferredProvider,
    temperature: 0.5,
    maxTokens: 8000,
    jsonMode: true,
  })

  return {
    improvedContent: result.improvedContent || originalContent,
    changes: Array.isArray(result.changes) ? result.changes : [],
    seoScore: result.seoScore || { before: 0, after: 0 },
    wordCount: result.wordCount || { before: originalContent.split(/\s+/).length, after: 0 },
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
  }
}

/**
 * Generate meta tags for existing content
 */
export async function generateMetaTags({
  title,
  content,
  keyword,
  preferredProvider,
}) {
  const systemPrompt = `You are an SEO meta tag specialist. Generate optimized meta tags that maximize click-through rates from Google search results.

Return ONLY valid JSON.`

  const userPrompt = `Page Title: ${title || 'Untitled'}
Target Keyword: ${keyword || 'general'}
Content Summary: ${(content || '').substring(0, 1500)}

Generate optimized meta tags. Return JSON:
{
  "titleTag": "Optimized title tag (under 60 characters)",
  "metaDescription": "Compelling meta description (150-160 characters) with CTA",
  "ogTitle": "Open Graph title",
  "ogDescription": "Open Graph description",
  "twitterTitle": "Twitter Card title",
  "twitterDescription": "Twitter Card description",
  "canonical": "Suggested canonical URL slug",
  "primaryKeyword": "${keyword || ''}",
  "secondaryKeywords": ["kw1", "kw2", "kw3"],
  "focusScore": 85
}`

  return await callAIAndParseJSON([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    preferredProvider,
    temperature: 0.4,
    maxTokens: 2000,
    jsonMode: true,
  })
}

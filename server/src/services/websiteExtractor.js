import * as cheerio from 'cheerio'
import { validateURL, resolveAndValidate, fetchWithTimeout, countWords } from '../utils/helpers.js'
import { callAIAndParseJSON } from '../utils/aiProvider.js'

const FETCH_TIMEOUT_MS = 15000
const MAX_CONTENT_LENGTH = 12000

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Upgrade-Insecure-Requests': '1',
}

/**
 * Fetch HTML securely with SSRF checks and timeout
 */
async function fetchPageHtml(targetUrl) {
  let urlToFetch = targetUrl.trim()
  if (!urlToFetch.startsWith('http://') && !urlToFetch.startsWith('https://')) {
    urlToFetch = `https://${urlToFetch}`
  }

  const parsed = validateURL(urlToFetch)
  await resolveAndValidate(parsed.hostname)

  const response = await fetchWithTimeout(
    parsed.href,
    {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
    },
    FETCH_TIMEOUT_MS
  )

  if (!response.ok) {
    throw new Error(`Website responded with HTTP status ${response.status} (${response.statusText})`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (
    contentType &&
    !contentType.includes('text/html') &&
    !contentType.includes('application/xhtml+xml') &&
    !contentType.includes('text/plain')
  ) {
    throw new Error(`Invalid content type "${contentType}". Only HTML web pages can be extracted.`)
  }

  const html = await response.text()
  if (!html || html.trim().length === 0) {
    throw new Error('Received empty HTML response from the website.')
  }

  return { html, finalUrl: response.url || parsed.href, hostname: parsed.hostname }
}

/**
 * Parse structured JSON-LD schemas
 */
function parseJsonLdSchemas($) {
  const schemas = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html()
      if (raw) {
        const parsed = JSON.parse(raw.trim())
        if (Array.isArray(parsed)) {
          schemas.push(...parsed)
        } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
          schemas.push(...parsed['@graph'])
        } else {
          schemas.push(parsed)
        }
      }
    } catch {
      // Ignore malformed JSON-LD script blocks
    }
  })

  // Discover specific entities
  let detectedOrganization = null
  let detectedPerson = null
  let detectedWebSite = null

  for (const s of schemas) {
    const type = s['@type']
    if (type === 'Organization' || type === 'Corporation' || type === 'LocalBusiness') {
      detectedOrganization = {
        name: s.name || s.legalName,
        url: s.url,
        logo: typeof s.logo === 'string' ? s.logo : s.logo?.url,
        founder: s.founder?.name || (typeof s.founder === 'string' ? s.founder : null),
        foundingDate: s.foundingDate,
        email: s.email,
        telephone: s.telephone,
        address: typeof s.address === 'string' ? s.address : s.address ? Object.values(s.address).filter(v => typeof v === 'string').join(', ') : null,
        socialProfiles: Array.isArray(s.sameAs) ? s.sameAs : s.sameAs ? [s.sameAs] : [],
      }
    }
    if (type === 'Person') {
      detectedPerson = {
        name: s.name,
        jobTitle: s.jobTitle,
        worksFor: s.worksFor?.name || (typeof s.worksFor === 'string' ? s.worksFor : null),
        url: s.url,
      }
    }
    if (type === 'WebSite') {
      detectedWebSite = {
        name: s.name || s.alternateName,
        url: s.url,
        publisher: s.publisher?.name || null,
      }
    }
  }

  return {
    rawCount: schemas.length,
    schemas: schemas.slice(0, 10), // keep top 10 for payload size
    detectedOrganization,
    detectedPerson,
    detectedWebSite,
  }
}

/**
 * Extract contact information, emails, phone numbers, and social links
 */
function extractContactsAndSocials($, html, hostname) {
  const emails = new Set()
  const phones = new Set()
  const socialLinks = {
    twitter: null,
    linkedin: null,
    github: null,
    youtube: null,
    facebook: null,
    instagram: null,
  }

  // 1. Mailto links
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const email = href.replace(/^mailto:/i, '').split('?')[0].trim()
    if (email && email.includes('@')) emails.add(email.toLowerCase())
  })

  // 2. Tel links
  $('a[href^="tel:"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const phone = href.replace(/^tel:/i, '').trim()
    if (phone && phone.length >= 7) phones.add(phone)
  })

  // 3. Regex scan for emails in text
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g
  const textContent = $('body').text()
  const matchedEmails = textContent.match(emailRegex) || []
  matchedEmails.forEach((e) => {
    const clean = e.trim().toLowerCase()
    // filter out common image/placeholder false positives
    if (!clean.endsWith('.png') && !clean.endsWith('.jpg') && !clean.endsWith('.webp') && !clean.includes('example.com') && !clean.includes('sentry.io')) {
      emails.add(clean)
    }
  })

  // 4. Social links from <a> tags
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (href.includes('twitter.com/') || href.includes('x.com/')) {
      if (!socialLinks.twitter && !href.includes('/share') && !href.includes('/intent')) socialLinks.twitter = href
    } else if (href.includes('linkedin.com/company/') || href.includes('linkedin.com/in/')) {
      if (!socialLinks.linkedin) socialLinks.linkedin = href
    } else if (href.includes('github.com/')) {
      if (!socialLinks.github && !href.includes('github.com/login')) socialLinks.github = href
    } else if (href.includes('youtube.com/') || href.includes('youtu.be/')) {
      if (!socialLinks.youtube) socialLinks.youtube = href
    } else if (href.includes('facebook.com/')) {
      if (!socialLinks.facebook && !href.includes('facebook.com/sharer')) socialLinks.facebook = href
    } else if (href.includes('instagram.com/')) {
      if (!socialLinks.instagram) socialLinks.instagram = href
    }
  })

  // 5. Detect copyright & ownership statement
  let copyright = null
  const copyrightRegex = /(?:©|&copy;|copyright)\s*(?:(?:19|20)\d{2}\s*[-–—]\s*)?(?:(?:19|20)\d{2})?\s*([A-Za-z0-9\s.,&'-]{2,80})/i
  const footerText = $('footer, [class*="footer"], [id*="footer"], small, p').text()
  const match = footerText.match(copyrightRegex)
  if (match) {
    copyright = match[0].trim().replace(/\s+/g, ' ')
  }

  return {
    emails: Array.from(emails).slice(0, 10),
    phones: Array.from(phones).slice(0, 10),
    socialLinks,
    copyright,
  }
}

/**
 * Extract clean readable text, markdown structure, and headings
 */
function extractContentAndStructure($, baseUrl) {
  // Clone body to manipulate without breaking original document
  const $body = cheerio.load($('body').html() || '')

  // Remove scripts, styles, navigations, footers, cookie notices, and ads
  $body(
    'script, style, noscript, iframe, svg, canvas, nav, header, footer, aside, [role="alert"], [aria-hidden="true"], .cookie-banner, #cookie-banner, .cookie-notice, .ads, .ad, .advertisement, [class*="cookie"], [id*="cookie"]'
  ).remove()

  // Extract headings
  const headings = []
  $('h1, h2, h3, h4').each((_, el) => {
    const tag = el.tagName.toLowerCase()
    const text = $(el).text().trim().replace(/\s+/g, ' ')
    if (text) {
      headings.push({
        level: tag,
        text,
      })
    }
  })

  // Build clean markdown representation
  const markdownLines = []
  $body('h1, h2, h3, h4, p, li, blockquote').each((_, el) => {
    const tag = el.tagName.toLowerCase()
    const text = $body(el).text().trim().replace(/\s+/g, ' ')
    if (!text) return

    if (tag === 'h1') {
      markdownLines.push(`\n# ${text}\n`)
    } else if (tag === 'h2') {
      markdownLines.push(`\n## ${text}\n`)
    } else if (tag === 'h3') {
      markdownLines.push(`\n### ${text}\n`)
    } else if (tag === 'h4') {
      markdownLines.push(`\n#### ${text}\n`)
    } else if (tag === 'li') {
      markdownLines.push(`- ${text}`)
    } else if (tag === 'blockquote') {
      markdownLines.push(`> ${text}`)
    } else {
      markdownLines.push(`${text}\n`)
    }
  })

  const markdown = markdownLines.join('\n').trim()
  const plainText = $body.text().replace(/\s+/g, ' ').trim()
  const wordCount = countWords(plainText)
  const charCount = plainText.length
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

  // Link analysis
  let internalLinksCount = 0
  let externalLinksCount = 0
  const sampleInternalLinks = []
  const sampleExternalLinks = []

  let baseHost = ''
  try {
    baseHost = new URL(baseUrl).hostname.replace(/^www\./, '')
  } catch {}

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim()
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return

    try {
      const resolved = new URL(href, baseUrl)
      const linkHost = resolved.hostname.replace(/^www\./, '')
      const linkItem = { text: $(el).text().trim() || resolved.pathname, href: resolved.href }

      if (linkHost === baseHost || linkHost.endsWith(`.${baseHost}`)) {
        internalLinksCount++
        if (sampleInternalLinks.length < 20) sampleInternalLinks.push(linkItem)
      } else {
        externalLinksCount++
        if (sampleExternalLinks.length < 20) sampleExternalLinks.push(linkItem)
      }
    } catch {}
  })

  // Images analysis
  const images = []
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src')
    const alt = $(el).attr('alt') || ''
    if (src && !src.startsWith('data:')) {
      try {
        const absoluteSrc = new URL(src, baseUrl).href
        images.push({ src: absoluteSrc, alt: alt.trim() })
      } catch {}
    }
  })

  const imagesWithAlt = images.filter((img) => img.alt.length > 0).length
  const imagesWithoutAlt = images.length - imagesWithAlt

  return {
    markdown,
    plainText: plainText.substring(0, MAX_CONTENT_LENGTH),
    wordCount,
    charCount,
    readingTimeMinutes,
    headings,
    headingsCount: {
      h1: headings.filter((h) => h.level === 'h1').length,
      h2: headings.filter((h) => h.level === 'h2').length,
      h3: headings.filter((h) => h.level === 'h3').length,
      h4: headings.filter((h) => h.level === 'h4').length,
      total: headings.length,
    },
    links: {
      total: internalLinksCount + externalLinksCount,
      internal: internalLinksCount,
      external: externalLinksCount,
      sampleInternal: sampleInternalLinks,
      sampleExternal: sampleExternalLinks,
    },
    images: {
      total: images.length,
      withAlt: imagesWithAlt,
      withoutAlt: imagesWithoutAlt,
      samples: images.slice(0, 15),
    },
  }
}

/**
 * AI Synthesis of Website: Generates executive summary, entity & owner profile, trust signals, and suggested Q&As
 */
async function generateAIWebsiteOverview(extractedData, preferredProvider) {
  const contentSnippet = extractedData.content.plainText.substring(0, 7000)
  const metadata = extractedData.metadata
  const contacts = extractedData.contacts
  const jsonLd = extractedData.jsonLd

  const prompt = `You are a world-class Web Intelligence Analyst.
Analyze this extracted website content, metadata, schema, and contact clues to produce a comprehensive Entity & Content Intelligence Report.

## Target Website
URL: ${extractedData.url}
Title: ${metadata.title}
Meta Description: ${metadata.description}
Detected Author/Publisher: ${metadata.author || 'N/A'} / ${metadata.publisher || 'N/A'}
Copyright Statement: ${contacts.copyright || 'N/A'}
Emails Found: ${contacts.emails.join(', ') || 'None found'}
Phone Numbers: ${contacts.phones.join(', ') || 'None found'}
Social Handles: ${JSON.stringify(contacts.socialLinks)}
Schema.org Organization: ${JSON.stringify(jsonLd.detectedOrganization || {})}
Schema.org Person: ${JSON.stringify(jsonLd.detectedPerson || {})}

## Headings Structure
${extractedData.content.headings.slice(0, 15).map((h) => `${h.level.toUpperCase()}: ${h.text}`).join('\n')}

## Extracted Page Text
${contentSnippet}

---

Return ONLY a JSON object with this EXACT structure (no code fences, no markdown formatting outside JSON):
{
  "executiveSummary": "2-4 sentence concise executive summary of what this website/company does, their core purpose, and who they serve.",
  "detectedOwner": {
    "name": "Exact name of company, owner, or founder (e.g. 'Stripe, Inc.', 'Himani Kankaria', or 'Unknown')",
    "entityType": "Company|Individual|SaaS|Agency|Publisher|Ecommerce|Non-Profit|Unknown",
    "confidence": "High|Medium|Low",
    "evidence": "Specific evidence found on the page supporting this owner identity (e.g. copyright notice, JSON-LD schema, footer text)"
  },
  "businessModel": "Brief description of how this website operates or monetizes (e.g. 'Subscription SaaS with tiered pricing', 'Digital marketing consultancy', 'Ad-supported publication')",
  "targetAudience": "Who this website is primarily built for",
  "keyOfferings": [
    "Key service, product, or topic 1",
    "Key service, product, or topic 2",
    "Key service, product, or topic 3",
    "Key service, product, or topic 4"
  ],
  "toneAndSentiment": "Brief description of the communication tone (e.g. 'Professional, authoritative, data-driven B2B')",
  "trustScore": 75,
  "trustSignals": [
    "Clear copyright and registered corporate entity identified",
    "Direct contact channel and social media profiles provided"
  ],
  "suggestedQuestions": [
    "Who is the owner / founder / team behind this website?",
    "What specific products or services do they offer?",
    "What are their pricing models or service packages?",
    "Where is this company located and how can I contact them?",
    "What are the main case studies or proof of work listed?"
  ]
}`

  try {
    const result = await callAIAndParseJSON(
      [
        {
          role: 'system',
          content:
            'You are an expert web intelligence analyst. Analyze web content strictly based on evidence. Output raw valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      {
        preferredProvider,
        temperature: 0.2,
        maxTokens: 1500,
      }
    )
    return result
  } catch (err) {
    console.warn('AI Website Overview failed (using fallback):', err.message)
    // Fallback deterministic summary
    const inferredOwner =
      jsonLd.detectedOrganization?.name ||
      jsonLd.detectedPerson?.name ||
      metadata.author ||
      (contacts.copyright ? contacts.copyright.replace(/©|\d{4}|All rights reserved/gi, '').trim() : null) ||
      extractedData.hostname

    return {
      executiveSummary: `${metadata.title || extractedData.hostname} is a website providing ${metadata.description || 'web content and digital services'}.`,
      detectedOwner: {
        name: inferredOwner || 'Website Operator',
        entityType: 'Company',
        confidence: inferredOwner ? 'Medium' : 'Low',
        evidence: contacts.copyright ? `Found in copyright notice: "${contacts.copyright}"` : 'Inferred from website domain and metadata.',
      },
      businessModel: 'Digital web presence',
      targetAudience: 'General web visitors',
      keyOfferings: extractedData.content.headings.slice(0, 4).map((h) => h.text),
      toneAndSentiment: 'Informative',
      trustScore: contacts.emails.length > 0 || contacts.copyright ? 70 : 50,
      trustSignals: [
        contacts.copyright ? 'Copyright notice present' : null,
        contacts.emails.length ? 'Direct email address listed' : null,
        jsonLd.detectedOrganization ? 'JSON-LD schema found' : null,
      ].filter(Boolean),
      suggestedQuestions: [
        'Who is the owner or founder of this website?',
        'What does this company do?',
        'What are their main services or products?',
        'How can I get in touch with their team?',
      ],
    }
  }
}

/**
 * Main Extract Website Content function
 */
export async function extractWebsiteContent(targetUrl, options = {}) {
  const { preferredProvider, extractAIOverview = true } = options

  // Step 1: Fetch HTML
  const { html, finalUrl, hostname } = await fetchPageHtml(targetUrl)
  const $ = cheerio.load(html)

  // Step 2: Extract Metadata
  const title =
    $('title').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('meta[name="twitter:title"]').attr('content')?.trim() ||
    ''

  const description =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    $('meta[name="twitter:description"]').attr('content')?.trim() ||
    ''

  const keywords = $('meta[name="keywords"]').attr('content')?.trim() || ''
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() || ''
  const language = $('html').attr('lang')?.trim() || 'en'
  const robots = $('meta[name="robots"]').attr('content')?.trim() || 'index, follow'
  const author = $('meta[name="author"]').attr('content')?.trim() || $('meta[property="article:author"]').attr('content')?.trim() || ''
  const publisher = $('meta[property="article:publisher"]').attr('content')?.trim() || ''

  // Favicon
  let favicon =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    $('link[rel="apple-touch-icon"]').attr('href') ||
    '/favicon.ico'
  try {
    favicon = new URL(favicon, finalUrl).href
  } catch {}

  // Open Graph & Twitter
  const og = {
    title: $('meta[property="og:title"]').attr('content') || title,
    description: $('meta[property="og:description"]').attr('content') || description,
    image: $('meta[property="og:image"]').attr('content') || '',
    type: $('meta[property="og:type"]').attr('content') || 'website',
    siteName: $('meta[property="og:site_name"]').attr('content') || '',
    url: $('meta[property="og:url"]').attr('content') || finalUrl,
  }
  if (og.image && !og.image.startsWith('http')) {
    try {
      og.image = new URL(og.image, finalUrl).href
    } catch {}
  }

  const twitter = {
    card: $('meta[name="twitter:card"]').attr('content') || 'summary',
    title: $('meta[name="twitter:title"]').attr('content') || og.title,
    description: $('meta[name="twitter:description"]').attr('content') || og.description,
    image: $('meta[name="twitter:image"]').attr('content') || og.image,
  }

  // Step 3: Structured Data JSON-LD
  const jsonLd = parseJsonLdSchemas($)

  // Step 4: Contacts & Socials
  const contacts = extractContactsAndSocials($, html, hostname)

  // Step 5: Content, Markdown, Headings & Stats
  const content = extractContentAndStructure($, finalUrl)

  const extractedData = {
    url: finalUrl,
    hostname,
    timestamp: new Date().toISOString(),
    metadata: {
      title,
      description,
      keywords,
      canonical,
      language,
      robots,
      author,
      publisher,
      favicon,
      og,
      twitter,
    },
    jsonLd,
    contacts,
    content,
  }

  // Step 6: Generate AI Intelligence & Entity Overview
  let aiOverview = null
  if (extractAIOverview) {
    aiOverview = await generateAIWebsiteOverview(extractedData, preferredProvider)
  }

  return {
    ...extractedData,
    aiOverview,
  }
}

/**
 * Grounded AI Q&A over extracted website content
 */
export async function askWebsiteQuestion({ url, question, extractedData, chatHistory = [], preferredProvider }) {
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new Error('A valid question string is required.')
  }

  const cleanQuestion = question.trim()
  const contentSnippet = (extractedData?.content?.plainText || extractedData?.markdown || '').substring(0, 10000)
  const metadata = extractedData?.metadata || {}
  const contacts = extractedData?.contacts || {}
  const jsonLd = extractedData?.jsonLd || {}
  const aiOverview = extractedData?.aiOverview || {}

  // Format previous dialogue
  const formattedHistory = (chatHistory || [])
    .slice(-4)
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n')

  const systemPrompt = `You are a knowledgeable and fact-grounded Web Intelligence Assistant.
Your mission is to answer user questions about the specific website provided below, strictly adhering to truth, transparency, and the extracted page evidence.

Rules:
1. Ground every statement in the provided extracted website content, metadata, schema, or contact signals.
2. If the user asks "who is the owner / founder / company behind this website":
   - Reference the detected owner, copyright notice, JSON-LD schema, author tags, or site name.
   - Quote the exact evidence (e.g. copyright statement or schema snippet).
   - If the site does NOT explicitly state the person or company owner, explicitly say: "The website does not explicitly name an individual owner, but lists [company/copyright/domain clues]."
3. Quote relevant sentences from the page whenever possible to provide proof.
4. If the question asks for information NOT present anywhere on the page, honestly admit that the website content does not mention it, and share what related facts are available.
5. Format your answers clearly using clean GitHub-flavored markdown (bolding, lists, quote blocks).
6. Return ONLY a valid JSON object matching the required schema.`

  const userPrompt = `## Target Website Details
URL: ${url || extractedData?.url}
Title: ${metadata.title || 'N/A'}
Description: ${metadata.description || 'N/A'}
Detected Owner/Entity: ${JSON.stringify(aiOverview?.detectedOwner || {})}
Copyright Statement: ${contacts.copyright || 'N/A'}
Contact Emails: ${contacts.emails?.join(', ') || 'None found'}
Phone Numbers: ${contacts.phones?.join(', ') || 'None found'}
Social Profiles: ${JSON.stringify(contacts.socialLinks || {})}
Schema Organization: ${JSON.stringify(jsonLd.detectedOrganization || {})}
Schema Person: ${JSON.stringify(jsonLd.detectedPerson || {})}

## Extracted Website Text & Headings
${contentSnippet}

${formattedHistory ? `## Conversation Context\n${formattedHistory}\n` : ''}
## User Question
"${cleanQuestion}"

---

Respond with ONLY this JSON structure:
{
  "answer": "Comprehensive, direct, and well-formatted markdown answer answering the user question based on the website content.",
  "confidence": "High|Medium|Low",
  "evidenceQuotes": [
    "Exact verbatim quote or sentence from the website supporting this answer"
  ],
  "sourceSection": "Where this was found (e.g. 'Copyright & Footer', 'About Us Section', 'Pricing Table', 'JSON-LD Schema', 'Header / Hero')",
  "followUpQuestions": [
    "Suggested logical follow-up question 1",
    "Suggested logical follow-up question 2",
    "Suggested logical follow-up question 3"
  ]
}`

  try {
    const response = await callAIAndParseJSON(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        preferredProvider,
        temperature: 0.3,
        maxTokens: 1800,
      }
    )

    return {
      question: cleanQuestion,
      answer: response.answer || 'No answer generated.',
      confidence: response.confidence || 'Medium',
      evidenceQuotes: Array.isArray(response.evidenceQuotes) ? response.evidenceQuotes : [],
      sourceSection: response.sourceSection || 'Website Content',
      followUpQuestions: Array.isArray(response.followUpQuestions) ? response.followUpQuestions : [],
      timestamp: new Date().toISOString(),
    }
  } catch (err) {
    console.error('askWebsiteQuestion AI failed:', err.message)
    throw new Error(`AI analysis failed: ${err.message}`)
  }
}

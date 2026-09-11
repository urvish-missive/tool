import { callAIAndParseJSON } from '../utils/aiProvider.js'

/**
 * Safely fetch HTML with timeout
 */
async function fetchHTML(url, timeoutMs = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    const response = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    clearTimeout(timer)
    if (!response.ok) return null
    return await response.text()
  } catch (e) {
    clearTimeout(timer)
    return null
  }
}

/**
 * Extract business-relevant signals from HTML
 */
function extractBusinessSignals(html, url) {
  if (!html) {
    return {
      url,
      title: 'N/A',
      metaDescription: 'N/A',
      aboutText: 'N/A',
      products: [],
      services: [],
      socialLinks: [],
      phone: 'N/A',
      email: 'N/A',
      address: 'N/A',
      employees: 'N/A',
      founded: 'N/A',
      fundingInfo: 'N/A',
      techStack: [],
      structuredData: [],
      pressMentions: [],
      wordCount: 'N/A',
      hasAboutPage: false,
      hasProductsPage: false,
      hasPricingPage: false,
      hasCareersPage: false,
      hasCaseStudiesPage: false,
    }
  }

  // Title & meta
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
  const metaDescription = descMatch ? descMatch[1].trim() : ''

  // Contact info
  const phoneMatch = html.match(/(?:tel:|phone|mobile|call\s*us)[\s:]*([+\d\s\-().]{7,20})/i)
  const phone = phoneMatch ? phoneMatch[1].trim() : ''

  const emailMatch = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  const email = emailMatch ? emailMatch[1] : ''

  const addressMatch = html.match(/(?:address|location|office)[\s:]*([^<]{10,200})/i)
  const address = addressMatch ? addressMatch[1].trim() : ''

  // Social links
  const socialPatterns = [
    { name: 'LinkedIn', pattern: /linkedin\.com\/(?:company|in)\/([^/"'\s]+)/i },
    { name: 'Twitter', pattern: /(?:twitter\.com|x\.com)\/([^/"'\s]+)/i },
    { name: 'Facebook', pattern: /facebook\.com\/([^/"'\s]+)/i },
    { name: 'Instagram', pattern: /instagram\.com\/([^/"'\s]+)/i },
    { name: 'YouTube', pattern: /youtube\.com\/(?:channel\/|@)([^/"'\s]+)/i },
  ]
  const socialLinks = socialPatterns
    .map(s => {
      const match = html.match(s.pattern)
      return match ? { platform: s.name, handle: match[1] } : null
    })
    .filter(Boolean)

  // Navigation pages detection
  const lowerHtml = html.toLowerCase()
  const hasAboutPage = /["']\/about|about\s*us/i.test(html)
  const hasProductsPage = /["']\/products|["']\/services|our\s*products/i.test(html)
  const hasPricingPage = /["']\/pricing|plans?\s*&\s*pricing/i.test(html)
  const hasCareersPage = /["']\/careers|["']\/jobs|join\s*our\s*team/i.test(html)
  const hasCaseStudiesPage = /["']\/case-stud|["']\/portfolio|client\s*success/i.test(html)

  // Products / Services extraction from nav and headings
  const productKeywords = ['product', 'service', 'solution', 'platform', 'software', 'tool', 'plan', 'pricing']
  const navLinks = html.match(/<a[^>]*href=["'][^"']*["'][^>]*>([^<]+)<\/a>/gi) || []
  const products = []
  navLinks.forEach(link => {
    const text = link.replace(/<[^>]+>/g, '').trim()
    if (text.length > 2 && text.length < 80 && productKeywords.some(k => text.toLowerCase().includes(k))) {
      if (!products.includes(text)) products.push(text)
    }
  })

  // Tech stack detection
  const techPatterns = [
    /react|next\.?js|vue|angular|svelte/i,
    /wordpress|shopify|wix|squarespace|webflow/i,
    /aws|google cloud|azure|heroku|netlify|vercel/i,
    /hubspot|salesforce|marketo|intercom|zendesk/i,
    /google analytics|gtm|segment|mixpanel|amplitude/i,
    /stripe|paypal|razorpay/i,
  ]
  const techStack = []
  const techNames = ['Frontend Framework', 'CMS/Platform', 'Cloud/Hosting', 'CRM/Support', 'Analytics', 'Payment']
  techPatterns.forEach((pattern, i) => {
    if (pattern.test(html)) techStack.push(techNames[i])
  })

  // Structured data / JSON-LD
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
  const structuredData = jsonLdMatches.map(m => {
    try {
      const content = m.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
      const parsed = JSON.parse(content)
      return parsed['@type'] || 'Unknown'
    } catch { return 'Unknown' }
  }).filter(Boolean)

  // Employee count from structured data
  const empMatch = html.match(/(?:employee|team\s*size|workforce)[^<]*?(\d+[\d,]*)/i)
  const employees = empMatch ? empMatch[1].replace(/,/g, '') : ''

  // Founded year
  const foundedMatch = html.match(/(?:founded|established|since|est\.?)\s*(\d{4})/i)
  const founded = foundedMatch ? foundedMatch[1] : ''

  // Word count
  const textContent = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length

  // Extract text snippets about the company (first 2000 chars of body text)
  const aboutText = textContent.substring(0, 2000)

  return {
    url,
    title,
    metaDescription,
    aboutText,
    products,
    services: products,
    socialLinks,
    phone,
    email,
    address,
    employees,
    founded,
    techStack,
    structuredData,
    wordCount,
    hasAboutPage,
    hasProductsPage,
    hasPricingPage,
    hasCareersPage,
    hasCaseStudiesPage,
  }
}

/**
 * Main analysis function
 */
export async function analyzeBusinessCompetitor({ competitorUrl, companyName, industry, preferredProvider }) {
  try {
    const html = await fetchHTML(competitorUrl)
    const signals = extractBusinessSignals(html, competitorUrl)

    // Generate AI-powered business intelligence
    const intelligence = await generateBusinessIntelligence({
      competitorUrl,
      companyName,
      industry,
      signals,
      preferredProvider,
    })

    const result = {
      success: true,
      competitorUrl,
      companyName: companyName || signals.title || 'Unknown',
      industry: industry || 'General',
      signals,
      ...intelligence,
    }

    return result
  } catch (error) {
    console.error('Business competitor analysis error:', error.message)
    return generateFallbackAnalysis(competitorUrl, companyName, industry)
  }
}

async function generateBusinessIntelligence({ competitorUrl, companyName, industry, signals, preferredProvider }) {
  const industryContext = industry ? `Industry: ${industry}` : ''

  const systemMessage = `You are a senior business intelligence analyst specializing in competitor research and market analysis.
Your job is to analyze a competitor company and provide comprehensive business intelligence including history, products, market position, strategies, and competitive landscape.

Rules:
- Be specific, data-driven, and actionable.
- Provide concrete details, not generic statements.
- If you don't know something with certainty, say "likely" or "estimated" rather than fabricating.
- Return ONLY valid JSON, no markdown outside JSON.`

  const userMessage = `Analyze this competitor company:

Company: ${companyName || signals.title}
Website: ${competitorUrl}
${industryContext}
Title Tag: ${signals.title}
Meta Description: ${signals.metaDescription}
Social Profiles: ${signals.socialLinks.map(s => `${s.platform}: ${s.handle}`).join(', ') || 'None detected'}
Tech Stack Detected: ${signals.techStack.join(', ') || 'Unknown'}
Products/Services Found: ${signals.products.join(', ') || 'None detected'}
Structured Data Types: ${signals.structuredData.join(', ') || 'None'}
Employee Count: ${signals.employees || 'Unknown'}
Founded: ${signals.founded || 'Unknown'}
Has About Page: ${signals.hasAboutPage}
Has Products/Services Page: ${signals.hasProductsPage}
Has Pricing Page: ${signals.hasPricingPage}
Has Careers Page: ${signals.hasCareersPage}
Has Case Studies: ${signals.hasCaseStudiesPage}
Phone: ${signals.phone || 'Not found'}
Email: ${signals.email || 'Not found'}
Address: ${signals.address || 'Not found'}

Page Content Summary (first 2000 words):
${signals.aboutText.substring(0, 2000)}

Return a JSON object with this EXACT structure:
{
  "executiveSummary": "2-3 sentences about who this company is, what they do, and their market position",
  "companyProfile": {
    "name": "Company legal/brand name",
    "tagline": "Their main value proposition or tagline",
    "founded": "Year founded or estimated",
    "headquarters": "Location",
    "employeeCount": "Estimated employee range",
    "industry": "Primary industry/sector",
    "companyType": "B2B/B2C/D2C/Marketplace/etc"
  },
  "businessHistory": {
    "foundingStory": "How and why the company was founded",
    "keyMilestones": [
      { "year": "2020", "event": "Key milestone description" }
    ],
    "recentNews": [
      { "headline": "Recent news headline", "date": "Approximate date", "significance": "Why this matters" }
    ]
  },
  "mergersAcquisitions": [
    { "deal": "Description of M&A activity", "year": "Year", "impact": "Strategic impact" }
  ],
  "productsServices": {
    "overview": "Summary of their product/service portfolio",
    "categories": [
      {
        "name": "Product category name",
        "items": ["Product 1", "Product 2"],
        "pricing": "Pricing model or range if known",
        "targetMarket": "Who buys this"
      }
    ]
  },
  "marketPosition": {
    "marketCap": "Estimated revenue range or market cap if public",
    "marketShare": "Estimated market share or ranking",
    "competitiveAdvantage": "Their main moat or advantage",
    "positioning": "How they position themselves vs competitors"
  },
  "similarBusinesses": [
    {
      "name": "Competitor name",
      "website": "URL if known",
      "relationship": "Direct competitor / Adjacent / Alternative",
      "differentiation": "How this competitor differs"
    }
  ],
  "marketingStrategy": {
    "channels": ["Primary marketing channels they use"],
    "contentStrategy": "How they create and distribute content",
    "brandVoice": "Tone and style of their messaging",
    "leadGeneration": "How they attract and convert leads",
    "socialPresence": "Strength and strategy on social media",
    "notableCampaigns": ["Any memorable campaigns or messaging"]
  },
  "salesStrategy": {
    "model": "Sales model (self-serve, inside sales, field sales, channel, etc)",
    "pricingStrategy": "How they price (freemium, tiered, usage-based, enterprise, etc)",
    "salesCycle": "Estimated sales cycle length",
    "targetBuyer": "Who is the decision maker",
    "objections": ["Common objections or challenges buyers mention"],
    "competitivePositioning": "How they handle competitor comparisons"
  },
  "strengths": [
    "Key strength 1",
    "Key strength 2"
  ],
  "weaknesses": [
    "Key weakness or vulnerability 1",
    "Key weakness or vulnerability 2"
  ],
  "opportunities": [
    "Opportunity to compete against them 1",
    "Opportunity to compete against them 2"
  ]
}`

  try {
    const parsed = await callAIAndParseJSON([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ], { preferredProvider, temperature: 0.3, maxTokens: 4000 })

    return {
      executiveSummary: parsed.executiveSummary || 'Business analysis completed.',
      companyProfile: parsed.companyProfile || {},
      businessHistory: parsed.businessHistory || {},
      mergersAcquisitions: Array.isArray(parsed.mergersAcquisitions) ? parsed.mergersAcquisitions : [],
      productsServices: parsed.productsServices || {},
      marketPosition: parsed.marketPosition || {},
      similarBusinesses: Array.isArray(parsed.similarBusinesses) ? parsed.similarBusinesses : [],
      marketingStrategy: parsed.marketingStrategy || {},
      salesStrategy: parsed.salesStrategy || {},
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
    }
  } catch (err) {
    console.error('AI Business Intelligence error:', err.message)
    return generateFallbackIntelligence(signals, companyName, industry)
  }
}

function generateFallbackIntelligence(signals, companyName, industry) {
  return {
    executiveSummary: `${companyName || signals.title || 'This company'} operates in the ${industry || 'technology'} space. They have ${signals.products.length > 0 ? signals.products.length + ' products/services listed' : 'a product/service offering'} and maintain ${signals.socialLinks.length} social media presence. The website has ${signals.wordCount} words of content across key pages.`,
    companyProfile: {
      name: companyName || signals.title || 'N/A',
      tagline: signals.metaDescription || 'N/A',
      founded: signals.founded || 'N/A',
      headquarters: signals.address || 'N/A',
      employeeCount: signals.employees || 'N/A',
      industry: industry || 'N/A',
      companyType: 'N/A',
    },
    businessHistory: {
      foundingStory: 'N/A',
      keyMilestones: signals.founded && signals.founded !== 'N/A' ? [{ year: signals.founded, event: 'Company founded' }] : [],
      recentNews: [],
    },
    mergersAcquisitions: [],
    productsServices: {
      overview: signals.products.length > 0 ? `Offers: ${signals.products.join(', ')}` : 'N/A',
      categories: signals.products.length > 0 ? [{
        name: 'Main Offerings',
        items: signals.products,
        pricing: signals.hasPricingPage ? 'Pricing page detected — visit for details' : 'Not publicly listed',
        targetMarket: 'N/A',
      }] : [],
    },
    marketPosition: {
      marketCap: 'Private company — revenue data not publicly available',
      marketShare: 'N/A',
      competitiveAdvantage: signals.hasCaseStudiesPage ? 'Has case studies suggesting proven results' : 'N/A',
      positioning: 'N/A',
    },
    similarBusinesses: [],
    marketingStrategy: {
      channels: signals.socialLinks.map(s => s.platform),
      contentStrategy: typeof signals.wordCount === 'number' ? (signals.wordCount > 1000 ? 'Has substantial website content' : 'Minimal web content') : 'N/A',
      brandVoice: 'N/A',
      leadGeneration: signals.hasPricingPage ? 'Likely uses pricing page for conversion' : 'Standard website contact form',
      socialPresence: signals.socialLinks.length > 3 ? 'Strong social presence' : signals.socialLinks.length > 0 ? 'Moderate social presence' : 'Minimal social presence',
      notableCampaigns: [],
    },
    salesStrategy: {
      model: 'N/A',
      pricingStrategy: signals.hasPricingPage ? 'Transparent pricing (has pricing page)' : 'Contact for pricing',
      salesCycle: 'N/A',
      targetBuyer: 'N/A',
      objections: [],
      competitivePositioning: 'N/A',
    },
    strengths: [
      signals.hasAboutPage && signals.hasProductsPage && signals.hasPricingPage ? 'Comprehensive website with about, products, and pricing pages' : 'Has established web presence',
      signals.socialLinks.length > 2 ? 'Active multi-platform social media presence' : 'Has social media profiles',
      signals.structuredData.length > 0 ? 'Uses structured data markup (good for SEO)' : 'Basic SEO implementation',
    ],
    weaknesses: [
      !signals.hasPricingPage ? 'No transparent pricing page — may lose price-sensitive prospects' : null,
      signals.socialLinks.length < 2 ? 'Limited social media presence' : null,
      signals.wordCount < 500 ? 'Thin website content — opportunity to create more comprehensive content' : null,
    ].filter(Boolean),
    opportunities: [
      'Analyze their customer reviews for unmet needs',
      'Target keywords they rank for with better content',
      'Explore their pricing gaps if they lack transparent pricing',
    ],
  }
}

function generateFallbackAnalysis(competitorUrl, companyName, industry) {
  const signals = extractBusinessSignals(null, competitorUrl)
  const intelligence = generateFallbackIntelligence(signals, companyName, industry)
  return {
    success: true,
    competitorUrl,
    companyName: companyName || 'N/A',
    industry: industry || 'N/A',
    signals,
    ...intelligence,
  }
}

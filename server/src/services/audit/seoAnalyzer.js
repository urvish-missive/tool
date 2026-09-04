import { countSeverities, clampScore } from '../../utils/helpers.js'

const CATEGORY_WEIGHTS = {
  technical: 0.20,
  onPage: 0.20,
  performance: 0.15,
  content: 0.15,
  mobile: 0.10,
  structuredData: 0.08,
  links: 0.07,
  security: 0.05,
}

const THEME_DEFINITIONS = [
  {
    key: 'headings',
    id: 'topic-headings',
    title: 'Heading Hierarchy & Tag Structure (H1, H2, H3)',
    category: 'onpage',
    icon: '📑',
    description:
      'Proper heading hierarchy signals the primary topic (H1) and structured subtopics (H2/H3) to search crawlers, screen readers, and LLMs.',
    recommendation:
      'Ensure each page has exactly one primary H1 tag at the top of content reflecting main search intent, and organize sections under sequential H2 and H3 tags.',
    matcher: (iss) => /h1|heading/i.test(iss.title),
  },
  {
    key: 'titles',
    id: 'topic-titles',
    title: 'HTML Title Tags & Search Snippet Optimization',
    category: 'onpage',
    icon: '📄',
    description:
      'Title tags are the primary clickable link in Google search results and one of the highest weighted on-page ranking signals.',
    recommendation:
      'Write unique, descriptive title tags between 50-60 characters for every indexable page incorporating primary target keywords.',
    matcher: (iss) => /title/i.test(iss.title),
  },
  {
    key: 'descriptions',
    id: 'topic-descriptions',
    title: 'Meta Descriptions & Search Snippet Relevance',
    category: 'onpage',
    icon: '📝',
    description:
      'Meta descriptions communicate context in search snippets and directly influence organic click-through rate (CTR).',
    recommendation:
      'Craft unique 120-155 character meta descriptions highlighting value proposition and compelling calls-to-action.',
    matcher: (iss) => /description/i.test(iss.title),
  },
  {
    key: 'images',
    id: 'topic-images',
    title: 'Image Optimization & Descriptive ALT Text',
    category: 'onpage',
    icon: '🖼️',
    description:
      'ALT attributes are critical for visual search indexing (Google Images), web accessibility compliance, and image SEO contextual signals.',
    recommendation:
      'Add concise, descriptive alt text to all informational images. Use empty alt="" for purely decorative graphics.',
    matcher: (iss) => /image|alt text|alt attribute/i.test(iss.title),
  },
  {
    key: 'content',
    id: 'topic-content',
    title: 'Content Depth, Word Count & Topical Coverage',
    category: 'content',
    icon: '📊',
    description:
      'Search engines reward comprehensive, authoritative content that answers user questions in depth and avoids thin content flags.',
    recommendation:
      'Expand thin pages (<300 words) with thorough explanations, case studies, FAQ sections, and structured topical answers.',
    matcher: (iss) => /thin content|word count|cannibalization|content/i.test(iss.title) && !/render-blocking/i.test(iss.title),
  },
  {
    key: 'performance_assets',
    id: 'topic-assets',
    title: 'Render-Blocking Assets & JavaScript Payloads',
    category: 'performance',
    icon: '⚡',
    description:
      'Synchronous scripts in <head> and excessive JS bundles delay First Contentful Paint (FCP) and Largest Contentful Paint (LCP).',
    recommendation:
      'Add `defer` or `async` attributes to non-critical external scripts, eliminate unused JavaScript, and minify stylesheets.',
    matcher: (iss) => /render-blocking|javascript|css|payload|asset|pagespeed/i.test(iss.title),
  },
  {
    key: 'sitemaps_robots',
    id: 'topic-sitemaps',
    title: 'XML Sitemaps, Robots.txt & Crawl Directives',
    category: 'technical',
    icon: '🗺️',
    description:
      'Search bots require clean crawl paths via valid XML sitemaps and properly configured robots.txt directive files.',
    recommendation:
      'Ensure XML sitemaps and index variations are accessible, referenced in robots.txt, and submitted to Google Search Console.',
    matcher: (iss) => /sitemap|robots/i.test(iss.title),
  },
  {
    key: 'url_canonical',
    id: 'topic-urls',
    title: 'URL Structure, Canonicals & Duplicate Handling',
    category: 'technical',
    icon: '🔗',
    description:
      'Clean URL slugs and self-referencing canonical tags prevent duplicate content indexing and consolidate search ranking signals.',
    recommendation:
      'Use lowercase hyphenated URL slugs without dynamic session IDs and ensure canonical tags match preferred target URLs.',
    matcher: (iss) => /canonical|url structure|slug|http status/i.test(iss.title),
  },
  {
    key: 'mobile',
    id: 'topic-mobile',
    title: 'Mobile Usability & Viewport Configuration',
    category: 'mobile',
    icon: '📱',
    description:
      'Google uses mobile-first indexing; pages must configure responsive viewports and maintain touch accessibility without restricting zoom.',
    recommendation:
      'Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to all pages and avoid disabling user pinch-to-zoom.',
    matcher: (iss) => /mobile|viewport|zoom/i.test(iss.title),
  },
  {
    key: 'schema',
    id: 'topic-schema',
    title: 'Schema.org Structured Data & Rich Entities',
    category: 'schema',
    icon: '🏷️',
    description:
      'Schema.org JSON-LD structured data enables search engines to understand page entities and unlocks rich SERP features.',
    recommendation:
      'Deploy valid JSON-LD schemas (Organization, WebSite, Article/Product) to qualify for rich snippet enhancements in Google SERPs.',
    matcher: (iss) => /schema|json-ld|structured data/i.test(iss.title),
  },
  {
    key: 'links',
    id: 'topic-links',
    title: 'Internal Link Architecture & Link Equity Silos',
    category: 'links',
    icon: '🌐',
    description:
      'Internal linking distributes PageRank equity throughout topical clusters and guides search bots to deep priority pages.',
    recommendation:
      'Build contextual internal links between topically relevant pages using diverse, descriptive anchor text.',
    matcher: (iss) => /link equity|internal link|external link|anchor/i.test(iss.title),
  },
  {
    key: 'security',
    id: 'topic-security',
    title: 'HTTPS Encryption, SSL & Security Headers',
    category: 'security',
    icon: '🔒',
    description:
      'HTTPS is a confirmed Google ranking signal and essential for user security, preventing man-in-the-middle exploits.',
    recommendation:
      'Enforce HTTPS site-wide with 301 redirects and configure HTTP Strict Transport Security (HSTS) headers.',
    matcher: (iss) => /https|ssl|hsts|security/i.test(iss.title),
  },
]

const SEVERITY_WEIGHT = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 }

/**
 * Consolidates related raw findings into Unified Thematic Issue Cards
 * (e.g. all H1 and heading issues into ONE card, all title issues into ONE card).
 */
export function groupAndDeduplicateIssues(rawIssues) {
  const groupedThemes = new Map()

  rawIssues.forEach((issue) => {
    // Find matching theme definition
    const matchedTheme = THEME_DEFINITIONS.find((td) => td.matcher(issue)) || {
      key: (issue.category || 'technical') + '-' + issue.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      id: `topic-${(issue.category || 'general')}`,
      title: issue.title,
      category: issue.category || 'technical',
      icon: '🔍',
      description: issue.description || '',
      recommendation: issue.recommendation || '',
    }

    let affectedPages =
      issue.affectedPages ||
      (issue.affectedItems ? issue.affectedItems.map((i) => (typeof i === 'string' ? i : i.url)) : [])
    if ((!affectedPages || affectedPages.length === 0) && issue.url) {
      affectedPages = [issue.url]
    }

    let affectedItems = []
    if (Array.isArray(issue.affectedItems) && issue.affectedItems.length > 0) {
      affectedItems = issue.affectedItems.map((item) => {
        if (typeof item === 'string') return { url: item, evidence: issue.evidence || '', subTopic: issue.title }
        return {
          url: item.url || issue.url || 'Site-wide Analysis',
          evidence: item.evidence || issue.evidence || '',
          subTopic: issue.title,
        }
      })
    } else if (affectedPages && affectedPages.length > 0) {
      affectedItems = affectedPages.map((url) => ({
        url,
        evidence: issue.evidence || `Diagnostic check triggered on ${url}`,
        subTopic: issue.title,
      }))
    } else if (issue.evidence || issue.url) {
      affectedItems = [
        {
          url: issue.url || 'Site-wide Analysis',
          evidence: issue.evidence || 'Site-wide diagnostic check evaluation',
          subTopic: issue.title,
        },
      ]
    }

    const existing = groupedThemes.get(matchedTheme.key)

    if (existing) {
      // Upgrade severity if sub-issue is more severe
      if ((SEVERITY_WEIGHT[issue.severity] || 0) > (SEVERITY_WEIGHT[existing.severity] || 0)) {
        existing.severity = issue.severity
      }

      // Record sub-finding summary
      if (!existing.subFindings.some((sf) => sf.title === issue.title)) {
        existing.subFindings.push({
          title: issue.title,
          severity: issue.severity || 'MEDIUM',
          count: affectedPages.length || 1,
          detail: issue.description || '',
        })
      }

      // Merge affected pages and items
      const combinedPages = [...new Set([...existing.affectedPages, ...affectedPages])]
      const combinedItems = [...existing.affectedItems]
      affectedItems.forEach((item) => {
        if (!combinedItems.some((ci) => ci.url === item.url && ci.evidence === item.evidence && ci.subTopic === item.subTopic)) {
          combinedItems.push(item)
        }
      })
      existing.affectedPages = combinedPages
      existing.affectedItems = combinedItems
      existing.affectedCount = Math.max(combinedPages.length, 1)
    } else {
      groupedThemes.set(matchedTheme.key, {
        id: matchedTheme.id,
        key: matchedTheme.key,
        title: matchedTheme.title,
        category: matchedTheme.category,
        icon: matchedTheme.icon,
        severity: issue.severity || 'MEDIUM',
        description: matchedTheme.description || issue.description || '',
        recommendation: matchedTheme.recommendation || issue.recommendation || '',
        subFindings: [
          {
            title: issue.title,
            severity: issue.severity || 'MEDIUM',
            count: affectedPages.length || 1,
            detail: issue.description || '',
          },
        ],
        affectedCount: Math.max(affectedPages.length, 1),
        affectedPages,
        affectedItems,
      })
    }
  })

  // Sort by highest severity (CRITICAL > HIGH > MEDIUM > LOW > INFO)
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 }
  return [...groupedThemes.values()].sort(
    (a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5)
  )
}

/**
 * Calculates category score with detailed transparency reasoning (positive factors & deductions).
 */
function buildTransparentScore(name, baseScore, positiveFactors = [], deductions = [], weight = 0.1) {
  const finalScore = clampScore(baseScore)
  let status = 'Good'
  if (finalScore >= 80) status = 'Excellent'
  else if (finalScore >= 65) status = 'Good'
  else if (finalScore >= 45) status = 'Needs Improvement'
  else status = 'Critical'

  let whyThisScore = `${name} scored ${finalScore}/100 based on ${positiveFactors.length} verified best practice(s)`
  if (deductions.length > 0) {
    whyThisScore += ` with ${deductions.length} deduction(s) applied for identified issues.`
  } else {
    whyThisScore += ' with full compliance across standard audit checks.'
  }

  return {
    score: finalScore,
    status,
    whyThisScore,
    positiveFactors,
    deductions,
    weightPercent: Math.round(weight * 100),
    weightedContribution: Math.round(finalScore * weight),
  }
}

export function calculateScores(
  technicalResult,
  onpageResult,
  linkResult,
  schemaResult,
  crawlData,
  pageSpeedData = null
) {
  const rawIssues = [
    ...technicalResult.issues,
    ...onpageResult.issues,
    ...linkResult.issues,
    ...schemaResult.issues,
  ]

  const allIssues = groupAndDeduplicateIssues(rawIssues)
  const allSeverities = countSeverities(allIssues)

  // 1. Technical Score
  let techBase = 100
  const techPositives = []
  const techDeductions = []

  if (technicalResult.checks.sitemap?.pass) {
    techPositives.push(
      `+25 pts: Valid XML Sitemap detected (${crawlData.sitemapProbe?.totalDiscoveredUrls || 0} URLs indexed)`
    )
  } else {
    techBase -= 20
    techDeductions.push('-20 pts: Missing or inaccessible XML sitemap')
  }

  if (technicalResult.checks.robotsTxt?.pass) {
    techPositives.push('+20 pts: Robots.txt file active and accessible')
  } else {
    techBase -= 15
    techDeductions.push('-15 pts: Missing robots.txt file')
  }

  if (technicalResult.checks.canonical?.pass) {
    techPositives.push('+20 pts: Self-referencing canonical tags valid across all crawled pages')
  } else {
    const canonCount = technicalResult.checks.canonical?.detail || 'Canonical issues'
    techBase -= 15
    techDeductions.push(`-15 pts: ${canonCount}`)
  }

  if (technicalResult.checks.httpStatus?.pass) {
    techPositives.push('+20 pts: 100% clean HTTP 200 responses without 4xx/5xx errors')
  } else {
    techBase -= 25
    techDeductions.push('-25 pts: Server or client HTTP error responses detected')
  }

  if (technicalResult.checks.urlStructure?.pass) {
    techPositives.push('+15 pts: Clean SEO-friendly URL slug structure')
  } else {
    techBase -= 5
    techDeductions.push('-5 pts: Suboptimal URL structure, uppercase, or special characters')
  }

  const technicalScoreDetail = buildTransparentScore(
    'Technical SEO',
    techBase,
    techPositives,
    techDeductions,
    CATEGORY_WEIGHTS.technical
  )

  // 2. On-Page Score
  let onPageBase = 100
  const onPagePositives = []
  const onPageDeductions = []

  if (onpageResult.summary.missingTitles === 0) {
    onPagePositives.push('+25 pts: All pages contain title tags')
  } else {
    onPageBase -= onpageResult.summary.missingTitles * 25
    onPageDeductions.push(`-${onpageResult.summary.missingTitles * 25} pts: Missing title tag(s)`)
  }

  if (onpageResult.summary.missingDescriptions === 0) {
    onPagePositives.push('+20 pts: Meta descriptions present on all pages')
  } else {
    const descPen = Math.min(20, onpageResult.summary.missingDescriptions * 10)
    onPageBase -= descPen
    onPageDeductions.push(`-${descPen} pts: Missing meta description(s)`)
  }

  if (onpageResult.summary.missingH1 === 0 && onpageResult.summary.multipleH1 === 0) {
    onPagePositives.push('+25 pts: Clean single H1 heading hierarchy')
  } else {
    const h1Pen =
      Math.min(25, onpageResult.summary.missingH1 * 15 + onpageResult.summary.multipleH1 * 10)
    onPageBase -= h1Pen
    onPageDeductions.push(
      `-${h1Pen} pts: H1 heading issues (${onpageResult.summary.multipleH1} multi-H1, ${onpageResult.summary.missingH1} missing H1)`
    )
  }

  if (onpageResult.summary.imagesWithoutAlt === 0) {
    onPagePositives.push('+20 pts: All image assets contain descriptive ALT text')
  } else {
    const altPen = Math.min(15, onpageResult.summary.imagesWithoutAlt * 2)
    onPageBase -= altPen
    onPageDeductions.push(`-${altPen} pts: ${onpageResult.summary.imagesWithoutAlt} image(s) missing alt text`)
  }

  if (onpageResult.summary.duplicateTitles === 0) {
    onPagePositives.push('+10 pts: Unique titles across all crawled URLs')
  } else {
    onPageBase -= 10
    onPageDeductions.push('-10 pts: Duplicate title tags detected')
  }

  const onPageScoreDetail = buildTransparentScore(
    'On-Page SEO',
    onPageBase,
    onPagePositives,
    onPageDeductions,
    CATEGORY_WEIGHTS.onPage
  )

  // 3. Content Score
  let contentBase = 100
  const contentPositives = []
  const contentDeductions = []

  if (onpageResult.summary.thinContentPages === 0) {
    contentPositives.push('+60 pts: Adequate content depth (>300 words) across all pages')
  } else {
    const thinPen = Math.min(30, onpageResult.summary.thinContentPages * 10)
    contentBase -= thinPen
    contentDeductions.push(
      `-${thinPen} pts: ${onpageResult.summary.thinContentPages} thin content page(s) (<300 words)`
    )
  }

  if (onpageResult.summary.avgWordCount > 500) {
    contentPositives.push(`+40 pts: High average word count (${onpageResult.summary.avgWordCount} words/page)`)
  } else if (onpageResult.summary.avgWordCount > 250) {
    contentPositives.push(`+30 pts: Moderate average word count (${onpageResult.summary.avgWordCount} words/page)`)
  } else {
    contentBase -= 15
    contentDeductions.push(`-15 pts: Low average word count (${onpageResult.summary.avgWordCount} words/page)`)
  }

  const contentScoreDetail = buildTransparentScore(
    'Content Quality',
    contentBase,
    contentPositives,
    contentDeductions,
    CATEGORY_WEIGHTS.content
  )

  // 4. Performance Score
  let perfScore = 80
  const perfPositives = []
  const perfDeductions = []

  if (pageSpeedData?.mobile?.score) {
    perfScore = Math.round(
      (pageSpeedData.mobile.score + (pageSpeedData.desktop?.score || pageSpeedData.mobile.score)) / 2
    )
    perfPositives.push(
      `Google PageSpeed Score: ${pageSpeedData.mobile.score}/100 (Mobile), ${pageSpeedData.desktop?.score || pageSpeedData.mobile.score}/100 (Desktop)`
    )
  } else {
    perfPositives.push('Estimated performance based on HTML asset weights and response time')
  }

  if (technicalResult.checks.heavyAssets?.pass) {
    perfPositives.push('Efficient JavaScript & CSS bundling without render-blocking head scripts')
  } else {
    perfDeductions.push('Render-blocking scripts and heavy external assets in document <head>')
  }

  const performanceScoreDetail = buildTransparentScore(
    'Performance & PageSpeed',
    perfScore,
    perfPositives,
    perfDeductions,
    CATEGORY_WEIGHTS.performance
  )

  // 5. Mobile & Responsiveness Score
  let mobileBase = 100
  const mobilePositives = []
  const mobileDeductions = []

  if (technicalResult.checks.responsiveness?.pass) {
    mobilePositives.push('+70 pts: Mobile viewport tag correctly configured')
    mobilePositives.push('+30 pts: Pinch-to-zoom accessible on mobile devices')
  } else {
    mobileBase -= 40
    mobileDeductions.push('-40 pts: Viewport configuration issues or zoom restrictions')
  }

  const mobileScoreDetail = buildTransparentScore(
    'Mobile Usability',
    mobileBase,
    mobilePositives,
    mobileDeductions,
    CATEGORY_WEIGHTS.mobile
  )

  // 6. Structured Data / Schema Score
  let schemaBase = 100
  const schemaPositives = []
  const schemaDeductions = []

  if (schemaResult.summary.totalSchemas > 0) {
    schemaPositives.push(
      `+50 pts: ${schemaResult.summary.totalSchemas} Schema.org entity type(s) detected (${schemaResult.summary.schemasFound.join(', ')})`
    )
  } else {
    schemaBase -= 40
    schemaDeductions.push('-40 pts: No JSON-LD or Microdata structured data found')
  }

  if (schemaResult.summary.pagesWithOG > 0) {
    schemaPositives.push('+30 pts: Open Graph social metadata configured')
  } else {
    schemaBase -= 20
    schemaDeductions.push('-20 pts: Missing or incomplete Open Graph tags')
  }

  if (schemaResult.summary.pagesWithTwitter > 0) {
    schemaPositives.push('+20 pts: Twitter Card metadata configured')
  } else {
    schemaBase -= 10
    schemaDeductions.push('-10 pts: Missing Twitter Card tags')
  }

  const structuredDataScoreDetail = buildTransparentScore(
    'Structured Data & Schema',
    schemaBase,
    schemaPositives,
    schemaDeductions,
    CATEGORY_WEIGHTS.structuredData
  )

  // 7. Links Score
  let linkBase = 100
  const linkPositives = []
  const linkDeductions = []

  if (linkResult.summary.totalInternalLinks > 10) {
    linkPositives.push(
      `+50 pts: Healthy internal link distribution (${linkResult.summary.totalInternalLinks} total links)`
    )
  } else if (linkResult.summary.totalInternalLinks > 0) {
    linkPositives.push('+30 pts: Moderate internal link distribution')
  } else {
    linkBase -= 40
    linkDeductions.push('-40 pts: No internal cross-links detected between pages')
  }

  if (linkResult.summary.pagesWithFewLinks === 0) {
    linkPositives.push('+30 pts: No orphan or weak link pages')
  } else {
    const orphanPen = Math.min(20, linkResult.summary.pagesWithFewLinks * 5)
    linkBase -= orphanPen
    linkDeductions.push(
      `-${orphanPen} pts: ${linkResult.summary.pagesWithFewLinks} page(s) have fewer than 3 internal links`
    )
  }

  if (linkResult.summary.totalExternalLinks > 0) {
    linkPositives.push('+20 pts: Outbound reference citations present')
  }

  const linksScoreDetail = buildTransparentScore(
    'Internal & External Links',
    linkBase,
    linkPositives,
    linkDeductions,
    CATEGORY_WEIGHTS.links
  )

  // 8. Security Score
  let secBase = 100
  const secPositives = []
  const secDeductions = []

  if (crawlData.sslEnabled) {
    secPositives.push('+70 pts: SSL/TLS encryption active on domain')
  } else {
    secBase -= 70
    secDeductions.push('-70 pts: Non-HTTPS unencrypted connection')
  }

  const securityScoreDetail = buildTransparentScore(
    'Security & HTTPS',
    secBase,
    secPositives,
    secDeductions,
    CATEGORY_WEIGHTS.security
  )

  // Weighted Overall Score
  const overallScore = Math.round(
    technicalScoreDetail.score * CATEGORY_WEIGHTS.technical +
      onPageScoreDetail.score * CATEGORY_WEIGHTS.onPage +
      performanceScoreDetail.score * CATEGORY_WEIGHTS.performance +
      contentScoreDetail.score * CATEGORY_WEIGHTS.content +
      mobileScoreDetail.score * CATEGORY_WEIGHTS.mobile +
      structuredDataScoreDetail.score * CATEGORY_WEIGHTS.structuredData +
      linksScoreDetail.score * CATEGORY_WEIGHTS.links +
      securityScoreDetail.score * CATEGORY_WEIGHTS.security
  )

  const overallScoreClamped = clampScore(overallScore)
  const overallScoreDetail = buildTransparentScore(
    'Overall Site Health',
    overallScoreClamped,
    [
      `Technical SEO (${CATEGORY_WEIGHTS.technical * 100}% weight): ${technicalScoreDetail.score}/100`,
      `On-Page SEO (${CATEGORY_WEIGHTS.onPage * 100}% weight): ${onPageScoreDetail.score}/100`,
      `Performance (${CATEGORY_WEIGHTS.performance * 100}% weight): ${performanceScoreDetail.score}/100`,
      `Content Depth (${CATEGORY_WEIGHTS.content * 100}% weight): ${contentScoreDetail.score}/100`,
      `Mobile Usability (${CATEGORY_WEIGHTS.mobile * 100}% weight): ${mobileScoreDetail.score}/100`,
      `Structured Data (${CATEGORY_WEIGHTS.structuredData * 100}% weight): ${structuredDataScoreDetail.score}/100`,
      `Links Equity (${CATEGORY_WEIGHTS.links * 100}% weight): ${linksScoreDetail.score}/100`,
      `Security (${CATEGORY_WEIGHTS.security * 100}% weight): ${securityScoreDetail.score}/100`,
    ],
    allIssues
      .filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH')
      .map((i) => `[${i.severity}] ${i.title}`),
    1.0
  )

  return {
    overallScore: overallScoreClamped,
    overallScoreDetail,
    technicalScore: technicalScoreDetail.score,
    technicalScoreDetail,
    onPageScore: onPageScoreDetail.score,
    onPageScoreDetail,
    contentScore: contentScoreDetail.score,
    contentScoreDetail,
    performanceScore: performanceScoreDetail.score,
    performanceScoreDetail,
    mobileScore: mobileScoreDetail.score,
    mobileScoreDetail,
    structuredDataScore: structuredDataScoreDetail.score,
    structuredDataScoreDetail,
    linksScore: linksScoreDetail.score,
    linksScoreDetail,
    securityScore: securityScoreDetail.score,
    securityScoreDetail,
    allIssues,
    severityCounts: allSeverities,
    scoreBreakdown: {
      technical: technicalScoreDetail,
      onPage: onPageScoreDetail,
      content: contentScoreDetail,
      performance: performanceScoreDetail,
      mobile: mobileScoreDetail,
      structuredData: structuredDataScoreDetail,
      links: linksScoreDetail,
      security: securityScoreDetail,
      overall: overallScoreDetail,
    },
  }
}

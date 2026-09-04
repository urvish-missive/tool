import { crawlWebsite } from '../services/audit/crawler.js'
import { analyzeTechnical } from '../services/audit/technicalAnalyzer.js'
import { analyzeOnPage } from '../services/audit/onpageAnalyzer.js'
import { analyzeLinks } from '../services/audit/linkAnalyzer.js'
import { analyzeSchema } from '../services/audit/schemaAnalyzer.js'
import { calculateScores } from '../services/audit/seoAnalyzer.js'
import { analyzeAuditWithAI } from '../services/audit/aiAnalyzer.js'
import { getCompletePageSpeedAudit } from '../services/audit/pageSpeedService.js'
import { withTimeout } from '../utils/helpers.js'
import prisma from '../utils/prisma.js'

export async function createAudit(req, res) {
  try {
    const { websiteUrl, targetKeyword, country, preferredProvider } = req.body

    if (!websiteUrl)
      return res.status(400).json({ success: false, error: 'Website URL is required.' })

    let normalizedUrl
    try {
      const parsed = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res
          .status(400)
          .json({ success: false, error: 'Please enter a valid HTTP or HTTPS URL.' })
      }
      normalizedUrl = parsed.href
    } catch {
      return res.status(400).json({ success: false, error: 'Please enter a valid website URL.' })
    }

    console.log(`Starting comprehensive audit for: ${normalizedUrl}`)

    // 1. Crawl website & probe sitemap variations in parallel with PageSpeed
    let crawlData
    let pageSpeedData = null

    const crawlPromise = withTimeout(crawlWebsite(normalizedUrl), 45000, 'Crawl')
    const pageSpeedPromise = getCompletePageSpeedAudit(normalizedUrl)

    try {
      const [crawlResult, pageSpeedResult] = await Promise.allSettled([
        crawlPromise,
        pageSpeedPromise,
      ])

      if (crawlResult.status === 'rejected') {
        throw crawlResult.reason
      }
      crawlData = crawlResult.value
      pageSpeedData = pageSpeedResult.status === 'fulfilled' ? pageSpeedResult.value : null
      if (!pageSpeedData || pageSpeedData.mobile?.source?.includes('Live Network')) {
        pageSpeedData = await getCompletePageSpeedAudit(normalizedUrl, crawlData)
      }
    } catch (err) {
      console.error(`Crawl failed for ${normalizedUrl}:`, err)
      const msg = err.message?.includes('timeout')
        ? 'The website took too long to respond.'
        : err.message?.includes('Invalid URL')
          ? 'Please enter a valid website URL.'
          : err.message?.includes('Private')
            ? 'This URL points to an internal/private address.'
            : "We couldn't access this website. Please verify the URL."
      return res.status(400).json({ success: false, error: msg })
    }

    // 2. Perform modular diagnostics
    const technicalResult = analyzeTechnical(crawlData)
    const onpageResult = analyzeOnPage(crawlData.pages, targetKeyword)
    const linkResult = analyzeLinks(crawlData)
    const schemaResult = analyzeSchema(crawlData.pages)
    const scores = calculateScores(
      technicalResult,
      onpageResult,
      linkResult,
      schemaResult,
      crawlData,
      pageSpeedData
    )

    // 3. AI analysis with safe fallback
    let aiReport
    try {
      aiReport = await withTimeout(
        analyzeAuditWithAI({
          targetUrl: normalizedUrl,
          totalPages: crawlData.totalPages,
          overallScore: scores.overallScore,
          technicalScore: scores.technicalScore,
          onPageScore: scores.onPageScore,
          contentScore: scores.contentScore,
          performanceScore: scores.performanceScore,
          indexabilityScore: scores.technicalScore,
          linksScore: scores.linksScore,
          structuredDataScore: scores.structuredDataScore,
          allIssues: scores.allIssues,
          onpageSummary: onpageResult.summary,
          linkSummary: linkResult.summary,
          schemaSummary: schemaResult.summary,
          preferredProvider,
        }),
        25000,
        'AI analysis'
      )
    } catch (aiErr) {
      console.warn('AI analysis timed out or failed, using structured fallback:', aiErr.message)
      aiReport = await analyzeAuditWithAI({
        targetUrl: normalizedUrl,
        totalPages: crawlData.totalPages,
        overallScore: scores.overallScore,
        technicalScore: scores.technicalScore,
        onPageScore: scores.onPageScore,
        contentScore: scores.contentScore,
        performanceScore: scores.performanceScore,
        indexabilityScore: scores.technicalScore,
        linksScore: scores.linksScore,
        structuredDataScore: scores.structuredDataScore,
        allIssues: scores.allIssues,
        onpageSummary: onpageResult.summary,
        linkSummary: linkResult.summary,
        schemaSummary: schemaResult.summary,
      })
    }

    // 4. Build comprehensive report
    const report = {
      targetUrl: normalizedUrl,
      targetKeyword: targetKeyword || null,
      country: country || null,
      totalPages: crawlData.totalPages,
      overallScore: scores.overallScore,
      technicalScore: scores.technicalScore,
      onPageScore: scores.onPageScore,
      contentScore: scores.contentScore,
      performanceScore: scores.performanceScore,
      mobileScore: scores.mobileScore,
      linksScore: scores.linksScore,
      structuredDataScore: scores.structuredDataScore,
      securityScore: scores.securityScore,
      scoreBreakdown: scores.scoreBreakdown,
      severityCounts: scores.severityCounts,
      issues: scores.allIssues,
      technicalChecks: technicalResult.checks,
      sitemapProbe: crawlData.sitemapProbe,
      robotsTxt: crawlData.robotsTxt,
      robotsSitemapUrls: crawlData.robotsSitemapUrls,
      onpageSummary: onpageResult.summary,
      linkSummary: linkResult.summary,
      schemaSummary: schemaResult.summary,
      pageSpeed: pageSpeedData,
      pages: crawlData.pages.map((p) => ({
        url: p.url,
        statusCode: p.statusCode || 200,
        title: p.title,
        metaDescription: p.metaDescription,
        canonical: p.canonical,
        robotsMeta: p.robotsMeta,
        h1: p.h1 || [],
        h2: p.h2 || [],
        h3: p.h3 || [],
        h1Elements: p.h1Elements || [],
        h2Elements: p.h2Elements || [],
        h3Elements: p.h3Elements || [],
        wordCount: p.wordCount,
        imageCount: p.totalImages,
        missingAltCount: p.missingAltCount,
        imagesMissingAlt: (p.imagesMissingAlt || []).slice(0, 10),
        assets: p.assets,
        viewport: p.viewport,
        schemas: p.schemas,
        responseTimeMs: p.responseTimeMs,
        securityHeaders: p.securityHeaders,
        og: p.og,
        twitter: p.twitter,
      })),
      ai: aiReport,
      ai_report: aiReport,
    }

    // 5. Save to database
    let auditId = null
    try {
      const audit = await prisma.audit.create({
        data: {
          websiteUrl: normalizedUrl,
          targetKeyword: targetKeyword || null,
          country: country || null,
          overallScore: scores.overallScore,
          technicalScore: scores.technicalScore,
          onPageScore: scores.onPageScore,
          contentScore: scores.contentScore,
          performanceScore: scores.performanceScore,
          indexabilityScore: scores.technicalScore,
          linksScore: scores.linksScore,
          structuredDataScore: scores.structuredDataScore,
          status: 'completed',
          reportJson: JSON.stringify(report),
        },
      })
      auditId = audit.id

      // Save pages and top issues
      const pageOps = crawlData.pages.map((p) =>
        prisma.auditPage.create({
          data: {
            auditId,
            url: p.url,
            statusCode: p.statusCode || 200,
            title: p.title || null,
            metaDescription: p.metaDescription || null,
            canonical: p.canonical || null,
            h1Count: p.h1?.length || 0,
            h2Count: p.h2?.length || 0,
            h3Count: p.h3?.length || 0,
            wordCount: p.wordCount || 0,
            imageCount: p.totalImages || 0,
            missingAltCount: p.missingAltCount || 0,
            internalLinkCount: p.links?.internal?.length || 0,
            externalLinkCount: p.links?.external?.length || 0,
            responseTime: p.responseTimeMs || 0,
            isIndexable: !/noindex/i.test(p.robotsMeta || ''),
          },
        })
      )

      const issueOps = scores.allIssues.slice(0, 50).map((issue) =>
        prisma.auditIssue.create({
          data: {
            auditId,
            category: issue.category,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            recommendation: issue.recommendation,
          },
        })
      )

      await Promise.allSettled([...pageOps, ...issueOps])
    } catch (dbErr) {
      console.error('DB save failed (non-fatal):', dbErr.message)
    }

    console.log(`✓ Audit complete for ${normalizedUrl} — score: ${scores.overallScore}/100`)
    res.json({ success: true, auditId, report })
  } catch (err) {
    console.error('Audit controller error:', err)
    res.status(500).json({ success: false, error: 'Audit failed. Please try again.' })
  }
}

export async function getAudit(req, res) {
  try {
    const audit = await prisma.audit.findUnique({ where: { id: req.params.id } })
    if (!audit) return res.status(404).json({ success: false, error: 'Audit not found.' })
    res.json({ success: true, report: JSON.parse(audit.reportJson) })
  } catch (err) {
    console.error('Get audit error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to retrieve audit.' })
  }
}

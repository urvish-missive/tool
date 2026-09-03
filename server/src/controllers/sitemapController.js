import { crawlWebsite, generateFromUrls, validateSitemapData } from '../services/sitemapGenerator.js'
import prisma from '../utils/prisma.js'

export const generateSitemap = async (req, res) => {
  try {
    const {
      mode = 'crawler',
      websiteUrl,
      urls,
      maxPages = 50,
      crawlDepth = 3,
      includeImages = true,
      defaultChangefreq,
      defaultPriority,
      excludePatterns,
      leadId,
    } = req.body

    let result
    if (mode === 'manual') {
      let urlList = urls
      if (typeof urls === 'string') {
        urlList = urls
          .split(/[\n,]+/)
          .map(u => u.trim())
          .filter(Boolean)
      }
      if (!Array.isArray(urlList) || urlList.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Please provide at least one valid URL for manual generation.',
        })
      }
      result = generateFromUrls({
        urls: urlList,
        defaultChangefreq,
        defaultPriority,
        includeImages,
      })
    } else {
      if (!websiteUrl || typeof websiteUrl !== 'string' || websiteUrl.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: 'A valid website URL is required (e.g. https://example.com).',
        })
      }
      result = await crawlWebsite({
        websiteUrl: websiteUrl.trim(),
        maxPages,
        crawlDepth,
        includeImages,
        defaultChangefreq,
        defaultPriority,
        excludePatterns,
      })
    }

    // Persist to database if available
    let sitemapRecord = null
    try {
      sitemapRecord = await prisma.sitemapGeneration.create({
        data: {
          websiteUrl: result.websiteUrl,
          totalUrls: result.totalUrls,
          totalImages: result.totalImages,
          xmlContent: result.xmlContent,
          sourceType: mode,
          settingsJson: JSON.stringify({
            maxPages,
            crawlDepth,
            includeImages,
            defaultChangefreq,
            defaultPriority,
          }),
        },
      })

      // If a lead was submitted alongside, link it
      if (leadId && sitemapRecord) {
        await prisma.lead.update({
          where: { id: leadId },
          data: { sitemapId: sitemapRecord.id },
        }).catch(() => {})
      }
    } catch (dbErr) {
      console.warn('Could not persist sitemap record:', dbErr.message)
    }

    res.json({
      ...result,
      id: sitemapRecord?.id || null,
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate XML sitemap. Please check the URL and try again.',
    })
  }
}

export const validateSitemap = async (req, res) => {
  try {
    const { sitemapUrl, xmlContent } = req.body

    if ((!sitemapUrl || sitemapUrl.trim().length === 0) && (!xmlContent || xmlContent.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a sitemap URL or raw XML content to validate.',
      })
    }

    const result = await validateSitemapData({
      sitemapUrl: sitemapUrl?.trim(),
      xmlContent: xmlContent?.trim(),
    })

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Sitemap validation error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate sitemap.',
    })
  }
}

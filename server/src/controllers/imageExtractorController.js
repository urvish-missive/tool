import { extractWebsiteImages } from '../services/imageExtractor.js'
import { validateURL, resolveAndValidate, fetchWithTimeout } from '../utils/helpers.js'
import prisma from '../utils/prisma.js'

/**
 * POST /api/image-extractor/extract
 * Extract all images, SVGs, Open Graph banners, and favicons from a website URL
 */
export async function extractImagesHandler(req, res) {
  try {
    const { url, leadId } = req.body

    if (!url || typeof url !== 'string' || url.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid website URL (e.g., https://example.com or example.com).',
      })
    }

    const result = await extractWebsiteImages(url.trim())

    // Persist to database (best effort)
    let recordId = null
    try {
      if (prisma?.extractedImageProject?.create) {
        const record = await prisma.extractedImageProject.create({
          data: {
            websiteUrl: result.websiteUrl,
            totalImages: result.totalImages,
            imagesJson: JSON.stringify(result.images),
            statsJson: JSON.stringify(result.stats),
          },
        })
        recordId = record?.id || null

        // Link with lead if provided
        if (leadId && recordId && prisma?.lead?.update) {
          await prisma.lead
            .update({
              where: { id: leadId },
              data: { extractedImagesId: recordId },
            })
            .catch(() => {})
        }
      }
    } catch (dbErr) {
      console.warn('ExtractedImageProject persistence skipped:', dbErr.message)
    }

    res.json({
      success: true,
      ...result,
      id: recordId,
    })
  } catch (error) {
    console.error('Image Extractor Handler error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract images from website. Please check the URL.',
    })
  }
}

/**
 * GET /api/image-extractor/download?url=...&filename=...
 * Proxy download endpoint to bypass browser CORS restrictions when saving images
 */
export async function proxyImageDownloadHandler(req, res) {
  try {
    const { url: targetUrl, filename } = req.query

    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).send('Image URL query parameter is required.')
    }

    const parsed = validateURL(targetUrl)
    await resolveAndValidate(parsed.hostname)

    const response = await fetchWithTimeout(
      parsed.href,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      },
      15000
    )

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image from source server.')
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const cleanFilename = (filename || 'downloaded-image').replace(/[^a-zA-Z0-9._-]/g, '_')

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`)

    const arrayBuffer = await response.arrayBuffer()
    res.send(Buffer.from(arrayBuffer))
  } catch (err) {
    console.error('Proxy Image Download error:', err.message)
    res.status(500).send('Could not download image: ' + err.message)
  }
}

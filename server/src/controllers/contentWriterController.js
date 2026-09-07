import { generateContent, rewriteContent, generateMetaTags } from '../services/contentWriter.js'
import prisma from '../utils/prisma.js'

/**
 * POST /api/content-writer/generate
 */
export async function generateContentHandler(req, res) {
  try {
    const {
      keyword,
      contentType,
      targetAudience,
      tone,
      wordCount,
      preferredProvider,
      websiteUrl,
      secondaryKeywords,
      includeMeta,
      includeSchema,
    } = req.body

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a keyword or topic (at least 2 characters).',
      })
    }

    const validTypes = ['blog-post', 'product-page', 'landing-page', 'pillar-page', 'listicle', 'how-to', 'case-study', 'email']
    const type = validTypes.includes(contentType) ? contentType : 'blog-post'

    const validTones = ['professional', 'casual', 'technical', 'persuasive', 'educational', 'conversational', 'authoritative', 'friendly']
    const toneVal = validTones.includes(tone) ? tone : 'professional'

    const wc = Math.min(Math.max(parseInt(wordCount) || 1500, 300), 5000)

    const result = await generateContent({
      keyword: keyword.trim(),
      contentType: type,
      targetAudience: targetAudience?.trim() || '',
      tone: toneVal,
      wordCount: wc,
      preferredProvider,
      websiteUrl: websiteUrl?.trim() || '',
      secondaryKeywords,
      includeMeta: includeMeta !== false,
      includeSchema: includeSchema !== false,
    })

    // Save to DB
    let savedId = null
    try {
      const saved = await prisma.contentWriter.create({
        data: {
          keyword: keyword.trim(),
          contentType: type,
          tone: toneVal,
          title: result.title,
          contentJson: JSON.stringify(result),
          wordCount: result.actualWordCount || wc,
        },
      })
      savedId = saved.id
    } catch (dbErr) {
      console.error('DB save failed (non-fatal):', dbErr.message)
    }

    res.json({
      success: true,
      contentId: savedId,
      ...result,
    })
  } catch (err) {
    console.error('Content writer error:', err.message)
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate content. Please try again.',
    })
  }
}

/**
 * POST /api/content-writer/rewrite
 */
export async function rewriteContentHandler(req, res) {
  try {
    const { originalContent, improvementType, tone, preferredProvider } = req.body

    if (!originalContent || typeof originalContent !== 'string' || originalContent.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Please provide content to rewrite (at least 20 characters).',
      })
    }

    const validImprovements = ['seo', 'readability', 'engagement', 'brevity', 'expand', 'tone']
    const type = validImprovements.includes(improvementType) ? improvementType : 'seo'

    const result = await rewriteContent({
      originalContent: originalContent.trim(),
      improvementType: type,
      tone: tone || 'professional',
      preferredProvider,
    })

    res.json({ success: true, ...result })
  } catch (err) {
    console.error('Content rewrite error:', err.message)
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to rewrite content. Please try again.',
    })
  }
}

/**
 * POST /api/content-writer/meta-tags
 */
export async function generateMetaTagsHandler(req, res) {
  try {
    const { title, content, keyword, preferredProvider } = req.body

    if (!title && !content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a title or content to generate meta tags.',
      })
    }

    const result = await generateMetaTags({
      title: title || '',
      content: content || '',
      keyword: keyword || '',
      preferredProvider,
    })

    res.json({ success: true, ...result })
  } catch (err) {
    console.error('Meta tags error:', err.message)
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate meta tags.',
    })
  }
}

/**
 * GET /api/content-writer/:id
 */
export async function getContentHandler(req, res) {
  try {
    const { id } = req.params
    const saved = await prisma.contentWriter.findUnique({
      where: { id: parseInt(id) },
    })

    if (!saved) {
      return res.status(404).json({ success: false, error: 'Content not found.' })
    }

    res.json({
      success: true,
      contentId: saved.id,
      keyword: saved.keyword,
      contentType: saved.contentType,
      tone: saved.tone,
      title: saved.title,
      content: JSON.parse(saved.contentJson),
      wordCount: saved.wordCount,
      createdAt: saved.createdAt,
    })
  } catch (err) {
    console.error('Get content error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to retrieve content.' })
  }
}

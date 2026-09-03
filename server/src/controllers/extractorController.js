import { extractWebsiteContent, askWebsiteQuestion } from '../services/websiteExtractor.js'
import prisma from '../utils/prisma.js'

/**
 * POST /api/extractor/extract
 * Extract clean content, metadata, schema, ownership clues, and initial AI synthesis from a URL
 */
export async function extractWebsiteHandler(req, res) {
  try {
    const { url, preferredProvider, extractAIOverview = true, leadId } = req.body

    if (!url || typeof url !== 'string' || url.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid website URL (e.g., https://example.com or example.com).',
      })
    }

    const result = await extractWebsiteContent(url.trim(), {
      preferredProvider,
      extractAIOverview: Boolean(extractAIOverview),
    })

    // Persist to database (best effort)
    let recordId = null
    try {
      if (prisma?.extractedWebsite?.create) {
        const record = await prisma.extractedWebsite.create({
          data: {
            websiteUrl: result.url,
            title: result.metadata?.title || null,
            metaDescription: result.metadata?.description || null,
            wordCount: result.content?.wordCount || 0,
            extractedDataJson: JSON.stringify({
              url: result.url,
              hostname: result.hostname,
              metadata: result.metadata,
              contacts: result.contacts,
              jsonLd: result.jsonLd,
              headings: result.content?.headings || [],
              headingsCount: result.content?.headingsCount || {},
              links: result.content?.links || {},
              images: result.content?.images || {},
              wordCount: result.content?.wordCount || 0,
              charCount: result.content?.charCount || 0,
              readingTimeMinutes: result.content?.readingTimeMinutes || 1,
            }),
            aiSummaryJson: result.aiOverview ? JSON.stringify(result.aiOverview) : null,
          },
        })
        recordId = record?.id || null

        // Link with lead if provided
        if (leadId && recordId && prisma?.lead?.update) {
          await prisma.lead
            .update({
              where: { id: leadId },
              data: { extractedWebsiteId: recordId },
            })
            .catch(() => {})
        }
      }
    } catch (dbErr) {
      console.warn('ExtractedWebsite persistence skipped:', dbErr.message)
    }

    res.json({
      success: true,
      ...result,
      id: recordId,
    })
  } catch (error) {
    console.error('Extract Website Handler error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract website content. Please check the URL and try again.',
    })
  }
}

/**
 * POST /api/extractor/ask
 * Grounded AI Q&A answering questions based strictly on the extracted website content
 */
export async function askWebsiteQuestionHandler(req, res) {
  try {
    const { url, question, extractedData, chatHistory, preferredProvider } = req.body

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a question to ask about this website.',
      })
    }

    if (!extractedData || (!extractedData.content?.plainText && !extractedData.markdown && !extractedData.content?.markdown)) {
      return res.status(400).json({
        success: false,
        error: 'Missing extracted website data. Please extract the website first before asking questions.',
      })
    }

    const answerPayload = await askWebsiteQuestion({
      url,
      question: question.trim(),
      extractedData,
      chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
      preferredProvider,
    })

    res.json({
      success: true,
      ...answerPayload,
    })
  } catch (error) {
    console.error('Ask Website Question Handler error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to answer question. Please try again.',
    })
  }
}

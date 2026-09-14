import { generateFAQs } from '../services/faqGenerator.js'
import prisma from '../utils/prisma.js'

export const generateFaqs = async (req, res) => {
  try {
    const { topic, targetKeywords, count = 8, preferredProvider } = req.body

    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required and must be at least 2 characters',
      })
    }

    const safeTopic = topic.trim()
    const safeCount = Math.min(Math.max(parseInt(count) || 8, 3), 15)

    const result = await generateFAQs({
      topic: safeTopic,
      targetKeywords: targetKeywords?.trim(),
      count: safeCount,
      preferredProvider,
    })

    // Persist so a lead captured after viewing this result can be linked to
    // it, and so a client-side generated PDF can be stored here for later
    // sending.
    let faqId = null
    try {
      const saved = await prisma.faqGeneration.create({
        data: {
          topic: safeTopic,
          keywords: targetKeywords?.trim() || null,
          faqsJson: JSON.stringify(result.faqs || []),
          questionCount: Array.isArray(result.faqs) ? result.faqs.length : safeCount,
        },
      })
      faqId = saved.id
    } catch (dbErr) {
      console.error('FaqGeneration save failed (non-fatal):', dbErr.message)
    }

    res.json({ ...result, faqId })
  } catch (error) {
    console.error('FAQ generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate FAQs. Please try again.',
    })
  }
}

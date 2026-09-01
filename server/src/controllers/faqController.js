import { generateFAQs } from '../services/faqGenerator.js'

export const generateFaqs = async (req, res) => {
  try {
    const { topic, targetKeywords, count = 8, preferredProvider } = req.body

    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required and must be at least 2 characters',
      })
    }

    const result = await generateFAQs({
      topic: topic.trim(),
      targetKeywords: targetKeywords?.trim(),
      count: Math.min(Math.max(parseInt(count) || 8, 3), 15),
      preferredProvider,
    })

    res.json(result)
  } catch (error) {
    console.error('FAQ generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate FAQs. Please try again.',
    })
  }
}

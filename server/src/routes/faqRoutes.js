import express from 'express'
import { generateFaqs } from '../controllers/faqController.js'

const router = express.Router()

// POST /api/faqs/generate - Generate FAQs for a topic
router.post('/generate', generateFaqs)

export default router

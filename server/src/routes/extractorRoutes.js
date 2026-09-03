import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { extractWebsiteHandler, askWebsiteQuestionHandler } from '../controllers/extractorController.js'

const router = Router()

const extractorLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit reached for Website Extractor. Please try again later.' },
  keyGenerator: (req) => req.ip,
})

router.post('/extract', extractorLimiter, extractWebsiteHandler)
router.post('/ask', extractorLimiter, askWebsiteQuestionHandler)

export default router

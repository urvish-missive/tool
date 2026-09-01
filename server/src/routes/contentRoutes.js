import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { analyzeContentHandler } from '../controllers/contentController.js'
import { validateAnalysis } from '../middleware/validate.js'

const router = Router()

// Per-route rate limit: 10 analyses per IP per hour
const analyzeLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'You\'ve reached the current analysis limit. Please try again later.' },
  keyGenerator: (req) => req.ip,
})

router.post('/analyze', analyzeLimiter, validateAnalysis, analyzeContentHandler)

export default router

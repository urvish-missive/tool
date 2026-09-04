import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  analyzeContentQAHandler,
  polishContentQAHandler,
  importContentQAHandler,
} from '../controllers/contentQaController.js'

const router = Router()

const qaLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit reached. Please try again later.' },
  keyGenerator: (req) => req.ip,
})

router.post('/analyze', qaLimiter, analyzeContentQAHandler)
router.post('/polish', qaLimiter, polishContentQAHandler)
router.post('/import', qaLimiter, importContentQAHandler)

export default router


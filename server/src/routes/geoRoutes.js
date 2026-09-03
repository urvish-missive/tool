import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { analyzeGeoHandler } from '../controllers/geoController.js'

const router = Router()

// Rate limit: 25 analyses per IP per hour
const geoLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit reached for GEO Analyzer. Please try again later.' },
  keyGenerator: (req) => req.ip,
})

router.post('/analyze', geoLimiter, analyzeGeoHandler)

export default router

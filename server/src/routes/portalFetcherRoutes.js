import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { fetchPortalDataHandler } from '../controllers/portalFetcherController.js'

const router = Router()

const fetcherLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit reached for Portal Data Fetcher. Please try again later.' },
  keyGenerator: (req) => req.ip,
})

router.post('/fetch', fetcherLimiter, fetchPortalDataHandler)

export default router

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { generateSocialPlanHandler } from '../controllers/socialPlannerController.js'

const router = Router()

const plannerLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit reached for Social Media Planner. Please try again later.' },
  keyGenerator: (req) => req.ip,
})

router.post('/generate', plannerLimiter, generateSocialPlanHandler)

export default router

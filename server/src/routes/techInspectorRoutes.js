import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { inspectTechAndThemeHandler } from '../controllers/techInspectorController.js'

const router = Router()

const inspectorLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit reached for Tech & Theme Inspector. Please try again later.' },
  keyGenerator: (req) => req.ip,
})

router.post('/inspect', inspectorLimiter, inspectTechAndThemeHandler)

export default router

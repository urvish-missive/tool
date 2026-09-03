import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  extractImagesHandler,
  proxyImageDownloadHandler,
} from '../controllers/imageExtractorController.js'

const router = Router()

const imageLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit reached for Image Extractor. Please try again later.' },
  keyGenerator: (req) => req.ip,
})

router.post('/extract', imageLimiter, extractImagesHandler)
router.get('/download', proxyImageDownloadHandler)

export default router

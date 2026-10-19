import express from 'express'
import rateLimit from 'express-rate-limit'
import prisma from '../utils/prisma.js'
import { toolAccess } from '../middleware/toolAccess.js'
import { me, cluster, outline, draft, wordpress } from '../controllers/hubSpokeController.js'

const TOOL_SLUG = 'blog-topics'
const {
  HUB_SPOKE_PLANS_PER_HOUR = '5',
  HUB_SPOKE_OUTLINES_PER_HOUR = '20',
  HUB_SPOKE_DRAFTS_PER_HOUR = '10',
} = process.env

const router = express.Router()

// Per-IP hourly limits: every plan, outline and draft is one paid model call.
const limiter = (perHour) =>
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: Number(perHour) || 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      code: 'rate_limited',
      error: 'Too many requests for this tool. Please try again in an hour.',
    },
  })

// Outlines, drafts and WordPress follow the admin on/off switch but do not use up the
// visitor's device limit; only building a plan does.
async function toolEnabled(req, res, next) {
  try {
    const config = await prisma.toolConfig.findUnique({ where: { slug: TOOL_SLUG } })
    if (config && !config.enabled)
      return res
        .status(403)
        .json({
          success: false,
          toolDisabled: true,
          error: 'This tool is temporarily unavailable. Please try again later.',
        })
  } catch {}
  next()
}

// GET  /api/hub-spoke/me        -> { success, pro }
// POST /api/hub-spoke/cluster   -> { success, plan }
// POST /api/hub-spoke/outline   -> { success, outline } (upgraded plan)
// POST /api/hub-spoke/draft     -> { success, draft } (upgraded plan)
// POST /api/hub-spoke/wordpress -> { success, id, url } draft post (upgraded plan; needs WP_* in .env)
router.get('/me', me)
router.post('/cluster', limiter(HUB_SPOKE_PLANS_PER_HOUR), toolAccess(TOOL_SLUG), cluster)
router.post('/outline', limiter(HUB_SPOKE_OUTLINES_PER_HOUR), toolEnabled, outline)
router.post('/draft', limiter(HUB_SPOKE_DRAFTS_PER_HOUR), toolEnabled, draft)
router.post('/wordpress', limiter(30), toolEnabled, wordpress)

export default router

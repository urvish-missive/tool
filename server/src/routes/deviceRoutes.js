import { Router } from 'express'
import {
  linkDeviceEmailHandler,
  getDeviceStatusHandler,
} from '../controllers/deviceController.js'

const router = Router()

// POST /api/devices/link-email — Link user's email to their device
router.post('/link-email', linkDeviceEmailHandler)

// GET /api/devices/status — Check usage count and limit for current device
router.get('/status', getDeviceStatusHandler)

export default router

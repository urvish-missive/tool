import { Router } from 'express'
import {
  generateLogoHandler,
  generateVariationsHandler,
  getLogoHandler,
} from '../controllers/logoController.js'

const router = Router()

// POST /api/logo/generate — Generate a single AI logo
router.post('/generate', generateLogoHandler)

// POST /api/logo/variations — Generate multiple logo variations
router.post('/variations', generateVariationsHandler)

// GET /api/logo/:id — Get a saved logo
router.get('/:id', getLogoHandler)

export default router

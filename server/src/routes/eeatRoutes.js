import { Router } from 'express'
import { analyzeEeatHandler, getEeatTypesHandler } from '../controllers/eeatController.js'

const router = Router()

// POST /api/eeat/analyze — Analyze webpage or draft text for E-E-A-T & AI Search authority
router.post('/analyze', analyzeEeatHandler)

// GET /api/eeat/types — Get supported E-E-A-T content types
router.get('/types', getEeatTypesHandler)

export default router

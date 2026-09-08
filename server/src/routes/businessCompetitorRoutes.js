import { Router } from 'express'
import { analyzeBusinessCompetitorSite } from '../controllers/businessCompetitorController.js'

const router = Router()

// POST /api/business-competitor/analyze
router.post('/analyze', analyzeBusinessCompetitorSite)

export default router

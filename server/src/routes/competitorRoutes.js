import express from 'express'
import { analyzeCompetitorSite } from '../controllers/competitorController.js'

const router = express.Router()

// POST /api/competitors/analyze - Analyze a competitor website
router.post('/analyze', analyzeCompetitorSite)

export default router

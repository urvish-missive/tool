import { Router } from 'express'
import { generateCaseStudyHandler } from '../controllers/caseStudyController.js'

const router = Router()

// POST /api/case-study/generate — Generate full B2B case study with marketing distribution strategy
router.post('/generate', generateCaseStudyHandler)

export default router

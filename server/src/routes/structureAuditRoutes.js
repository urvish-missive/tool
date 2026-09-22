import { Router } from 'express'
import {
  analyzeWebsiteStructure,
  getStructureAuditById,
} from '../controllers/structureAuditController.js'

const router = Router()

// POST /api/structure-audit/analyze
router.post('/analyze', analyzeWebsiteStructure)

// GET /api/structure-audit/:id
router.get('/:id', getStructureAuditById)

export default router

import { Router } from 'express'
import { createAudit, getAudit } from '../controllers/auditController.js'

const router = Router()

router.post('/', createAudit)
router.get('/:id', getAudit)

export default router
